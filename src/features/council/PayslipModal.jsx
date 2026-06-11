import { useState, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { 
  DownloadSimple, 
  ShieldCheck, 
  UserCircle, 
  Calculator, 
  ChartLineUp, 
  WarningCircle, 
  Receipt 
} from '@phosphor-icons/react';
import { toPng } from 'html-to-image';

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 นาที';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} นาที`;
  return `${h} ชม. ${m > 0 ? m + ' นาที' : ''}`;
}

export default function PayslipModal({ isOpen, onClose, member, period, icRate }) {
  const [storyViews, setStoryViews] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const printRef = useRef(null);

  if (!isOpen || !member) return null;

  const handleDownload = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    try {
      const dataUrl = await toPng(printContent, {
        pixelRatio: 2,
        backgroundColor: '#020617', // slate-950
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '800px'
        }
      });
      const link = document.createElement('a');
      link.download = `Payslip_${member.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const hours = member.totalMinutes / 60;
  const baseSalary = hours * icRate;
  const storyBonus = storyViews * 200000;
  const netPay = baseSalary + storyBonus + Number(bonus) - Number(deductions);

  const formatMoney = (val) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ใบสลิปเงินเดือน (Payslip)" className="max-w-6xl w-[98%]">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Controls */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Calculator size={18} className="text-amber-500" /> ตั้งค่าสลิป
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">ค่าตรวจดูสตอรี่ (ครั้งละ 200,000)</label>
              <input 
                type="number" 
                min="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                value={storyViews}
                onChange={e => setStoryViews(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">เงินเพิ่ม / โบนัสพิเศษ</label>
              <input 
                type="number" 
                min="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                value={bonus}
                onChange={e => setBonus(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">รายการหักเงิน</label>
              <input 
                type="number" 
                min="0"
                className="w-full bg-slate-950 border border-red-900/50 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                value={deductions}
                onChange={e => setDeductions(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-none py-3 shadow-lg shadow-blue-500/20 text-white">
                <DownloadSimple size={18} weight="bold" /> ดาวน์โหลดสลิป (Save)
              </Button>
            </div>
          </div>
        </div>

        {/* Payslip Preview */}
        <div className="flex-1 overflow-x-auto rounded-xl custom-scrollbar relative border border-slate-800 bg-slate-950/50">
          
          {/* THE BILL: 800px fixed width for perfect capture */}
          <div ref={printRef} className="w-[800px] shrink-0 bg-[#020617] p-10 relative overflow-hidden text-slate-300 mx-auto">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-slate-800/20 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 space-y-8">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <ShieldCheck size={36} weight="fill" className="text-slate-900" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">สำนักงานสภาเมือง</h1>
                    <p className="text-xs text-amber-500 font-bold tracking-widest uppercase mt-0.5">The Council Office</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-500 tracking-tighter uppercase mb-2">
                    Payslip
                  </h2>
                  <div className="text-xs font-bold text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 inline-block">
                    วันที่ออก: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Employee Details (Glassmorphism Cards) */}
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <UserCircle size={18} className="text-blue-400" /> ข้อมูลพนักงาน
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                    <div className="text-slate-500">รหัสพนักงาน</div>
                    <div className="font-bold text-white truncate">{member.username || '-'}</div>
                    <div className="text-slate-500">ชื่อ-สกุล</div>
                    <div className="font-bold text-white">{member.name}</div>
                    <div className="text-slate-500">ตำแหน่ง</div>
                    <div className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded inline-flex w-fit">{member.rank || 'สภาฝึกหัด'}</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Calculator size={18} className="text-emerald-400" /> ข้อมูลรอบการจ่าย
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
                    <div className="text-slate-500">งวดการจ่าย</div>
                    <div className="font-bold text-white">{period}</div>
                    <div className="text-slate-500">ชั่วโมงงานสุทธิ</div>
                    <div className="font-bold text-emerald-400">{formatDuration(member.totalMinutes)}</div>
                    <div className="text-slate-500">อัตรา/ชั่วโมง</div>
                    <div className="font-bold text-white">{formatMoney(icRate)} <span className="text-xs text-slate-500 font-normal">บาท/ชม.</span></div>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-md">
                <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Receipt size={20} className="text-amber-500" /> รายละเอียดรายได้ (EARNINGS)
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">จำนวนเงิน (บาท)</div>
                </div>
                
                <div className="p-3 space-y-1">
                  {/* Base Salary */}
                  <div className="flex justify-between items-center px-4 py-3.5 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <div>
                      <div className="font-bold text-white">ค่าตอบแทนพื้นฐาน <span className="text-slate-500 font-normal ml-1">(Base Salary)</span></div>
                      <div className="text-xs text-slate-500 mt-1">{formatDuration(member.totalMinutes)} × {formatMoney(icRate)} บ./ชม.</div>
                    </div>
                    <div className="text-lg font-mono font-black text-white tracking-tight">{formatMoney(baseSalary)}</div>
                  </div>

                  {/* Story Bonus */}
                  <div className="flex justify-between items-center px-4 py-3.5 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <div>
                      <div className="font-bold text-white">ค่าตรวจดูสตอรี่ <span className="text-slate-500 font-normal ml-1">(Story Views)</span></div>
                      <div className="text-xs text-slate-500 mt-1">{storyViews} ครั้ง × 200,000 บ.</div>
                    </div>
                    <div className="text-lg font-mono font-black text-blue-400 tracking-tight">{storyViews > 0 ? formatMoney(storyBonus) : '-'}</div>
                  </div>

                  {/* Bonus */}
                  <div className="flex justify-between items-center px-4 py-3.5 rounded-xl hover:bg-slate-800/40 transition-colors border-t border-slate-800/50 mt-2 pt-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      <ChartLineUp size={18} className="text-emerald-500" /> เงินเพิ่ม / โบนัสพิเศษ <span className="text-slate-500 font-normal ml-1">(Allowance/Bonus)</span>
                    </div>
                    <div className="text-lg font-mono font-black text-emerald-400 tracking-tight">{bonus > 0 ? formatMoney(bonus) : '-'}</div>
                  </div>

                  {/* Deductions */}
                  <div className="flex justify-between items-center px-4 py-3.5 rounded-xl bg-red-950/20 border border-red-900/30 mt-2">
                    <div className="font-bold text-red-400 flex items-center gap-2">
                      <WarningCircle size={18} /> รายการหัก <span className="text-red-500/60 font-normal ml-1">(Deductions)</span>
                    </div>
                    <div className="text-lg font-mono font-black text-red-400 tracking-tight">{deductions > 0 ? `-${formatMoney(deductions)}` : '-'}</div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="flex justify-end pt-2">
                <div className="bg-gradient-to-r from-blue-900/60 to-slate-900 border border-blue-500/30 rounded-2xl p-6 w-[420px] shadow-2xl shadow-blue-900/20 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <div className="text-blue-300 font-bold text-sm uppercase tracking-wider mb-0.5">รายรับสุทธิ</div>
                      <div className="text-blue-400/70 font-bold text-[10px] uppercase tracking-widest">Net Pay</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500/50 text-2xl font-light">฿</span>
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 tracking-tighter drop-shadow-sm">
                        {formatMoney(netPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between px-12 pt-10 text-center pb-4">
                <div>
                  <div className="w-56 border-b-2 border-dashed border-slate-700 mb-4"></div>
                  <div className="font-bold text-sm text-slate-400 uppercase tracking-widest">ผู้อนุมัติ</div>
                  <div className="text-[10px] text-slate-600 mt-1 uppercase">Authorized Signatory</div>
                </div>
                <div>
                  <div className="w-56 border-b-2 border-dashed border-slate-700 mb-4"></div>
                  <div className="font-bold text-sm text-slate-400 uppercase tracking-widest">ผู้รับเงิน</div>
                  <div className="text-[10px] text-slate-600 mt-1 uppercase">Employee Signature</div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
