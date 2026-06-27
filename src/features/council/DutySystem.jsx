import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  ClockClockwise, SignIn, SignOut, Coffee,
  MagnifyingGlass, UserCircle, Info, Circle, CalendarBlank
} from '@phosphor-icons/react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { sendWebhook, saveTransactionLog, listenTransactionLogs } from '../../core/api';

const monthNamesShort = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 นาที';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} นาที`;
  return `${h} ชม. ${m > 0 ? m + ' นาที' : ''}`;
}

function formatTime(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatThaiDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${d.getDate()} ${monthNamesShort[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function toInputDate(ts) {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextBoundary(checkInTs) {
  const d = new Date(checkInTs);
  const b18 = new Date(d);
  b18.setHours(18, 0, 0, 0);
  const b24 = new Date(d);
  b24.setHours(23, 59, 0, 0);
  
  if (checkInTs < b18.getTime()) return b18.getTime();
  if (checkInTs < b24.getTime()) return b24.getTime();
  
  const nextDay18 = new Date(d);
  nextDay18.setDate(nextDay18.getDate() + 1);
  nextDay18.setHours(18, 0, 0, 0);
  return nextDay18.getTime();
}

export default function DutySystem() {
  const { showAlert, user } = useAppStore();
  const [dutyData, setDutyData] = useState({ sessions: [], activeSessions: {} });
  const [councilMembers, setCouncilMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('duty');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({ memberId: '', type: 'ลากิจ (Personal)', dateFrom: '', dateTo: '', reason: '' });
  const LEAVE_TYPES = ['ลากิจ (Personal)', 'ลาป่วย (Sick)', 'ลาพักร้อน (Vacation)', 'ลากิจพิเศษ (Special)'];

  // Resign Form State
  const [resignForm, setResignForm] = useState({ memberId: '', lastDay: '', reason: '', confirmed: false });

  // Auto-detect logged-in member by email or displayName
  const currentMember = councilMembers.find(m =>
    m.id === user?.uid ||
    m.username === user?.email ||
    m.email === user?.email ||
    m.name === user?.displayName
  );

  // Date filter for history
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`;
  const today = toInputDate(Date.now());
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);
  const [filteredHistory, setFilteredHistory] = useState([]);

  // Live timer tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const [transactionLogs, setTransactionLogs] = useState([]);

  useEffect(() => {
    const unsubDuty = onSnapshot(doc(db, 'app_state', 'duty'), (snap) => {
      if (snap.exists()) setDutyData(snap.data());
      else setDutyData({ sessions: [], activeSessions: {} });
      setLoading(false);
    });
    const unsubCouncil = onSnapshot(doc(db, 'app_state', 'council_members'), (snap) => {
      if (snap.exists()) setCouncilMembers(snap.data().members || []);
    });
    const unsubLogs = listenTransactionLogs((data) => {
      setTransactionLogs(data);
    });
    return () => { unsubDuty(); unsubCouncil(); unsubLogs(); };
  }, []);

  // Auto-checkout effect
  useEffect(() => {
    if (!dutyData?.activeSessions || Object.keys(dutyData.activeSessions).length === 0) return;
    if (!councilMembers.length) return;

    let hasChanges = false;
    const newActive = { ...dutyData.activeSessions };
    const newSessions = [...(dutyData.sessions || [])];
    const now = Date.now();

    for (const [memberId, session] of Object.entries(newActive)) {
      const boundary = getNextBoundary(session.checkIn);
      if (now >= boundary) {
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

        try {
          sendWebhook('duty_in', {
            embeds: [{
              title: "🔴 ออกจากหน้าที่ (Auto Clock Out)",
              color: 0xef4444,
              fields: [
                { name: "👤 สมาชิก", value: member?.name || 'Unknown', inline: true },
                { name: "⏰ เวลาเข้า", value: formatTime(session.checkIn) + ' น.', inline: true },
                { name: "⏰ เวลาออก", value: formatTime(checkOut) + ' น.', inline: true },
                { name: "⏳ เวลาสุทธิ", value: formatDuration(netMinutes), inline: true },
                { name: "☕ เวลาพักรวม", value: formatDuration(Math.round(totalBreak)), inline: true },
                { name: "ℹ️ หมายเหตุ", value: "ระบบเช็คเอาท์อัตโนมัติเมื่อหมดกะ", inline: false }
              ],
              footer: { text: "Council Duty System" },
              timestamp: new Date(checkOut).toISOString()
            }]
          }).catch(console.error);
        } catch(e) { console.error("Webhook error:", e); }
      }
    }

    if (hasChanges) {
      saveToDb({ ...dutyData, activeSessions: newActive, sessions: newSessions });
    }
  }, [dutyData.activeSessions, tick, councilMembers]);

  // Auto-set selectedMemberId and leaveForm.memberId when members load
  useEffect(() => {
    if (currentMember && !selectedMemberId) {
      setSelectedMemberId(currentMember.id);
      setLeaveForm(f => ({ ...f, memberId: currentMember.id }));
      setResignForm(f => ({ ...f, memberId: currentMember.id }));
    }
  }, [currentMember?.id]);

  const saveToDb = async (newData) => {
    try {
      await setDoc(doc(db, 'app_state', 'duty'), { ...newData, updated_at: Date.now() });
    } catch (e) {
      console.error(e);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleCheckIn = async () => {
    if (!selectedMemberId) { showAlert('error', 'กรุณาเลือกชื่อสมาชิกก่อน'); return; }
    if (dutyData.activeSessions?.[selectedMemberId]) { showAlert('error', 'สมาชิกคนนี้กำลังเข้าเวรอยู่แล้ว'); return; }
    
    const nowTs = Date.now();
    const newActive = {
      ...dutyData.activeSessions,
      [selectedMemberId]: { checkIn: nowTs, status: 'working', breakStart: null, totalBreakMinutes: 0 }
    };
    saveToDb({ ...dutyData, activeSessions: newActive });
    
    const memberName = councilMembers.find(m => m.id === selectedMemberId)?.name || 'Unknown';
    try {
      await sendWebhook('duty_in', {
        embeds: [{
          title: "🟢 เข้าปฏิบัติหน้าที่ (Clock In)",
          color: 0x10b981,
          fields: [
            { name: "👤 สมาชิก", value: memberName, inline: true },
            { name: "⏰ เวลาเข้า", value: formatTime(nowTs) + ' น.', inline: true }
          ],
          footer: { text: "Council Duty System" },
          timestamp: new Date(nowTs).toISOString()
        }]
      });
    } catch(e) { console.error("Webhook error:", e); }

    showAlert('success', 'บันทึกเข้าเวรเรียบร้อยแล้ว');
  };

  const handleBreakToggle = async () => {
    if (!selectedMemberId) { showAlert('error', 'กรุณาเลือกชื่อสมาชิกก่อน'); return; }
    const session = dutyData.activeSessions?.[selectedMemberId];
    if (!session) { showAlert('error', 'สมาชิกคนนี้ยังไม่ได้เข้าเวร'); return; }
    
    let updatedSession;
    const nowTs = Date.now();
    const memberName = councilMembers.find(m => m.id === selectedMemberId)?.name || 'Unknown';

    if (session.status === 'working') {
      updatedSession = { ...session, status: 'break', breakStart: nowTs };
      try {
        await sendWebhook('duty_in', {
          embeds: [{
            title: "☕ พักเบรค (Break)",
            color: 0xf59e0b,
            fields: [
              { name: "👤 สมาชิก", value: memberName, inline: true },
              { name: "⏰ เวลาเริ่มพัก", value: formatTime(nowTs) + ' น.', inline: true }
            ],
            footer: { text: "Council Duty System" },
            timestamp: new Date(nowTs).toISOString()
          }]
        });
      } catch(e) { console.error("Webhook error:", e); }
      showAlert('success', 'พักเบรคแล้ว เวลาพักจะไม่นับรวมชั่วโมงงาน');
    } else {
      const breakMinutes = (nowTs - session.breakStart) / 60000;
      updatedSession = { ...session, status: 'working', breakStart: null, totalBreakMinutes: (session.totalBreakMinutes || 0) + breakMinutes };
      try {
        await sendWebhook('duty_in', {
          embeds: [{
            title: "▶️ กลับมาปฏิบัติหน้าที่ (Resume)",
            color: 0x3b82f6,
            fields: [
              { name: "👤 สมาชิก", value: memberName, inline: true },
              { name: "⏰ เวลากลับมา", value: formatTime(nowTs) + ' น.', inline: true },
              { name: "⏳ พักไปทั้งสิ้น", value: formatDuration(breakMinutes), inline: true }
            ],
            footer: { text: "Council Duty System" },
            timestamp: new Date(nowTs).toISOString()
          }]
        });
      } catch(e) { console.error("Webhook error:", e); }
      showAlert('success', 'ทำงานต่อแล้ว');
    }
    const newActive = { ...dutyData.activeSessions, [selectedMemberId]: updatedSession };
    saveToDb({ ...dutyData, activeSessions: newActive });
  };

  const handleCheckOut = async () => {
    if (!selectedMemberId) { showAlert('error', 'กรุณาเลือกชื่อสมาชิกก่อน'); return; }
    const session = dutyData.activeSessions?.[selectedMemberId];
    if (!session) { showAlert('error', 'สมาชิกคนนี้ยังไม่ได้เข้าเวร'); return; }

    const checkOut = Date.now();
    let totalBreak = session.totalBreakMinutes || 0;
    if (session.status === 'break' && session.breakStart) {
      totalBreak += (checkOut - session.breakStart) / 60000;
    }
    const rawMinutes = (checkOut - session.checkIn) / 60000;
    const netMinutes = Math.max(0, Math.round(rawMinutes - totalBreak));

    const memberName = councilMembers.find(m => m.id === selectedMemberId)?.name || 'Unknown';
    const newSession = {
      id: 'duty_' + session.checkIn,
      memberId: selectedMemberId,
      memberName: memberName,
      checkIn: session.checkIn,
      checkOut,
      netMinutes,
      totalBreakMinutes: Math.round(totalBreak),
      date: new Date(session.checkIn).toISOString().split('T')[0],
      month: new Date(session.checkIn).toISOString().slice(0, 7)
    };

    const newActive = { ...dutyData.activeSessions };
    delete newActive[selectedMemberId];
    const newSessions = [newSession, ...(dutyData.sessions || [])];
    saveToDb({ ...dutyData, activeSessions: newActive, sessions: newSessions });

    try {
      await sendWebhook('duty_in', {
        embeds: [{
          title: "🔴 ออกจากหน้าที่ (Clock Out)",
          color: 0xef4444,
          fields: [
            { name: "👤 สมาชิก", value: memberName, inline: true },
            { name: "⏰ เวลาเข้า", value: formatTime(session.checkIn) + ' น.', inline: true },
            { name: "⏰ เวลาออก", value: formatTime(checkOut) + ' น.', inline: true },
            { name: "⏳ เวลาสุทธิ", value: formatDuration(netMinutes), inline: true },
            { name: "☕ เวลาพักรวม", value: formatDuration(Math.round(totalBreak)), inline: true }
          ],
          footer: { text: "Council Duty System" },
          timestamp: new Date(checkOut).toISOString()
        }]
      });
    } catch(e) { console.error("Webhook error:", e); }

    showAlert('success', `ออกเวรเรียบร้อย — เวลาสุทธิ ${formatDuration(netMinutes)}`);
  };

  const handleSearch = () => {
    const from = new Date(dateFrom).getTime();
    const to = new Date(dateTo + 'T23:59:59').getTime();
    const filtered = (dutyData.sessions || []).filter(s => {
      if (s.checkIn < from || s.checkIn > to) return false;
      const targetId = currentMember?.id || user?.uid;
      if (s.memberId !== targetId) return false;
      return true;
    });
    setFilteredHistory(filtered);
  };

  useEffect(() => { handleSearch(); }, [dutyData.sessions, dateFrom, dateTo, selectedMemberId]);

  const totalFilteredMinutes = filteredHistory.reduce((a, s) => a + (s.netMinutes || 0), 0);
  const avgMinutes = filteredHistory.length > 0 ? (totalFilteredMinutes / filteredHistory.length) : 0;

  // Filtered leave history
  const filteredLeaves = [
    ...(dutyData.leaves || []),
    ...transactionLogs.filter(log => log.type === 'leave').map(log => ({
      id: log.id,
      memberId: log.data.memberId,
      memberName: log.data.memberName,
      type: log.data.type,
      dateFrom: log.data.dateFrom,
      dateTo: log.data.dateTo,
      reason: log.data.reason,
      status: log.status,
      submittedAt: log.createdAt?.getTime() || Date.now()
    }))
  ].filter(lv => {
    const targetId = currentMember?.id || user?.uid;
    return lv.memberId === targetId;
  }).sort((a, b) => b.submittedAt - a.submittedAt);

  const activeMemberIds = Object.keys(dutyData.activeSessions || {});
  const selectedSession = selectedMemberId ? dutyData.activeSessions?.[selectedMemberId] : null;

  const getElapsed = (session) => {
    if (!session) return 0;
    let breakMin = session.totalBreakMinutes || 0;
    if (session.status === 'break' && session.breakStart) breakMin += (Date.now() - session.breakStart) / 60000;
    return Math.max(0, Math.round((Date.now() - session.checkIn) / 60000 - breakMin));
  };

  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeString = new Date(nowTs).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
      
      {/* 1. Header & Live Clock */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl p-10 flex flex-col items-center justify-center text-center group transition-all hover:border-slate-700">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
         
         <div className="flex items-center gap-2 text-amber-500 font-bold tracking-[0.2em] text-xs sm:text-sm mb-4 uppercase bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
           <Circle weight="fill" className="animate-pulse" size={10} />
           Council Duty System
         </div>
         
         <div className="font-mono text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-3">
           {timeString}
         </div>
         
         <div className="text-slate-400 font-medium tracking-wide flex items-center gap-2">
           <CalendarBlank size={18} />
           {formatThaiDate(nowTs)}
         </div>
      </div>

      {/* 2. Modern Pill Tabs */}
      <div className="flex justify-center">
        <div className="bg-slate-900 p-1.5 rounded-full border border-slate-800 flex gap-1 shadow-lg backdrop-blur-md">
          {[
            { id: 'duty', label: 'ลงเวลาทำงาน', icon: <ClockClockwise size={18} weight="bold" /> },
            { id: 'leave', label: 'แจ้งลางาน', icon: <Coffee size={18} weight="bold" /> },
            { id: 'resign', label: 'แจ้งลาออก', icon: <SignOut size={18} weight="bold" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? (tab.id === 'resign' 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 scale-105' 
                      : 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/25 scale-105')
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:scale-105'
              }`}
            >
              {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-amber-500/50 font-bold animate-pulse">กำลังโหลดระบบยุทโธปกรณ์...</p>
        </div>
      ) : (
        <div className="relative">
          {activeTab === 'duty' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              
              {/* Glassmorphism Action Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Profile & Status Card (Left) */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-64 h-64 bg-[radial-gradient(circle,_rgba(245,158,11,0.1)_0%,_transparent_70%)] group-hover:bg-[radial-gradient(circle,_rgba(245,158,11,0.15)_0%,_transparent_70%)] transition-all duration-500"></div>
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                      <UserCircle size={36} className="text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ผู้ปฏิบัติงาน</div>
                      <div className="text-xl font-black text-white">{currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}</div>
                    </div>
                  </div>

                  {selectedSession ? (
                    <div className={`relative z-10 rounded-2xl p-5 border backdrop-blur-sm ${
                      selectedSession.status === 'break'
                        ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
                        : 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${selectedSession.status === 'break' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span className={`font-bold ${selectedSession.status === 'break' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {selectedSession.status === 'break' ? 'กำลังพักเบรค' : 'กำลังปฏิบัติหน้าที่'}
                        </span>
                      </div>
                      <div className="font-mono text-4xl font-black text-white my-2 tracking-tight">
                        {formatDuration(getElapsed(selectedSession))}
                      </div>
                      <div className="text-sm text-slate-400 flex items-center gap-2">
                        <ClockClockwise size={16} /> เข้าเวรตั้งแต่ {formatTime(selectedSession.checkIn)} น.
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 rounded-2xl p-5 border border-slate-700/50 bg-slate-800/20 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <SignIn size={20} className="text-slate-500" />
                      </div>
                      <div className="font-bold text-slate-300">ยังไม่ได้เข้าเวร</div>
                      <div className="text-xs text-slate-500 mt-1">กดปุ่ม "เข้าเวร" เพื่อเริ่มนับเวลาทำงาน</div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-2 items-start bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl relative z-10">
                    <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300/70 leading-relaxed">ระบบ Auto Sweep จะ Check Out ให้อัตโนมัติเวลา <strong className="text-blue-400">18:00 น.</strong> และ <strong className="text-blue-400">23:59 น.</strong> ของทุกวัน</p>
                  </div>
                </div>

                {/* Actions Grid (Right) */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={!!selectedSession}
                    className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:shadow-none transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <SignIn size={32} weight="fill" className="text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <div className="font-black text-white text-lg tracking-wide">เข้าเวร (CLOCK IN)</div>
                      <div className="text-xs text-slate-400 mt-1">เริ่มนับชั่วโมงการทำงาน</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleBreakToggle}
                    disabled={!selectedSession}
                    className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:shadow-none transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {selectedSession?.status === 'break' 
                        ? <ClockClockwise size={32} weight="fill" className="text-amber-500" />
                        : <Coffee size={32} weight="fill" className="text-amber-500" />
                      }
                    </div>
                    <div className="text-center">
                      <div className="font-black text-white text-lg tracking-wide">{selectedSession?.status === 'break' ? 'ทำงานต่อ' : 'พักเบรค'}</div>
                      <div className="text-xs text-slate-400 mt-1">{selectedSession?.status === 'break' ? 'กลับมาทำงานตามปกติ' : 'หยุดพักนับเวลาชั่วคราว'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={!selectedSession}
                    className="col-span-2 flex flex-col sm:flex-row items-center justify-center gap-4 bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 rounded-3xl p-6 hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] disabled:opacity-40 disabled:hover:border-red-500/20 disabled:hover:bg-red-500/5 disabled:hover:shadow-none transition-all group"
                  >
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <SignOut size={28} weight="fill" className="text-red-500" />
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="font-black text-white text-xl tracking-wide">ออกเวร (CLOCK OUT)</div>
                      <div className="text-sm text-red-400/80 mt-1">สิ้นสุดการทำงานและบันทึกชั่วโมงสุทธิ</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Status Board */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,_rgba(59,130,246,0.1)_0%,_transparent_70%)] pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <div>
                      <h3 className="font-black text-white text-lg">Live Status Board</h3>
                      <p className="text-sm text-slate-400">กำลังพลที่ปฏิบัติงานอยู่ในขณะนี้ ({activeMemberIds.length} นาย)</p>
                    </div>
                  </div>
                </div>

                {activeMemberIds.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50 relative z-10">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCircle size={32} className="text-slate-600" />
                    </div>
                    <div className="text-slate-400 font-bold">ไม่มีสมาชิกปฏิบัติงานในขณะนี้</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {activeMemberIds.map(id => {
                      const m = councilMembers.find(x => x.id === id);
                      const s = dutyData.activeSessions[id];
                      const isBreak = s.status === 'break';
                      return (
                        <div key={id} className={`p-5 rounded-2xl flex items-center gap-4 border transition-transform hover:-translate-y-1 ${isBreak ? 'border-amber-500/30 bg-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.05)]' : 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.05)]'}`}>
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isBreak ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                              <UserCircle size={28} className={isBreak ? 'text-amber-400' : 'text-emerald-400'} />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isBreak ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate">{m?.name || id}</div>
                            <div className={`text-xs mt-1 font-mono font-bold ${isBreak ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {isBreak ? '☕ พักเบรค' : `⏱ ${formatDuration(getElapsed(s))}`}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 font-mono text-right shrink-0">
                            IN<br/><span className="text-slate-300 font-bold">{formatTime(s.checkIn)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* History Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white">ประวัติการลงเวลา</h3>
                    <p className="text-sm text-slate-400 mt-1">ตรวจสอบชั่วโมงทำงานของคุณเพื่อเช็คยอดรายสัปดาห์</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <input
                        type="date"
                        className="bg-transparent text-white text-sm focus:outline-none px-3 py-2 cursor-pointer w-36"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                      />
                      <span className="text-slate-600 font-bold">-</span>
                      <input
                        type="date"
                        className="bg-transparent text-white text-sm focus:outline-none px-3 py-2 cursor-pointer w-36"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-900 w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20 shrink-0"
                    >
                      <MagnifyingGlass size={20} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Summary Metrics */}
                {filteredHistory.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <ClockClockwise size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 font-bold uppercase">เวลารวม (ช่วงที่เลือก)</div>
                        <div className="text-2xl font-black text-white tracking-tight">{formatDuration(totalFilteredMinutes)}</div>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Coffee size={24} className="text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 font-bold uppercase">เวลาเฉลี่ย/รอบงาน</div>
                        <div className="text-2xl font-black text-amber-400 tracking-tight">{formatDuration(avgMinutes)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Feed */}
                <div className="space-y-4">
                  {filteredHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">ไม่มีข้อมูลในช่วงวันที่เลือก</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredHistory.map(s => (
                        <div key={s.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/30 hover:bg-slate-800/50 transition-all group">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-lg shadow-inner">
                                {s.memberName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">{s.memberName}</h4>
                                <span className="text-sm text-slate-400">{formatThaiDate(s.checkIn)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-emerald-400 text-2xl tracking-tight leading-none">{formatDuration(s.netMinutes)}</div>
                              {s.totalBreakMinutes > 0 && <span className="text-xs text-amber-500/70 font-bold mt-1 block">พักไป {formatDuration(s.totalBreakMinutes)}</span>}
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900 rounded-xl p-4 border border-slate-800 relative overflow-hidden">
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2"></div>
                            
                            <div className="text-center flex-1 relative z-10">
                              <span className="block text-xs text-slate-500 uppercase font-black mb-1 tracking-widest">IN</span>
                              <span className="font-mono text-white font-bold text-base">{formatTime(s.checkIn)}</span>
                            </div>
                            <div className="text-center flex-1 relative z-10">
                              {s.autoCheckOut && (
                                <span className="absolute top-1 right-[20%] flex h-2 w-2" title="ระบบตัดรอบอัตโนมัติ">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              )}
                              <span className="block text-xs text-slate-500 uppercase font-black mb-1 tracking-widest">OUT</span>
                              <span className={`font-mono font-bold text-base ${s.autoCheckOut ? 'text-red-400' : 'text-white'}`}>
                                {formatTime(s.checkOut)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Leave Form */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Coffee size={24} weight="fill" />
                      </div>
                      <h2 className="text-xl font-black text-white">แบบฟอร์มแจ้งลา</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserCircle size={22} className="text-slate-400" />
                          <span className="text-white font-bold">
                            {currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-bold">บัญชีของคุณ</span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ประเภทการลา</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors font-medium appearance-none"
                          value={leaveForm.type}
                          onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}
                        >
                          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ตั้งแต่วันที่</label>
                          <input type="date"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                            value={leaveForm.dateFrom}
                            onChange={e => setLeaveForm({...leaveForm, dateFrom: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ถึงวันที่</label>
                          <input type="date"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                            value={leaveForm.dateTo}
                            onChange={e => setLeaveForm({...leaveForm, dateTo: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เหตุผลการลา</label>
                        <textarea
                          rows={4}
                          placeholder="ระบุเหตุผลที่ชัดเจน..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-medium"
                          value={leaveForm.reason}
                          onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!leaveForm.memberId || !leaveForm.dateFrom || !leaveForm.dateTo || !leaveForm.reason) {
                            showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน'); return;
                          }
                          const memberName = councilMembers.find(m => m.id === leaveForm.memberId)?.name || 'Unknown';
                          const payload = {
                            memberId: leaveForm.memberId,
                            memberName: memberName,
                            type: leaveForm.type,
                            dateFrom: leaveForm.dateFrom,
                            dateTo: leaveForm.dateTo,
                            reason: leaveForm.reason,
                            webhookPayload: {
                              embeds: [{
                                title: "📝 แจ้งลางาน (Leave Request)",
                                color: 0x3b82f6,
                                fields: [
                                  { name: "👤 สมาชิก", value: memberName, inline: true },
                                  { name: "📋 ประเภท", value: leaveForm.type, inline: true },
                                  { name: "📅 ตั้งแต่วันที่", value: leaveForm.dateFrom, inline: true },
                                  { name: "📅 ถึงวันที่", value: leaveForm.dateTo, inline: true },
                                  { name: "💬 เหตุผล", value: leaveForm.reason, inline: false }
                                ],
                                footer: { text: "Council Duty System" },
                                timestamp: new Date().toISOString()
                              }]
                            }
                          };

                          try {
                            await saveTransactionLog('leave', payload, user);
                            setLeaveForm({ memberId: currentMember?.id || '', type: 'ลากิจ (Personal)', dateFrom: '', dateTo: '', reason: '' });
                            showAlert('success', 'ส่งใบลาเรียบร้อยแล้ว รอแอดมินอนุมัติ');
                          } catch(e) {
                            console.error("Save log error:", e);
                            showAlert('error', 'เกิดข้อผิดพลาดในการส่งใบลา');
                          }
                        }}
                        className="w-full mt-4 py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1"
                      >
                        ส่งใบลา (SUBMIT LEAVE)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leave History */}
                <div className="lg:col-span-7">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 h-full">
                    <h3 className="text-xl font-black text-white mb-6">ประวัติการลาของคุณ</h3>
                    
                    <div className="space-y-4">
                      {!filteredLeaves.length ? (
                        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                          <Coffee size={40} className="mx-auto text-slate-700 mb-4" />
                          <div className="text-slate-500 font-bold">ไม่มีประวัติการลา</div>
                        </div>
                      ) : (
                        filteredLeaves.map(lv => (
                          <div key={lv.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 ${
                                lv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                lv.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}>
                                {lv.type.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white text-base mb-1">{lv.type}</div>
                                <div className="text-sm font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 inline-block">
                                  {lv.dateFrom} <span className="text-slate-600">to</span> {lv.dateTo}
                                </div>
                                <div className="text-xs text-slate-500 mt-2">เหตุผล: {lv.reason}</div>
                              </div>
                            </div>
                            <div className={`text-xs font-black px-4 py-2 rounded-full border text-center shrink-0 ${
                              lv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                              lv.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                            }`}>
                              {lv.status === 'approved' ? 'อนุมัติแล้ว' : lv.status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอการพิจารณา'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resign' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto">
              <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-red-500/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-[radial-gradient(circle,_rgba(239,68,68,0.15)_0%,_transparent_70%)] pointer-events-none"></div>
                
                <div className="text-center mb-8 relative z-10">
                  <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SignOut size={40} className="text-red-500" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">แจ้งความประสงค์ลาออก</h2>
                  <p className="text-slate-400">ยื่นเรื่องเพื่อขอยุติบทบาทหน้าที่ในสภาเมือง</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex gap-4 mb-8 relative z-10">
                  <span className="text-red-400 text-2xl shrink-0">⚠️</span>
                  <div className="text-sm">
                    <div className="font-black text-red-400 mb-1 tracking-wide">โปรดอ่านก่อนดำเนินการ</div>
                    <div className="text-red-200/80 leading-relaxed">
                      กรุณาแจ้งล่วงหน้าอย่างน้อย 15-30 วัน ตามระเบียบของสภา การส่งแบบฟอร์มนี้จะมีผลทันทีและจะถูกส่งไปยังระบบหลังบ้านเพื่อให้ทีมบริหารพิจารณาอนุมัติ
                    </div>
                  </div>
                </div>

                <div className="space-y-5 relative z-10">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">วันทำงานวันสุดท้าย</label>
                    <input
                      type="date"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-500 font-medium transition-colors"
                      value={resignForm.lastDay}
                      onChange={e => setResignForm({...resignForm, lastDay: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เหตุผลที่ลาออก</label>
                    <textarea
                      rows={4}
                      placeholder="อธิบายเหตุผลโดยสังเขป..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 resize-none font-medium transition-colors"
                      value={resignForm.reason}
                      onChange={e => setResignForm({...resignForm, reason: e.target.value})}
                    />
                  </div>

                  <label className="flex items-start gap-4 p-4 border border-slate-800 rounded-xl bg-slate-950/50 cursor-pointer group hover:border-red-500/50 transition-colors mt-6">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={resignForm.confirmed}
                        onChange={e => setResignForm({...resignForm, confirmed: e.target.checked})}
                        className="peer appearance-none w-5 h-5 border-2 border-slate-600 rounded cursor-pointer checked:border-red-500 checked:bg-red-500 transition-colors"
                      />
                      <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-300 leading-relaxed font-medium group-hover:text-white transition-colors">
                      ข้าพเจ้ายืนยันว่าข้อมูลข้างต้นเป็นความจริง และประสงค์จะพ้นสภาพจากการเป็นสมาชิกสภาตามวันที่ระบุ
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={!resignForm.confirmed}
                    onClick={async () => {
                      if (!resignForm.memberId || !resignForm.lastDay || !resignForm.reason) {
                        showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน'); return;
                      }
                      const memberName = councilMembers.find(m => m.id === resignForm.memberId)?.name || 'Unknown';
                      const payload = {
                        memberId: resignForm.memberId,
                        memberName: memberName,
                        lastDay: resignForm.lastDay,
                        reason: resignForm.reason,
                        webhookPayload: {
                          embeds: [{
                            title: "🚨 แจ้งลาออก (Resignation)",
                            color: 0xef4444,
                            fields: [
                              { name: "👤 สมาชิก", value: memberName, inline: true },
                              { name: "📅 วันทำงานวันสุดท้าย", value: resignForm.lastDay, inline: true },
                              { name: "💬 เหตุผล", value: resignForm.reason, inline: false }
                            ],
                            footer: { text: "Council Duty System" },
                            timestamp: new Date().toISOString()
                          }]
                        }
                      }

                      try {
                        await saveTransactionLog('resign', payload, user);
                        setResignForm({ memberId: currentMember?.id || '', lastDay: '', reason: '', confirmed: false });
                        showAlert('success', 'ยื่นเรื่องลาออกเรียบร้อยแล้ว รอทีมบริหารอนุมัติ');
                      } catch(e) {
                        console.error("Save log error:", e);
                        showAlert('error', 'เกิดข้อผิดพลาดในการส่งใบลาออก');
                      }
                    }}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black rounded-xl transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-1"
                  >
                    ยืนยันการลาออก (CONFIRM RESIGNATION)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
