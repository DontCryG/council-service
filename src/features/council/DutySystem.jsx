import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  ClockClockwise, SignIn, SignOut, Coffee,
  MagnifyingGlass, UserCircle, Info, Circle, CalendarBlank,
  WarningCircle, PaperPlaneTilt, Clock
} from '@phosphor-icons/react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
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

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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

  const handleCheckOut = () => {
    if (!selectedMemberId) { showAlert('error', 'กรุณาเลือกชื่อสมาชิกก่อน'); return; }
    const session = dutyData.activeSessions?.[selectedMemberId];
    if (!session) { showAlert('error', 'สมาชิกคนนี้ยังไม่ได้เข้าเวร'); return; }

    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการออกเวร',
      message: 'คุณต้องการยืนยันการ "ออกเวร" ใช่หรือไม่?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        
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
          status: 'completed'
        };

        const newActive = { ...dutyData.activeSessions };
        delete newActive[selectedMemberId];
        const newSessions = [newSession, ...(dutyData.sessions || [])];
        saveToDb({ ...dutyData, activeSessions: newActive, sessions: newSessions });

        try {
          await saveTransactionLog('duty_session', newSession, user);
          await sendWebhook('duty_end', {
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
          showAlert('success', `ออกเวรเรียบร้อย — เวลาสุทธิ ${formatDuration(netMinutes)}`);
        } catch (e) {
          console.error(e);
          showAlert('error', 'เกิดข้อผิดพลาดในการออกเวร');
        }
      }
    });
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-24 relative z-10">
      
      {/* Background Ambient Lights */}
      <div className="fixed top-20 right-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="fixed bottom-10 left-10 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* 1. Header & Live Clock */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-12 flex flex-col items-center justify-center text-center group transition-all duration-700 hover:border-amber-500/30 hover:shadow-[0_0_50px_rgba(245,158,11,0.15)]">
         <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
         <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-amber-500/30 transition-colors duration-700"></div>
         <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-blue-500/30 transition-colors duration-700"></div>
         
         <div className="flex items-center gap-2.5 text-amber-500 font-black tracking-widest text-xs sm:text-sm mb-6 uppercase bg-amber-500/10 px-5 py-2 rounded-full border border-amber-500/20 shadow-inner z-10">
           <Circle weight="fill" className="animate-pulse drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" size={12} />
           Council Duty System
         </div>
         
         <div className="font-mono text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] mb-4 z-10 select-none">
           {timeString}
         </div>
         
         <div className="text-slate-400 font-bold tracking-widest flex items-center gap-2.5 bg-slate-950/50 px-6 py-2.5 rounded-full border border-slate-700/50 shadow-inner z-10">
           <CalendarBlank size={20} className="text-amber-500/70" />
           {formatThaiDate(nowTs)}
         </div>
      </div>

      {/* 2. Modern Pill Tabs */}
      <div className="flex justify-center relative z-10">
        <div className="bg-slate-900/60 p-2 rounded-full border border-slate-700/50 flex gap-2 shadow-2xl backdrop-blur-xl">
          {[
            { id: 'duty', label: 'ลงเวลาทำงาน', icon: <ClockClockwise size={20} weight="duotone" /> },
            { id: 'leave', label: 'แจ้งลางาน', icon: <Coffee size={20} weight="duotone" /> },
            { id: 'resign', label: 'แจ้งลาออก', icon: <SignOut size={20} weight="duotone" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-black transition-all duration-500 ${
                activeTab === tab.id
                  ? (tab.id === 'resign' 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105 border border-red-400/50' 
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105 border border-amber-300/50')
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 hover:shadow-inner border border-transparent'
              }`}
            >
              {tab.icon} <span className="hidden sm:inline tracking-wide">{tab.label}</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Profile & Status Card (Left) */}
                <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
                  {/* Sweep Gradient Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  <div className="absolute -right-20 -top-20 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] group-hover:bg-amber-500/20 group-hover:scale-125 transition-all duration-1000 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-20 h-20 rounded-[1.25rem] bg-slate-950/80 border border-slate-700/80 flex items-center justify-center shadow-inner group-hover:border-amber-500/30 transition-colors">
                      <UserCircle size={44} className="text-amber-500 drop-shadow-md" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ผู้ปฏิบัติงาน</div>
                      <div className="text-2xl font-black text-white drop-shadow-md">{currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}</div>
                    </div>
                  </div>

                  {selectedSession ? (
                    <div className={`relative z-10 rounded-3xl p-6 border backdrop-blur-md shadow-inner transition-colors duration-500 ${
                      selectedSession.status === 'break'
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]'
                        : 'bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${selectedSession.status === 'break' ? 'bg-amber-400 text-amber-400' : 'bg-emerald-400 text-emerald-400'}`} />
                        <span className={`font-black text-sm tracking-widest uppercase ${selectedSession.status === 'break' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {selectedSession.status === 'break' ? 'กำลังพักเบรค' : 'กำลังปฏิบัติหน้าที่'}
                        </span>
                      </div>
                      <div className="font-mono text-5xl font-black text-white my-4 tracking-tighter drop-shadow-md">
                        {formatDuration(getElapsed(selectedSession))}
                      </div>
                      <div className="text-xs font-bold text-slate-400 flex items-center gap-2 bg-slate-950/40 w-fit px-4 py-2 rounded-xl border border-slate-700/50">
                        <ClockClockwise size={16} /> เข้าเวรตั้งแต่ <span className="text-white">{formatTime(selectedSession.checkIn)} น.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 rounded-3xl p-8 border border-slate-700/50 bg-slate-950/40 text-center shadow-inner flex flex-col items-center justify-center min-h-[200px]">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <SignIn size={28} className="text-slate-500" />
                      </div>
                      <div className="font-black text-slate-300 text-lg mb-1.5 tracking-wide">ยังไม่ได้เข้าเวร</div>
                      <div className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">กดปุ่ม "เข้าเวร" เพื่อเริ่มนับเวลาทำงาน</div>
                    </div>
                  )}

                  <div className="mt-8 flex gap-3 items-start bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl relative z-10 shadow-inner backdrop-blur-sm">
                    <Info size={20} weight="duotone" className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-blue-300/80 leading-relaxed">ระบบ Auto Sweep จะ Check Out ให้อัตโนมัติเวลา <strong className="text-blue-400 font-black">18:00 น.</strong> และ <strong className="text-blue-400 font-black">23:59 น.</strong> ของทุกวัน</p>
                  </div>
                </div>

                {/* Actions Grid (Right) */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={!!selectedSession}
                    className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-5 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] disabled:opacity-40 disabled:hover:border-slate-700/50 disabled:hover:shadow-none transition-all duration-300 group shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner relative z-10">
                      <SignIn size={36} weight="duotone" className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    <div className="text-center relative z-10">
                      <div className="font-black text-white text-xl tracking-wider mb-1.5">เข้าเวร (CLOCK IN)</div>
                      <div className="text-[11px] font-bold tracking-widest text-emerald-500/70 uppercase">เริ่มนับชั่วโมงการทำงาน</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleBreakToggle}
                    disabled={!selectedSession}
                    className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-5 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.2)] disabled:opacity-40 disabled:hover:border-slate-700/50 disabled:hover:shadow-none transition-all duration-300 group shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-500"></div>
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner relative z-10">
                      {selectedSession?.status === 'break' 
                        ? <ClockClockwise size={36} weight="duotone" className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                        : <Coffee size={36} weight="duotone" className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      }
                    </div>
                    <div className="text-center relative z-10">
                      <div className="font-black text-white text-xl tracking-wider mb-1.5">{selectedSession?.status === 'break' ? 'ทำงานต่อ' : 'พักเบรค'}</div>
                      <div className="text-[11px] font-bold tracking-widest text-amber-500/70 uppercase">{selectedSession?.status === 'break' ? 'กลับมาทำงานตามปกติ' : 'หยุดพักนับเวลาชั่วคราว'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={!selectedSession}
                    className="col-span-2 flex flex-col sm:flex-row items-center justify-center gap-6 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] disabled:opacity-40 disabled:hover:border-slate-700/50 disabled:hover:bg-slate-900/50 disabled:hover:shadow-none transition-all duration-300 group shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/20 transition-colors duration-500"></div>
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner relative z-10 shrink-0">
                      <SignOut size={36} weight="duotone" className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>
                    <div className="text-center sm:text-left relative z-10">
                      <div className="font-black text-white text-2xl tracking-wider mb-1.5">ออกเวร (CLOCK OUT)</div>
                      <div className="text-xs font-bold tracking-widest text-red-400/80 uppercase">สิ้นสุดการทำงานและบันทึกชั่วโมงสุทธิ</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Status Board */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(59,130,246,0.1)_0%,_transparent_70%)] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner shrink-0">
                      <ClockClockwise size={32} className="text-blue-500" weight="duotone" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                        <h3 className="font-black text-white text-2xl drop-shadow-md tracking-wide">Live Status Board</h3>
                      </div>
                      <p className="text-sm font-bold text-slate-400 tracking-wide">กำลังพลที่ปฏิบัติงานอยู่ในขณะนี้ <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 ml-2 shadow-inner">{activeMemberIds.length} นาย</span></p>
                    </div>
                  </div>
                </div>

                {activeMemberIds.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-700/50 rounded-[2rem] bg-slate-950/40 relative z-10 shadow-inner backdrop-blur-sm">
                    <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[1.25rem] flex items-center justify-center mx-auto mb-5 shadow-inner">
                      <UserCircle size={40} className="text-slate-600" weight="duotone" />
                    </div>
                    <div className="text-slate-300 font-black text-xl tracking-wide mb-2">ไม่มีสมาชิกปฏิบัติงานในขณะนี้</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">ระบบจะอัปเดตอัตโนมัติเมื่อมีการเข้าเวร</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {activeMemberIds.map(id => {
                      const m = councilMembers.find(x => x.id === id);
                      const s = dutyData.activeSessions[id];
                      const isBreak = s.status === 'break';
                      return (
                        <div key={id} className={`p-6 rounded-[2rem] flex items-center gap-5 border transition-all duration-300 hover:-translate-y-1.5 group overflow-hidden relative ${isBreak ? 'border-amber-500/30 bg-amber-500/10 hover:shadow-[0_10px_30px_rgba(245,158,11,0.15)] hover:border-amber-500/50' : 'border-emerald-500/30 bg-emerald-500/10 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/50'}`}>
                          <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none ${isBreak ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                          
                          <div className="relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner group-hover:scale-110 transition-transform ${isBreak ? 'bg-amber-500/20 border-amber-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                              <UserCircle size={32} className={isBreak ? 'text-amber-400' : 'text-emerald-400'} weight="duotone" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 shadow-[0_0_8px_currentColor] ${isBreak ? 'bg-amber-400 text-amber-400 animate-pulse' : 'bg-emerald-400 text-emerald-400'}`}></div>
                          </div>
                          
                          <div className="flex-1 min-w-0 z-10">
                            <div className="font-black text-white text-base truncate mb-1 drop-shadow-sm">{m?.name || id}</div>
                            <div className={`text-sm font-mono font-bold tracking-tight bg-slate-950/50 w-fit px-3 py-1 rounded-lg border shadow-inner ${isBreak ? 'text-amber-400 border-amber-500/20' : 'text-emerald-400 border-emerald-500/20'}`}>
                              {isBreak ? '☕ พักเบรค' : `⏱ ${formatDuration(getElapsed(s))}`}
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0 z-10">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">เวลาเข้า</div>
                            <div className="text-slate-300 font-black font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/50 shadow-inner">{formatTime(s.checkIn)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* History Section */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-10 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner shrink-0">
                      <CalendarBlank size={32} className="text-purple-500" weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white drop-shadow-md tracking-wide mb-1.5">ประวัติการลงเวลา</h3>
                      <p className="text-sm font-bold text-slate-400 tracking-wide">ตรวจสอบชั่วโมงทำงานของคุณเพื่อเช็คยอดรายสัปดาห์</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/80 p-2 rounded-[1.25rem] border border-slate-700/80 shadow-inner">
                      <input
                        type="date"
                        className="bg-slate-900 border border-slate-700/50 text-white font-bold focus:outline-none focus:border-purple-500/50 rounded-xl px-4 py-3 cursor-pointer w-full sm:w-40 transition-colors"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                      />
                      <span className="text-slate-500 font-black text-lg hidden sm:block">-</span>
                      <input
                        type="date"
                        className="bg-slate-900 border border-slate-700/50 text-white font-bold focus:outline-none focus:border-purple-500/50 rounded-xl px-4 py-3 cursor-pointer w-full sm:w-40 transition-colors"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="bg-purple-500 hover:bg-purple-400 text-white w-16 h-16 sm:w-[60px] sm:h-[60px] rounded-[1.25rem] flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] shrink-0 group border border-purple-400/50 hover:-translate-y-1"
                    >
                      <MagnifyingGlass size={28} weight="bold" className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Summary Metrics */}
                {filteredHistory.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 relative z-10">
                    <div className="bg-slate-900/80 border border-blue-500/20 rounded-[2rem] p-6 flex items-center gap-6 shadow-inner group hover:border-blue-500/50 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <ClockClockwise size={32} className="text-blue-400" weight="duotone" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">เวลารวม (ช่วงที่เลือก)</div>
                        <div className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{formatDuration(totalFilteredMinutes)}</div>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-amber-500/20 rounded-[2rem] p-6 flex items-center gap-6 shadow-inner group hover:border-amber-500/50 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Coffee size={32} className="text-amber-400" weight="duotone" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">เวลาเฉลี่ย/รอบงาน</div>
                        <div className="text-3xl font-black text-amber-400 tracking-tighter drop-shadow-md">{formatDuration(avgMinutes)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Feed */}
                <div className="space-y-5 relative z-10">
                  {filteredHistory.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-[2rem] bg-slate-950/40 shadow-inner">
                      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <CalendarBlank size={32} className="text-slate-600" weight="duotone" />
                      </div>
                      <div className="font-black text-lg tracking-wide mb-1 text-slate-400">ไม่มีข้อมูลในช่วงวันที่เลือก</div>
                      <div className="text-[11px] uppercase tracking-widest font-bold">กรุณาลองเปลี่ยนช่วงเวลาค้นหา</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {filteredHistory.map(s => (
                        <div key={s.id} className="bg-slate-950/80 border border-slate-700/80 rounded-[2rem] p-6 md:p-8 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[40px] group-hover:bg-purple-500/10 pointer-events-none transition-colors duration-500 -mr-10 -mt-10"></div>
                          
                          <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-black text-slate-300 text-xl shadow-inner group-hover:border-purple-500/30 transition-colors">
                                {s.memberName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-black text-white text-lg tracking-wide group-hover:text-purple-400 transition-colors mb-0.5 drop-shadow-sm">{s.memberName}</h4>
                                <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{formatThaiDate(s.checkIn)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-emerald-400 text-3xl tracking-tighter leading-none drop-shadow-md">{formatDuration(s.netMinutes)}</div>
                              {s.totalBreakMinutes > 0 && <span className="text-[10px] text-amber-500 font-black mt-2 inline-block uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shadow-inner">พักไป {formatDuration(s.totalBreakMinutes)}</span>}
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
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Leave Form */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700 -mr-20 -mt-20"></div>
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-blue-400 to-transparent"></div>
                    
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="w-14 h-14 rounded-[1.25rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Coffee size={32} weight="duotone" className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      </div>
                      <h2 className="text-2xl font-black text-white drop-shadow-md tracking-wide">แบบฟอร์มแจ้งลา</h2>
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <UserCircle size={24} className="text-slate-400" />
                          </div>
                          <div>
                            <span className="text-white font-black block tracking-wide">
                              {currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 block">บัญชีของคุณ</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Circle size={8} weight="fill" className="text-blue-500" /> ประเภทการลา
                        </label>
                        <select
                          className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold appearance-none shadow-inner cursor-pointer"
                          value={leaveForm.type}
                          onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                        >
                          {LEAVE_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Circle size={8} weight="fill" className="text-blue-500" /> ตั้งแต่วันที่
                          </label>
                          <input type="date"
                            className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold shadow-inner"
                            value={leaveForm.dateFrom}
                            onChange={e => setLeaveForm({...leaveForm, dateFrom: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Circle size={8} weight="fill" className="text-blue-500" /> ถึงวันที่
                          </label>
                          <input type="date"
                            className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold shadow-inner"
                            value={leaveForm.dateTo}
                            onChange={e => setLeaveForm({...leaveForm, dateTo: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Circle size={8} weight="fill" className="text-blue-500" /> เหตุผลการลา
                        </label>
                        <textarea
                          rows={4}
                          placeholder="ระบุเหตุผลที่ชัดเจน..."
                          className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold resize-none shadow-inner"
                          value={leaveForm.reason}
                          onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!leaveForm.memberId || !leaveForm.dateFrom || !leaveForm.dateTo || !leaveForm.reason) {
                            showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน'); return;
                          }
                          setConfirmConfig({
                            isOpen: true,
                            title: 'ยืนยันการส่งใบลา',
                            message: 'คุณต้องการยืนยันการ "ส่งใบลา" ใช่หรือไม่?',
                            onConfirm: async () => {
                              setConfirmConfig(prev => ({...prev, isOpen: false}));
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
                                      { name: "👤 ผู้แจ้ง", value: memberName, inline: true },
                                      { name: "📋 ประเภท", value: leaveForm.type, inline: true },
                                      { name: "📅 ตั้งแต่วันที่", value: formatThaiDate(new Date(leaveForm.dateFrom).getTime()), inline: true },
                                      { name: "📅 ถึงวันที่", value: formatThaiDate(new Date(leaveForm.dateTo).getTime()), inline: true },
                                      { name: "📝 เหตุผล", value: leaveForm.reason, inline: false }
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
                            }
                          });
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
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto relative z-10">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-red-500/30 rounded-[3rem] p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-red-500/20 transition-colors duration-700 -mr-20 -mt-20"></div>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-transparent"></div>
                
                <div className="flex flex-col items-center text-center mb-10 relative z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <WarningCircle size={56} weight="duotone" className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-white drop-shadow-md tracking-wide mb-3">แบบฟอร์มแจ้งลาออก</h2>
                  <p className="text-sm font-bold text-slate-400 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20 shadow-inner">
                    การกระทำนี้ <span className="text-red-400 font-black underline decoration-red-400/50 underline-offset-4">ไม่สามารถย้อนกลับได้</span> กรุณาตรวจสอบให้แน่ใจก่อนกดยืนยัน
                  </p>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <UserCircle size={32} className="text-slate-400" />
                      </div>
                      <div>
                        <span className="text-white font-black text-lg block tracking-wide">
                          {currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">ผู้ยื่นคำร้องขอลาออก</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <CalendarBlank size={12} weight="fill" className="text-red-500" /> วันทำงานวันสุดท้าย
                      </label>
                      <input
                        type="date"
                        className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 transition-all font-bold shadow-inner"
                        value={resignForm.lastDay}
                        onChange={e => setResignForm({...resignForm, lastDay: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Circle size={8} weight="fill" className="text-red-500" /> เหตุผลที่ขอลาออก
                      </label>
                      <textarea
                        rows={5}
                        placeholder="กรุณาระบุเหตุผลที่ต้องการลาออก..."
                        className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-6 py-5 text-white placeholder-slate-600 focus:outline-none focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 transition-all font-bold resize-none shadow-inner"
                        value={resignForm.reason}
                        onChange={e => setResignForm({...resignForm, reason: e.target.value})}
                      />
                    </div>
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
                    onClick={() => {
                      if (!resignForm.memberId || !resignForm.lastDay || !resignForm.reason) {
                        showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน'); return;
                      }
                      setConfirmConfig({
                        isOpen: true,
                        title: 'ยืนยันการลาออก',
                        message: 'คุณต้องการยืนยันการ "ลาออก" ใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)',
                        onConfirm: async () => {
                          setConfirmConfig(prev => ({...prev, isOpen: false}));
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
                        }
                      });
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

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
}
