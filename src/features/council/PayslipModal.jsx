import { useState, useRef, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { 
  DownloadSimple, 
  ShieldCheck, 
  UserCircle, 
  Calculator, 
  ChartLineUp, 
  WarningCircle, 
  Receipt,
  QrCode,
  Money
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
        width: 1080,
        height: 1080,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      const date = new Date();
      const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      const safeName = member.name.replace(/\s+/g, '_');
      
      const link = document.createElement('a');
      link.download = `Payslip_${safeName}_${dateStr}.png`;
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
    <Modal isOpen={isOpen} onClose={onClose} title="สร้างใบสลิปเงินเดือน" className="max-w-6xl w-[98%]">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Controls Panel */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 space-y-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <h3 className="font-black text-white border-b border-slate-800/80 pb-4 flex items-center gap-3">
              <Calculator size={20} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> 
              ตั้งค่าสลิป
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ChartLineUp size={14} className="text-blue-500" /> ค่าตรวจดูสตอรี่ (ครั้งละ 200k)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold shadow-inner"
                    value={storyViews}
                    onChange={e => setStoryViews(parseInt(e.target.value) || 0)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">ครั้ง</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Money size={14} className="text-emerald-500" /> โบนัสพิเศษ (Bonus)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-slate-950/80 border-2 border-slate-700/80 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold shadow-inner text-emerald-400"
                    value={bonus}
                    onChange={e => setBonus(parseInt(e.target.value) || 0)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">฿</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <WarningCircle size={14} className="text-red-500" /> รายการหักเงิน
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-slate-950/80 border-2 border-red-900/50 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 transition-all font-bold shadow-inner text-red-400"
                    value={deductions}
                    onChange={e => setDeductions(parseInt(e.target.value) || 0)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">฿</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <Button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-none py-4 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-1 text-white font-black rounded-xl transition-all">
                <DownloadSimple size={20} weight="bold" /> บันทึกใบสลิป (Save PNG)
              </Button>
            </div>
          </div>
        </div>

        {/* Payslip Preview (Mobile Scrollable) */}
        <div className="flex-1 overflow-x-auto pb-4 rounded-2xl border border-slate-700/50 bg-slate-950/80 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex justify-center min-w-max p-6">
            
            {/* THE BILL: 1080x1080 absolute fixed size for html-to-image without scale bugs */}
            <div ref={printRef} style={{ width: '1080px', height: '1080px', minWidth: '1080px', minHeight: '1080px', WebkitTextSizeAdjust: 'none', textSizeAdjust: 'none' }} className="bg-[#020617] p-12 overflow-hidden text-slate-300 border-4 border-[#020617] shadow-2xl rounded-sm flex flex-col justify-between relative font-sans">
            {/* Ambient Backgrounds & Watermark */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#020617] to-[#020617] pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none flex flex-col items-center justify-center">
              <ShieldCheck size={500} weight="duotone" className="text-white" />
              <div className="text-[140px] font-black uppercase tracking-[2rem] mt-10">COUNCIL</div>
            </div>
            
            {/* --- TOP SECTION --- */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800/80 pb-8 mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] shrink-0">
                    <ShieldCheck size={56} weight="fill" className="text-slate-900 drop-shadow-md" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-white drop-shadow-lg whitespace-nowrap">สำนักงานสภาเมือง</h1>
                    <p className="text-base text-amber-500 font-black uppercase mt-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)] tracking-widest whitespace-nowrap">The Council Office</p>
                    <p className="text-sm text-slate-500 mt-2 font-mono whitespace-nowrap">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}-{Date.now().toString().slice(-4)}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500 uppercase mb-4 drop-shadow-2xl pr-2 whitespace-nowrap">
                    PAYSLIP
                  </h2>
                  <div className="flex items-center gap-3">
                    <QrCode size={40} className="text-slate-600 shrink-0" />
                    <div className="text-sm font-black text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 shadow-inner whitespace-nowrap">
                      วันที่ออก: <span className="text-white ml-2">{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Details (Glassmorphism Cards) */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-700 group-hover:bg-blue-500/20"></div>
                  <div className="flex items-center gap-3 text-slate-400 font-black text-sm uppercase mb-4">
                    <UserCircle size={24} className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" /> ข้อมูลพนักงาน
                  </div>
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-y-4 text-base relative z-10">
                    <div className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center">รหัสประจำตัว</div>
                    <div className="font-black text-white font-mono text-base bg-slate-950/50 px-3 py-1 rounded w-full break-all">{member.username || 'UNKNOWN'}</div>
                    <div className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center">ชื่อ-สกุล</div>
                    <div className="font-black text-white text-xl">{member.name}</div>
                    <div className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center">ตำแหน่ง</div>
                    <div className="font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-lg inline-flex w-fit drop-shadow-[0_0_5px_rgba(245,158,11,0.2)] whitespace-nowrap">{member.rank || 'สภาฝึกหัด'}</div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-700 group-hover:bg-emerald-500/20"></div>
                  <div className="flex items-center gap-3 text-slate-400 font-black text-sm uppercase mb-4">
                    <Calculator size={24} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" /> ข้อมูลรอบการจ่าย
                  </div>
                  <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-y-4 text-base relative z-10">
                    <div className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center">งวดการจ่าย</div>
                    <div className="font-black text-white text-lg bg-slate-950/50 px-3 py-1 rounded-lg w-fit whitespace-nowrap">{period}</div>
                    <div className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center">ชั่วโมงสุทธิ</div>
                    <div className="font-black text-emerald-400 text-2xl drop-shadow-[0_0_5px_rgba(52,211,153,0.4)] whitespace-nowrap">{formatDuration(member.totalMinutes)}</div>
                    <div className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center">อัตรา/ชั่วโมง</div>
                    <div className="font-black text-white text-xl whitespace-nowrap">{formatMoney(icRate)} <span className="text-sm text-slate-500 font-bold uppercase">บาท/ชม.</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- MIDDLE SECTION (EARNINGS GRID) --- */}
            <div className="relative z-10 my-8">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <div className="bg-slate-800/60 px-8 py-5 border-b border-slate-700/80 flex items-center justify-between">
                  <div className="font-black text-white flex items-center gap-3 text-xl">
                    <Receipt size={28} className="text-amber-500 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> รายละเอียดรายรับ-รายจ่าย
                  </div>
                  <div className="text-xs font-black text-slate-400 uppercase shrink-0 bg-slate-950/50 px-4 py-1.5 rounded-full border border-slate-800">จำนวนเงิน (บาท)</div>
                </div>
                
                {/* 2x2 Grid for Earnings */}
                <div className="grid grid-cols-2 gap-4 p-6">
                  {/* Base Salary */}
                  <div className="flex flex-col justify-between px-6 py-5 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/50 h-32">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="font-black text-white text-lg leading-tight whitespace-nowrap">ค่าตอบแทนพื้นฐาน</div>
                        <div className="text-slate-500 font-bold text-xs uppercase mt-1 tracking-widest whitespace-nowrap">Base Salary</div>
                      </div>
                      <div className="text-2xl font-mono font-black text-white shrink-0 whitespace-nowrap">{formatMoney(baseSalary)}</div>
                    </div>
                    <div className="text-base font-bold text-slate-500 mt-2 whitespace-nowrap">{formatDuration(member.totalMinutes)} <span className="mx-1 text-slate-600">×</span> {formatMoney(icRate)} บ./ชม.</div>
                  </div>

                  {/* Story Bonus */}
                  <div className="flex flex-col justify-between px-6 py-5 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/50 h-32">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="font-black text-white text-lg leading-tight whitespace-nowrap">ค่าตรวจดูสตอรี่</div>
                        <div className="text-slate-500 font-bold text-xs uppercase mt-1 tracking-widest whitespace-nowrap">Story Views</div>
                      </div>
                      <div className="text-2xl font-mono font-black text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)] shrink-0 whitespace-nowrap">{storyViews > 0 ? formatMoney(storyBonus) : '-'}</div>
                    </div>
                    <div className="text-base font-bold text-slate-500 mt-2 whitespace-nowrap">{storyViews} ครั้ง <span className="mx-1 text-slate-600">×</span> 200,000 บ.</div>
                  </div>

                  {/* Bonus */}
                  <div className="flex justify-between items-center px-6 py-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 relative overflow-hidden h-32">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl"></div>
                    <div className="flex items-center gap-5 pl-3">
                      <ChartLineUp size={36} className="text-emerald-500 shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 
                      <div className="flex flex-col">
                        <div className="font-black text-white text-lg leading-tight whitespace-nowrap">เงินเพิ่ม / โบนัส</div>
                        <div className="text-emerald-500/80 font-bold text-xs uppercase mt-1 tracking-widest whitespace-nowrap">Allowance/Bonus</div>
                      </div>
                    </div>
                    <div className="text-3xl font-mono font-black text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] whitespace-nowrap">
                      {bonus > 0 ? `+${formatMoney(bonus)}` : '-'}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="flex justify-between items-center px-6 py-6 rounded-2xl bg-red-950/20 border border-red-900/30 relative overflow-hidden h-32">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 rounded-l-2xl shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
                    <div className="flex items-center gap-5 pl-3">
                      <WarningCircle size={36} className="text-red-400 shrink-0 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]" /> 
                      <div className="flex flex-col">
                        <div className="font-black text-red-400 text-lg leading-tight whitespace-nowrap">รายการหักเงิน</div>
                        <div className="text-red-500/80 font-bold text-xs uppercase mt-1 tracking-widest whitespace-nowrap">Deductions</div>
                      </div>
                    </div>
                    <div className="text-3xl font-mono font-black text-red-500 shrink-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] whitespace-nowrap">
                      {deductions > 0 ? `-${formatMoney(deductions)}` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- BOTTOM SECTION --- */}
            <div className="relative z-10 flex flex-col justify-end mt-auto">
              
              {/* Net Pay */}
              <div className="flex justify-between items-end mb-10">
                {/* Signatures */}
                <div className="flex gap-12 pl-4">
                  <div className="text-center">
                    <div className="h-20 w-40 border-b-2 border-slate-600/80 mb-3 mx-auto"></div>
                    <div className="font-black text-lg text-slate-300 uppercase tracking-widest drop-shadow-md">ผู้จ่ายเงิน</div>
                    <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Authorized Signature</div>
                  </div>
                  <div className="text-center">
                    <div className="h-20 w-40 border-b-2 border-slate-600/80 mb-3 mx-auto"></div>
                    <div className="font-black text-lg text-slate-300 uppercase tracking-widest drop-shadow-md">ผู้รับเงิน</div>
                    <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Employee Signature</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/90 via-slate-900 to-[#020617] border-2 border-blue-500/40 rounded-[2.5rem] p-10 min-w-[500px] shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden backdrop-blur-xl group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px] -mr-40 -mt-40 transition-all duration-700 group-hover:bg-blue-500/30 group-hover:scale-150"></div>
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                  
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <div className="text-blue-300 font-black text-2xl uppercase mb-2 drop-shadow-md whitespace-nowrap">รายรับสุทธิ</div>
                      <div className="text-blue-500/80 font-black text-sm uppercase bg-blue-950/50 px-3 py-1 rounded border border-blue-900/50 w-fit tracking-widest whitespace-nowrap">Net Pay</div>
                    </div>
                    <div className="flex items-center gap-4 pr-2">
                      <span className="text-blue-500/50 text-5xl font-light">฿</span>
                      <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-300 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] pr-1 whitespace-nowrap">
                        {formatMoney(netPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <div className="text-center pt-4 border-t border-slate-800/50">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  This payslip is computer generated and does not require a signature. <br/>
                  CONFIDENTIAL DOCUMENT — DO NOT SHARE
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  </Modal>
  );
}
