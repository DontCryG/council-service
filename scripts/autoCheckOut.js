import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Reuse the config from your web app
const firebaseConfig = {
  apiKey: "AIzaSyDz1VFwr66FaEdcBRrvcg4VO6LLbNn2lCc",
  authDomain: "council-service-dd3a4.firebaseapp.com",
  projectId: "council-service-dd3a4",
  storageBucket: "council-service-dd3a4.firebasestorage.app",
  messagingSenderId: "640229308786",
  appId: "1:640229308786:web:04e76e31d7b623fe2005eb",
  measurementId: "G-KYKCJ1TD1F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper functions (copied from DutySystem.jsx)
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 นาที';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} นาที`;
  return `${h} ชม. ${m > 0 ? m + ' นาที' : ''}`;
}

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  // Manual formatting for Node.js to match th-TH timezone
  const thTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  return thTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function getNextBoundary(checkInTs) {
  const d = new Date(checkInTs);
  // We need to work in Thailand time (UTC+7), but JS Date is system local time.
  // We can simplify by just using the current Date object IF the server runs on UTC.
  // Actually, GitHub Actions runs on UTC. So we must adjust to UTC+7.
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const th = new Date(utc + (3600000 * 7)); // Thailand Time

  const b18 = new Date(th);
  b18.setHours(18, 0, 0, 0);
  const b24 = new Date(th);
  b24.setHours(23, 59, 0, 0);

  // Convert boundaries back to UTC timestamps
  const toUtcTs = (thDate) => thDate.getTime() - (3600000 * 7);

  const checkInThTs = th.getTime();

  if (checkInThTs < b18.getTime()) return toUtcTs(b18);
  if (checkInThTs < b24.getTime()) return toUtcTs(b24);

  const nextDay18 = new Date(th);
  nextDay18.setDate(nextDay18.getDate() + 1);
  nextDay18.setHours(18, 0, 0, 0);
  return toUtcTs(nextDay18);
}

async function sendDiscordWebhook(webhookUrl, embed) {
  if (!webhookUrl) return;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    if (!res.ok) console.error("Discord error:", await res.text());
  } catch (err) {
    console.error("Webhook fetch error:", err);
  }
}

async function runAutoCheckOut() {
  console.log("Starting Auto CheckOut Job at", new Date().toISOString());
  
  try {
    const dutyDocRef = doc(db, 'app_state', 'duty');
    const councilDocRef = doc(db, 'app_state', 'council_members');
    
    const [dutySnap, councilSnap] = await Promise.all([
      getDoc(dutyDocRef),
      getDoc(councilDocRef)
    ]);
    
    if (!dutySnap.exists()) {
      console.log("No duty data found.");
      process.exit(0);
    }
    
    const dutyData = dutySnap.data();
    const councilMembers = councilSnap.exists() ? (councilSnap.data().members || []) : [];
    
    if (!dutyData.activeSessions || Object.keys(dutyData.activeSessions).length === 0) {
      console.log("No active sessions to process.");
      process.exit(0);
    }

    let hasChanges = false;
    const newActive = { ...dutyData.activeSessions };
    const newSessions = [...(dutyData.sessions || [])];
    const now = Date.now();
    
    // Check if webhook URL is provided in ENV
    const WEBHOOK_URL = process.env.WEBHOOK_DUTY_IN;

    for (const [memberId, session] of Object.entries(newActive)) {
      const boundary = getNextBoundary(session.checkIn);
      
      if (now >= boundary) {
        console.log(`Auto checking out member ${memberId}...`);
        const checkOut = boundary;
        let totalBreak = session.totalBreakMinutes || 0;
        
        if (session.status === 'break' && session.breakStart) {
           const breakEnd = Math.min(now, boundary);
           totalBreak += (breakEnd - session.breakStart) / 60000;
        }
        
        const rawMinutes = (checkOut - session.checkIn) / 60000;
        const netMinutes = Math.max(0, Math.round(rawMinutes - totalBreak));

        const member = councilMembers.find(m => m.id === memberId);
        
        const newSession = {
          id: 'duty_auto_' + session.checkIn,
          memberId: memberId,
          memberName: member?.name || 'Unknown',
          checkIn: session.checkIn,
          checkOut,
          netMinutes,
          totalBreakMinutes: Math.round(totalBreak),
          date: new Date(session.checkIn).toISOString().split('T')[0],
          month: new Date(session.checkIn).toISOString().slice(0, 7),
          autoCheckOut: true
        };

        newSessions.unshift(newSession);
        delete newActive[memberId];
        hasChanges = true;

        if (WEBHOOK_URL) {
          const embed = {
            title: "🔴 ออกจากหน้าที่ (Auto Clock Out)",
            color: 0xef4444,
            fields: [
              { name: "👤 สมาชิก", value: member?.name || 'Unknown', inline: true },
              { name: "⏰ เวลาเข้า", value: formatTime(session.checkIn) + ' น.', inline: true },
              { name: "⏰ เวลาออก", value: formatTime(checkOut) + ' น.', inline: true },
              { name: "⏳ เวลาสุทธิ", value: formatDuration(netMinutes), inline: true },
              { name: "☕ เวลาพักรวม", value: formatDuration(Math.round(totalBreak)), inline: true },
              { name: "ℹ️ หมายเหตุ", value: "ระบบเช็คเอาท์อัตโนมัติเมื่อหมดกะ (Cron Job)", inline: false }
            ],
            footer: { text: "Council Duty System" },
            timestamp: new Date(checkOut).toISOString()
          };
          await sendDiscordWebhook(WEBHOOK_URL, embed);
        } else {
          console.warn("WEBHOOK_DUTY_IN env var is missing. Skipped sending Discord log.");
        }
      }
    }

    if (hasChanges) {
      await setDoc(dutyDocRef, { ...dutyData, activeSessions: newActive, sessions: newSessions, updated_at: now });
      console.log("Successfully updated duty data in Firestore.");
    } else {
      console.log("No active sessions crossed the boundary. No updates needed.");
    }
    
    console.log("Job completed.");
    process.exit(0);

  } catch (error) {
    console.error("Error running auto checkout job:", error);
    process.exit(1);
  }
}

runAutoCheckOut();
