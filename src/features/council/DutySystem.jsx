import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  ClockClockwise, SignIn, SignOut, Coffee,
  MagnifyingGlass, UserCircle, Info, Circle
} from '@phosphor-icons/react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { sendWebhook } from '../../core/api';

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

  useEffect(() => {
    const unsubDuty = onSnapshot(doc(db, 'app_state', 'duty'), (snap) => {
      if (snap.exists()) setDutyData(snap.data());
      else setDutyData({ sessions: [], activeSessions: {} });
      setLoading(false);
    });
    const unsubCouncil = onSnapshot(doc(db, 'app_state', 'council_members'), (snap) => {
      if (snap.exists()) setCouncilMembers(snap.data().members || []);
    });
    return () => { unsubDuty(); unsubCouncil(); };
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
  const filteredLeaves = (dutyData.leaves || []).filter(lv => {
    const targetId = currentMember?.id || user?.uid;
    return lv.memberId === targetId;
  });

  const activeMemberIds = Object.keys(dutyData.activeSessions || {});
  const selectedSession = selectedMemberId ? dutyData.activeSessions?.[selectedMemberId] : null;

  const getElapsed = (session) => {
    if (!session) return 0;
    let breakMin = session.totalBreakMinutes || 0;
    if (session.status === 'break' && session.breakStart) breakMin += (Date.now() - session.breakStart) / 60000;
    return Math.max(0, Math.round((Date.now() - session.checkIn) / 60000 - breakMin));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClockClockwise className="text-amber-500" weight="duotone" />
          ระบบเข้าเวรสภา
        </h1>
        <p className="text-slate-400 mt-1">บันทึกเวลาปฏิบัติหน้าที่ของสมาชิกสภา</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border border-slate-700 rounded-xl overflow-hidden">
        {[
          { id: 'duty', label: 'ลงเวลา (Duty)' },
          { id: 'leave', label: 'แจ้งลา (Leave)' },
          { id: 'resign', label: 'ลาออก (Resign)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="py-20 text-center text-slate-500">กำลังโหลด...</Card>
      ) : (
        <>
          {activeTab === 'duty' && (
            <div className="space-y-6">
              {/* Check-in Card */}
              <Card className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-white">ลงเวลาเข้า/ออกงาน</h2>
                    <p className="text-sm text-slate-400">บันทึกเวลาปฏิบัติหน้าที่และพักเบรค</p>
                  </div>
                  {selectedSession && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      selectedSession.status === 'break'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {councilMembers.find(m => m.id === selectedMemberId)?.name} ({selectedSession.status === 'break' ? 'พักเบรค' : 'Member'})
                    </span>
                  )}
                </div>

                {/* Member - locked from login */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400">ชื่อผู้ลงเวลา</label>
                  <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCircle size={22} className="text-amber-400" />
                      <span className="text-white font-bold">
                        {currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">🔒 ล็อคจากบัญชี</span>
                  </div>
                  {!currentMember && (
                    <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                      ⚠ ไม่พบข้อมูลบัญชีนี้ในระบบสภา กรุณาติดต่อ Admin
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                  <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>ระบบจะทำการ <strong className="text-blue-300">Check Out</strong> ให้อัตโนมัติเวลา <strong className="text-blue-300">18:00 น. และ 23:59 น.</strong> ของทุกวัน</p>
                    <p className="text-slate-500 text-xs">(Auto Sweep System) - เวลาพักเบรคจะไม่ถูกนำไปคิดรวมกับชั่วโมงงาน</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={!!selectedSession}
                    className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <SignIn size={18} weight="bold" /> เข้าเวร
                  </button>
                  <button
                    type="button"
                    onClick={handleBreakToggle}
                    disabled={!selectedSession}
                    className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-amber-500 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Coffee size={18} weight="bold" />
                    {selectedSession?.status === 'break' ? 'ทำงานต่อ' : 'พักเบรค'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={!selectedSession}
                    className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-red-500 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <SignOut size={18} weight="bold" /> ออกเวร
                  </button>
                </div>

                {/* Selected member status */}
                {selectedSession && (
                  <div className={`rounded-xl p-4 border text-sm flex items-center justify-between ${
                    selectedSession.status === 'break'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-emerald-500/5 border-emerald-500/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${selectedSession.status === 'break' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span className="text-slate-300">เข้าเวรตั้งแต่ {formatTime(selectedSession.checkIn)} น.</span>
                      {selectedSession.status === 'break' && <span className="text-amber-400 text-xs">(กำลังพักเบรค)</span>}
                    </div>
                    <span className="font-black text-white">{formatDuration(getElapsed(selectedSession))}</span>
                  </div>
                )}
              </Card>

              {/* Live Status */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white">Live Status</span>
                  <span className="text-slate-500 text-sm">(กำลังพลที่ปฏิบัติงานอยู่)</span>
                </div>

                {activeMemberIds.length === 0 ? (
                  <Card className="py-10 text-center text-slate-500 border-dashed">
                    ไม่มีสมาชิกปฏิบัติงานในขณะนี้
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeMemberIds.map(id => {
                      const m = councilMembers.find(x => x.id === id);
                      const s = dutyData.activeSessions[id];
                      const isBreak = s.status === 'break';
                      return (
                        <Card key={id} className={`p-4 flex items-center gap-4 border ${isBreak ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isBreak ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                            <UserCircle size={24} className={isBreak ? 'text-amber-400' : 'text-emerald-400'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate">{m?.name || id}</div>
                            <div className={`text-xs mt-0.5 ${isBreak ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {isBreak ? '☕ พักเบรค' : `⏱ ${formatDuration(getElapsed(s))}`}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">{formatTime(s.checkIn)}</div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* History */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-white">ประวัติการลงเวลา</h3>
                  <p className="text-sm text-slate-400">ตรวจสอบชั่วโมงทำงานของคุณ</p>
                </div>

                {/* Date Filter */}
                <div className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="date"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="date"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors"
                  >
                    <MagnifyingGlass size={16} /> ค้นหา
                  </button>
                </div>

                {/* Summary */}
                {filteredHistory.length > 0 && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <ClockClockwise size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">เวลารวม (ช่วงที่เลือก)</div>
                        <div className="text-xl font-black text-white">{formatDuration(totalFilteredMinutes)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">เวลาเฉลี่ย/รอบงาน</div>
                      <div className="text-xl font-black text-amber-400">{formatDuration(avgMinutes)}</div>
                    </div>
                  </div>
                )}

                {/* History Table */}
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="bg-slate-900/50 border-b border-slate-800 text-xs text-slate-500 uppercase">
                        <tr>
                          <th className="px-5 py-3">วันที่ / ชื่อ</th>
                          <th className="px-5 py-3 text-center">เข้า</th>
                          <th className="px-5 py-3 text-center">ออก</th>
                          <th className="px-5 py-3 text-right">เวลาสุทธิ (พักเบรค)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredHistory.length === 0 ? (
                          <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">ไม่มีข้อมูลในช่วงวันที่เลือก</td></tr>
                        ) : (
                          filteredHistory.map(s => (
                            <tr key={s.id} className="hover:bg-slate-800/30">
                              <td className="px-5 py-4">
                                <div className="font-bold text-white text-xs">{formatThaiDate(s.checkIn)}</div>
                                <div className="text-slate-400 text-xs mt-0.5">{s.memberName}</div>
                              </td>
                              <td className="px-5 py-4 text-center font-mono text-emerald-400">{formatTime(s.checkIn)}</td>
                              <td className="px-5 py-4 text-center font-mono text-red-400">
                                {formatTime(s.checkOut)}
                                {s.autoCheckOut && <span className="block text-[10px] text-slate-500 font-sans mt-1 leading-none">(Auto)</span>}
                              </td>
                              <td className="px-5 py-4 text-right font-bold text-amber-400">
                                {formatDuration(s.netMinutes)}
                                {s.totalBreakMinutes > 0 && (
                                  <div className="text-xs text-slate-500 font-normal">พัก {formatDuration(s.totalBreakMinutes)}</div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="space-y-6">
              {/* Leave Form */}
              <Card className="p-6 space-y-5">
                <h2 className="text-lg font-black text-white">แบบฟอร์มแจ้งลา (Request Leave)</h2>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400">ชื่อผู้ลา</label>
                  <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCircle size={22} className="text-amber-400" />
                      <span className="text-white font-bold">
                        {currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">🔒 ล็อคจากบัญชี</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400">ประเภทการลา</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    value={leaveForm.type}
                    onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}
                  >
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400">ตั้งแต่วันที่</label>
                    <input type="date"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                      value={leaveForm.dateFrom}
                      onChange={e => setLeaveForm({...leaveForm, dateFrom: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400">ถึงวันที่</label>
                    <input type="date"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                      value={leaveForm.dateTo}
                      onChange={e => setLeaveForm({...leaveForm, dateTo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400">เหตุผลการลา</label>
                  <textarea
                    rows={4}
                    placeholder="ระบุเหตุผลที่ชัดเจน..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
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
                    const leaves = [...(dutyData.leaves || [])];
                    leaves.unshift({
                      id: 'lv_' + Date.now(),
                      memberId: leaveForm.memberId,
                      memberName: memberName,
                      type: leaveForm.type,
                      dateFrom: leaveForm.dateFrom,
                      dateTo: leaveForm.dateTo,
                      reason: leaveForm.reason,
                      status: 'pending',
                      submittedAt: Date.now()
                    });
                    saveToDb({ ...dutyData, leaves });
                    
                    try {
                      await sendWebhook('duty_leave', {
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
                      });
                    } catch(e) { console.error("Webhook error:", e); }

                    setLeaveForm({ memberId: '', type: 'ลากิจ (Personal)', dateFrom: '', dateTo: '', reason: '' });
                    showAlert('success', 'ส่งใบลาเรียบร้อยแล้ว รอผู้มีอำนาจอนุมัติ');
                  }}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl transition-colors"
                >
                  ส่งใบลา (Submit Leave)
                </button>
              </Card>

              {/* Leave History */}
              <div className="space-y-3">
                <h3 className="text-base font-black text-white">ประวัติการลา</h3>
                {!leaveForm.memberId && (
                  <p className="text-sm text-slate-500">⬆ เลือกชื่อสมาชิกด้านบนเพื่อดูประวัติการลาของตัวเอง</p>
                )}
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="bg-slate-900/50 border-b border-slate-800 text-xs text-slate-500 uppercase">
                        <tr>
                          <th className="px-5 py-3">ประเภท / ชื่อ</th>
                          <th className="px-5 py-3">วันที่</th>
                          <th className="px-5 py-3 text-right">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {!filteredLeaves.length ? (
                          <tr><td colSpan="3" className="px-5 py-8 text-center text-slate-500">
                            {leaveForm.memberId ? 'ยังไม่มีประวัติการลา' : 'กรุณาเลือกชื่อสมาชิกก่อน'}
                          </td></tr>
                        ) : (
                          filteredLeaves.map(lv => (
                            <tr key={lv.id} className="hover:bg-slate-800/30">
                              <td className="px-5 py-4">
                                <div className="font-bold text-white text-xs">{lv.type}</div>
                                <div className="text-slate-400 text-xs mt-0.5">{lv.memberName}</div>
                              </td>
                              <td className="px-5 py-4 text-slate-400 text-xs">{lv.dateFrom} — {lv.dateTo}</td>
                              <td className="px-5 py-4 text-right">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                  lv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                  lv.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {lv.status === 'approved' ? 'อนุมัติ' : lv.status === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'resign' && (
            <div className="space-y-6">
              <div className="border-2 border-red-500/30 rounded-2xl p-6 space-y-5 bg-red-500/5">
                <h2 className="text-lg font-black text-red-400">แบบฟอร์มแจ้งลาออก</h2>

                {/* Warning */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
                  <span className="text-red-400 text-lg shrink-0">⚠️</span>
                  <div className="text-sm">
                    <div className="font-black text-red-300 mb-1">ข้อควรระวัง:</div>
                    <div className="text-slate-300">กรุณาแจ้งล่วงหน้าอย่างน้อย 15-30 วัน ตามระเบียบของสภา การส่งแบบฟอร์มนี้จะมีผลทันทีและจะถูกส่งไปยังสภาอาวุโส</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400">ชื่อผู้ยื่นเรื่อง</label>
                  <div className="w-full bg-slate-900/50 border border-red-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCircle size={22} className="text-red-400" />
                      <span className="text-white font-bold">
                        {currentMember?.name || user?.displayName || user?.email || 'ไม่พบข้อมูล'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">🔒 ล็อคจากบัญชี</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400">วันทำงานวันสุดท้าย (LAST WORKING DAY)</label>
                  <input
                    type="date"
                    className="w-full bg-slate-900 border border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                    value={resignForm.lastDay}
                    onChange={e => setResignForm({...resignForm, lastDay: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400">เหตุผลที่ลาออก (REASON)</label>
                  <textarea
                    rows={4}
                    placeholder="ระบุสาเหตุการลาออก..."
                    className="w-full bg-slate-900 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 resize-none"
                    value={resignForm.reason}
                    onChange={e => setResignForm({...resignForm, reason: e.target.value})}
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={resignForm.confirmed}
                    onChange={e => setResignForm({...resignForm, confirmed: e.target.checked})}
                    className="mt-1 w-4 h-4 accent-red-500 shrink-0"
                  />
                  <span className="text-sm text-slate-300 leading-relaxed">
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
                    const resignations = [...(dutyData.resignations || [])];
                    resignations.unshift({
                      id: 'res_' + Date.now(),
                      memberId: resignForm.memberId,
                      memberName: memberName,
                      lastDay: resignForm.lastDay,
                      reason: resignForm.reason,
                      status: 'pending',
                      submittedAt: Date.now()
                    });
                    saveToDb({ ...dutyData, resignations });

                    try {
                      await sendWebhook('duty_leave', {
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
                      });
                    } catch(e) { console.error("Webhook error:", e); }

                    setResignForm({ memberId: '', lastDay: '', reason: '', confirmed: false });
                    showAlert('success', 'ยื่นเรื่องลาออกเรียบร้อยแล้ว กรุณารออนุมัติจากสภา');
                  }}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors"
                >
                  ยืนยันการลาออก (Confirm Resignation)
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
