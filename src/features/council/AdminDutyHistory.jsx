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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-24 relative z-10">
      
      {/* Ambient Backgrounds */}
      <div className="fixed top-20 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="fixed bottom-10 left-10 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-12 flex flex-col items-center justify-center text-center group transition-all duration-700 hover:border-blue-500/30 hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700 -mr-20 -mt-20"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-sky-500 to-transparent"></div>
        
        <div className="w-24 h-24 rounded-[2rem] bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
          <ClockClockwise size={56} weight="duotone" className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-wide mb-4">
          ประวัติรวมสภา <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">(Admin)</span>
        </h1>
        <p className="text-slate-400 font-medium tracking-wide max-w-lg mx-auto">
          ตรวจสอบประวัติการลงเวลาทำงาน (เข้า-ออกเวร) และการลา ของสมาชิกสภาทั้งหมด
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-400 font-bold tracking-widest uppercase">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Filters */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <MagnifyingGlass size={16} weight="fill" className="text-blue-500" /> ตัวกรองข้อมูล (Filters)
            </h2>
            <div className="flex flex-col md:flex-row items-end gap-5">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                <input
                  type="date"
                  className="w-full sm:w-1/2 bg-slate-950/80 border-2 border-slate-700/80 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold shadow-inner"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
                <span className="text-slate-500 font-black px-2 hidden sm:block">-</span>
                <input
                  type="date"
                  className="w-full sm:w-1/2 bg-slate-950/80 border-2 border-slate-700/80 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold shadow-inner"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
              <select
                className="w-full md:w-auto bg-slate-950/80 border-2 border-slate-700/80 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold shadow-inner min-w-[200px]"
                value={filterMemberId}
                onChange={e => setFilterMemberId(e.target.value)}
              >
                <option value="all">ดูทุกคน (All Members)</option>
                {councilMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-black transition-all border border-slate-700 hover:border-slate-500 shadow-lg hover:-translate-y-0.5"
              >
                <MagnifyingGlass size={20} weight="bold" /> ค้นหา
              </button>
              <button
                onClick={() => setIsPayrollModalOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-3.5 rounded-xl font-black transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                <Calculator size={20} weight="bold" /> สรุปเงินเดือน
              </button>
            </div>
          </div>

          {/* Summary */}
          {filteredHistory.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 backdrop-blur-md border border-blue-500/30 rounded-3xl p-6 flex items-center justify-between group hover:bg-blue-900/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <ClockClockwise size={28} weight="duotone" className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-blue-400/80 uppercase tracking-widest mb-1">เวลารวมทั้งหมด</div>
                    <div className="text-3xl font-black text-white tracking-tight">{formatDuration(totalFilteredMinutes)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-900/40 to-slate-900/40 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 flex items-center justify-between group hover:bg-amber-900/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                    <ClockClockwise size={28} weight="fill" className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-400/80 uppercase tracking-widest mb-1">เวลาเฉลี่ย/รอบงาน</div>
                    <div className="text-3xl font-black text-white tracking-tight">{formatDuration(avgMinutes)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {filterMemberId === 'all' && leaderboard.length > 0 && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                🏆 สรุปเวลารวมแต่ละบุคคล
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaderboard.map((m, idx) => (
                  <div key={m.id} className="relative group overflow-hidden bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-amber-500/50' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 shadow-slate-400/50' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-950 shadow-orange-600/50' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-base truncate">{m.name}</div>
                      <div className="text-emerald-400 text-sm font-bold mt-1 tracking-wide">{formatDuration(m.totalMinutes)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duty History Table */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              ประวัติการลงเวลา
            </h3>
            
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed">
                ไม่มีประวัติการทำงานในช่วงเวลาที่เลือก
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredHistory.map(s => (
                  <div key={s.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all group">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-white shadow-inner">
                          {s.memberName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-white text-base tracking-wide">{s.memberName}</h4>
                          <span className="text-xs text-slate-500 font-bold">{formatThaiDate(s.checkIn)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-amber-400 text-xl tracking-tight">{formatDuration(s.netMinutes)}</div>
                        {s.totalBreakMinutes > 0 && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded-full mt-1 inline-block">พัก {formatDuration(s.totalBreakMinutes)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/50 rounded-xl p-4 border border-slate-800/50 group-hover:bg-slate-900 transition-colors">
                      <div className="text-center flex-1 border-r border-slate-800/50">
                        <span className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">IN</span>
                        <span className="font-mono text-emerald-400 font-bold text-base bg-emerald-400/10 px-3 py-1 rounded-lg">{formatTime(s.checkIn)}</span>
                      </div>
                      <div className="text-center flex-1 relative">
                        {s.autoCheckOut && (
                          <span className="absolute top-1 right-4 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                        )}
                        <span className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">OUT</span>
                        <span className={`font-mono font-bold text-base px-3 py-1 rounded-lg ${s.autoCheckOut ? 'text-red-500 bg-red-500/10' : 'text-slate-300 bg-slate-800/50'}`}>
                          {formatTime(s.checkOut)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave History Table */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              ประวัติการลา
            </h3>
            
            <div className="space-y-4">
              {!filteredLeaves.length ? (
                <div className="py-12 text-center text-slate-500 font-bold bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed">
                  ไม่มีประวัติการลาในช่วงเวลาที่เลือก
                </div>
              ) : (
                filteredLeaves.map(lv => (
                  <div key={lv.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-all group hover:shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${
                        lv.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        lv.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {lv.type.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-white text-base tracking-wide">{lv.type}</span>
                          <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">{lv.memberName}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400/80 font-bold">{lv.dateFrom} — {lv.dateTo}</span>
                      </div>
                    </div>
                    
                    <span className={`text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border flex-shrink-0 text-center ${
                      lv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      lv.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {lv.status === 'approved' ? 'อนุมัติแล้ว' : lv.status === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
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
