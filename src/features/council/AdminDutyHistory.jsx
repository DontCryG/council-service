import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ClockClockwise, MagnifyingGlass, Calculator } from '@phosphor-icons/react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PayrollModal from './PayrollModal';

const RANK_RATES = {
  'ประธานสภา': { ic: 330000 },
  'รองประธานสภา': { ic: 300000 },
  'เลขานุการสภา': { ic: 240000 },
  'สภาอาวุโส': { ic: 210000 },
  'สภาชำนาญการ': { ic: 210000 },
  'สภาประจำการ': { ic: 180000 },
  'สภาฝึกหัด': { ic: 120000 }
};

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

export default function AdminDutyHistory() {
  const { user } = useAppStore();
  const [dutyData, setDutyData] = useState({ sessions: [], leaves: [] });
  const [councilMembers, setCouncilMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filter for history
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`;
  const today = toInputDate(Date.now());
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filterMemberId, setFilterMemberId] = useState('all');
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

  useEffect(() => {
    const unsubDuty = onSnapshot(doc(db, 'app_state', 'duty'), (snap) => {
      if (snap.exists()) setDutyData(snap.data());
      else setDutyData({ sessions: [], leaves: [] });
      setLoading(false);
    });
    const unsubCouncil = onSnapshot(doc(db, 'app_state', 'council_members'), (snap) => {
      if (snap.exists()) setCouncilMembers(snap.data().members || []);
    });
    return () => { unsubDuty(); unsubCouncil(); };
  }, []);

  const handleSearch = () => {
    const from = new Date(dateFrom).getTime();
    const to = new Date(dateTo + 'T23:59:59').getTime();
    const filtered = (dutyData.sessions || []).filter(s => {
      if (s.checkIn < from || s.checkIn > to) return false;
      if (filterMemberId !== 'all' && s.memberId !== filterMemberId) return false;
      return true;
    });
    setFilteredHistory(filtered);
  };

  useEffect(() => { handleSearch(); }, [dutyData.sessions, dateFrom, dateTo, filterMemberId]);

  const totalFilteredMinutes = filteredHistory.reduce((a, s) => a + (s.netMinutes || 0), 0);
  const avgMinutes = filteredHistory.length > 0 ? (totalFilteredMinutes / filteredHistory.length) : 0;

  const memberTotals = filteredHistory.reduce((acc, s) => {
    if (!acc[s.memberId]) {
      const member = councilMembers.find(m => m.id === s.memberId);
      const rank = member?.rank || 'สภาฝึกหัด';
      const rates = RANK_RATES[rank] || RANK_RATES['สภาฝึกหัด'];
      
      acc[s.memberId] = { 
        id: s.memberId, 
        name: member?.name || s.memberName, 
        username: member?.username || '',
        rank,
        icRate: rates.ic,
        totalMinutes: 0 
      };
    }
    acc[s.memberId].totalMinutes += (s.netMinutes || 0);
    return acc;
  }, {});
  const leaderboard = Object.values(memberTotals).sort((a, b) => b.totalMinutes - a.totalMinutes);

  const filteredLeaves = (dutyData.leaves || []).filter(lv => {
    if (filterMemberId !== 'all' && lv.memberId !== filterMemberId) return false;
    return true;
  });

  if (user?.role !== 'admin') {
    return <div className="p-10 text-center text-red-500 font-bold">ไม่มีสิทธิ์เข้าถึง (Access Denied)</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClockClockwise className="text-blue-500" weight="duotone" />
          ประวัติรวมสภา (Admin)
        </h1>
        <p className="text-slate-400 mt-1">ดูประวัติการเข้าเวรและการลาของสมาชิกสภาทั้งหมด</p>
      </div>

      {loading ? (
        <Card className="py-20 text-center text-slate-500">กำลังโหลด...</Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-black text-white mb-4">ตัวกรองข้อมูล</h2>
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
              <select
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 flex-1 sm:max-w-xs"
                value={filterMemberId}
                onChange={e => setFilterMemberId(e.target.value)}
              >
                <option value="all">ดูของทุกคน (All)</option>
                {councilMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors"
              >
                <MagnifyingGlass size={16} /> ค้นหา
              </button>
              <button
                onClick={() => setIsPayrollModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors"
              >
                <Calculator size={16} /> สรุปเงินเดือน (Payroll)
              </button>
            </div>
          </Card>

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

          {/* Leaderboard */}
          {filterMemberId === 'all' && leaderboard.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                🏆 สรุปเวลารวมแต่ละบุคคล (เรียงตามชั่วโมงงาน)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leaderboard.map((m, idx) => (
                  <Card key={m.id} className="p-4 flex items-center gap-4 bg-slate-800/30">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                      idx === 2 ? 'bg-orange-700/20 text-orange-400' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{m.name}</div>
                      <div className="text-emerald-400 text-xs mt-0.5">{formatDuration(m.totalMinutes)}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Duty History Table */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-white">ประวัติการลงเวลา (เข้า-ออกงาน)</h3>
            {/* Duty History Feed */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card className="p-8 text-center text-slate-500">ไม่มีข้อมูลในช่วงวันที่เลือก</Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHistory.map(s => (
                    <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white">
                            {s.memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{s.memberName}</h4>
                            <span className="text-xs text-slate-400">{formatThaiDate(s.checkIn)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-amber-400 text-lg leading-none">{formatDuration(s.netMinutes)}</div>
                          {s.totalBreakMinutes > 0 && <span className="text-[10px] text-slate-500 font-bold">พัก {formatDuration(s.totalBreakMinutes)}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-950 rounded-xl p-3 border border-slate-800/50">
                        <div className="text-center flex-1 border-r border-slate-800">
                          <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">IN</span>
                          <span className="font-mono text-emerald-400 font-bold text-sm">{formatTime(s.checkIn)}</span>
                        </div>
                        <div className="text-center flex-1 relative">
                          {s.autoCheckOut && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                          <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">OUT</span>
                          <span className={`font-mono font-bold text-sm ${s.autoCheckOut ? 'text-red-500' : 'text-red-400'}`}>
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

          {/* Leave History Table */}
          <div className="space-y-3 pt-6">
            <h3 className="text-base font-black text-white">ประวัติการลา</h3>
            {/* Leave History Feed */}
            <div className="space-y-3">
              {!filteredLeaves.length ? (
                <Card className="p-8 text-center text-slate-500">ไม่มีประวัติการลา</Card>
              ) : (
                filteredLeaves.map(lv => (
                  <div key={lv.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        lv.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        lv.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {lv.type.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{lv.type}</span>
                          <span className="text-xs text-slate-500">{lv.memberName}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400 mt-0.5 block">{lv.dateFrom} — {lv.dateTo}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      lv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      lv.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {lv.status === 'approved' ? 'อนุมัติ' : lv.status === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      )}

      <PayrollModal 
        isOpen={isPayrollModalOpen} 
        onClose={() => setIsPayrollModalOpen(false)} 
        leaderboard={leaderboard} 
        period={`${formatThaiDate(dateFrom)} - ${formatThaiDate(dateTo)}`} 
      />
    </div>
  );
}
