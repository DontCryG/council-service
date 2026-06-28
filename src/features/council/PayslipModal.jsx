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
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [slipHeight, setSlipHeight] = useState(800);

  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 24; 
        setScale(Math.min(w / 850, 0.75));
      }
      if (printRef.current) {
        setSlipHeight(printRef.current.offsetHeight);
      }
    };

    updateScale();
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [isOpen, bonus, deductions, member]);

  if (!isOpen || !member) return null;

  const handleDownload = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    try {
      const dataUrl = await toPng(printContent, {
        pixelRatio: 2,
        backgroundColor: '#020617', // slate-950
        cacheBust: true
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

        {/* Payslip Preview */}
        <div ref={containerRef} className="flex-1 rounded-2xl relative border border-slate-700/50 bg-slate-950/80 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex justify-center py-6 overflow-hidden" style={{ minHeight: `${slipHeight * scale + 48}px` }}>
          
          {/* THE BILL: 850px fixed width for perfect capture, scaled for mobile */}
          <div style={{ width: `${850 * scale}px`, height: `${slipHeight * scale}px` }} className="relative">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} className="absolute top-0 left-0">
              <div ref={printRef} style={{ width: '850px', minWidth: '850px', maxWidth: '850px', WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%' }} className="bg-[#020617] p-12 overflow-hidden text-slate-300 border-4 border-[#020617] shadow-2xl rounded-sm">
            {/* Ambient Backgrounds & Watermark */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#020617] to-[#020617] pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none flex flex-col items-center justify-center">
              <ShieldCheck size={400} weight="duotone" className="text-white" />
              <div className="text-[120px] font-black uppercase tracking-[2rem] mt-10">COUNCIL</div>
            </div>
            
            <div className="relative z-10 space-y-10">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800/80 pb-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] shrink-0">
                    <ShieldCheck size={48} weight="fill" className="text-slate-900 drop-shadow-md" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white drop-shadow-lg">สำนักงานสภาเมือง</h1>
                    <p className="text-sm text-amber-500 font-black uppercase mt-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">The Council Office</p>
                    <p className="text-xs text-slate-500 mt-2 font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}-{Date.now().toString().slice(-4)}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500 uppercase mb-4 drop-shadow-2xl pr-4 pb-1">
                    PAYSLIP
                  </h2>
                  <div className="flex items-center gap-3">
                    <QrCode size={36} className="text-slate-600 shrink-0" />
                    <div className="text-xs font-black text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 shadow-inner whitespace-nowrap">
                      วันที่ออก: <span className="text-white ml-2">{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Details (Glassmorphism Cards) */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-700 group-hover:bg-blue-500/20"></div>
                  <div className="flex items-center gap-3 text-slate-400 font-black text-xs uppercase mb-4">
                    <UserCircle size={20} className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" /> ข้อมูลพนักงาน
                  </div>
                  <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-y-4 text-sm relative z-10">
                    <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center">รหัสประจำตัว</div>
                    <div className="font-black text-white font-mono text-sm bg-slate-950/50 px-2 py-0.5 rounded w-full break-all" title={member.username || 'UNKNOWN'}>{member.username || 'UNKNOWN'}</div>
                    <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center">ชื่อ-สกุล</div>
                    <div className="font-black text-white text-lg">{member.name}</div>
                    <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center">ตำแหน่ง</div>
                    <div className="font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg inline-flex w-fit drop-shadow-[0_0_5px_rgba(245,158,11,0.2)] whitespace-nowrap">{member.rank || 'สภาฝึกหัด'}</div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-700 group-hover:bg-emerald-500/20"></div>
                  <div className="flex items-center gap-3 text-slate-400 font-black text-xs uppercase mb-4">
                    <Calculator size={20} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" /> ข้อมูลรอบการจ่าย
                  </div>
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-4 text-sm relative z-10">
                    <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center">งวดการจ่าย</div>
                    <div className="font-black text-white text-base bg-slate-950/50 px-3 py-1 rounded-lg w-fit whitespace-nowrap">{period}</div>
                    <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center">ชั่วโมงสุทธิ</div>
                    <div className="font-black text-emerald-400 text-xl drop-shadow-[0_0_5px_rgba(52,211,153,0.4)] whitespace-nowrap">{formatDuration(member.totalMinutes)}</div>
                    <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center">อัตรา/ชั่วโมง</div>
                    <div className="font-black text-white text-lg whitespace-nowrap">{formatMoney(icRate)} <span className="text-xs text-slate-500 font-bold uppercase">บาท/ชม.</span></div>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                <div className="bg-slate-800/60 px-8 py-5 border-b border-slate-700/80 flex items-center justify-between">
                  <div className="font-black text-white flex items-center gap-3 text-lg">
                    <Receipt size={24} className="text-amber-500 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> <span className="whitespace-nowrap">รายละเอียดรายรับ-รายจ่าย</span>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase shrink-0 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800 whitespace-nowrap">จำนวนเงิน (บาท)</div>
                </div>
                
                <div className="p-4 space-y-2">
                  {/* Base Salary */}
                  <div className="flex justify-between items-center px-6 py-4 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/50">
                    <div>
                      <div className="flex flex-col">
                        <div className="font-black text-white text-base leading-tight">ค่าตอบแทนพื้นฐาน</div>
                        <div className="text-slate-500 font-bold text-[10px] uppercase mt-0.5 tracking-widest">Base Salary</div>
                      </div>
                      <div className="text-sm font-bold text-slate-500 mt-2">{formatDuration(member.totalMinutes)} <span className="mx-1 text-slate-600">×</span> {formatMoney(icRate)} บ./ชม.</div>
                    </div>
                    <div className="text-xl font-mono font-black text-white shrink-0">{formatMoney(baseSalary)}</div>
                  </div>

                  {/* Story Bonus */}
                  <div className="flex justify-between items-center px-6 py-4 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/50">
                    <div>
                      <div className="flex flex-col">
                        <div className="font-black text-white text-base leading-tight">ค่าตรวจดูสตอรี่</div>
                        <div className="text-slate-500 font-bold text-[10px] uppercase mt-0.5 tracking-widest">Story Views</div>
                      </div>
                      <div className="text-sm font-bold text-slate-500 mt-2">{storyViews} ครั้ง <span className="mx-1 text-slate-600">×</span> 200,000 บ.</div>
                    </div>
                    <div className="text-xl font-mono font-black text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)] shrink-0">{storyViews > 0 ? formatMoney(storyBonus) : '-'}</div>
                  </div>

                  {/* Bonus */}
                  <div className="flex justify-between items-center px-6 py-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 mt-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl"></div>
                    <div className="flex items-start gap-4 pl-2">
                      <ChartLineUp size={24} className="text-emerald-500 shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] mt-0.5" /> 
                      <div className="flex flex-col">
                        <div className="font-black text-white text-base leading-tight">เงินเพิ่ม / โบนัสพิเศษ</div>
                        <div className="text-emerald-500/80 font-bold text-[10px] uppercase mt-0.5 tracking-widest">Allowance/Bonus</div>
                      </div>
                    </div>
                    <div className="text-xl font-mono font-black text-emerald-400 shrink-0 pl-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                      {bonus > 0 ? `+${formatMoney(bonus)}` : '-'}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="flex justify-between items-center px-6 py-5 rounded-2xl bg-red-950/20 border border-red-900/30 mt-2 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
                    <div className="flex items-start gap-4 pl-2">
                      <WarningCircle size={24} className="text-red-400 shrink-0 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)] mt-0.5" /> 
                      <div className="flex flex-col">
                        <div className="font-black text-red-400 text-base leading-tight">รายการหักเงิน</div>
                        <div className="text-red-500/80 font-bold text-[10px] uppercase mt-0.5 tracking-widest">Deductions</div>
                      </div>
                    </div>
                    <div className="text-xl font-mono font-black text-red-500 shrink-0 pl-4 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                      {deductions > 0 ? `-${formatMoney(deductions)}` : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="flex justify-end pt-4">
                <div style={{ width: '480px' }} className="bg-gradient-to-br from-blue-900/80 via-slate-900 to-[#020617] border-2 border-blue-500/40 rounded-[2rem] p-8 shrink-0 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden backdrop-blur-xl group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[60px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-blue-500/30 group-hover:scale-150"></div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                  
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <div className="text-blue-300 font-black text-lg uppercase mb-1 drop-shadow-md">รายรับสุทธิ</div>
                      <div className="text-blue-500/80 font-black text-[11px] uppercase bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50 w-fit tracking-widest">Net Pay</div>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
                      <span className="text-blue-500/50 text-3xl font-light">฿</span>
                      <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] pr-1">
                        {formatMoney(netPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="relative z-10 mt-16 pt-8 border-t-2 border-dashed border-slate-700 flex justify-between px-8">
                <div className="flex gap-16">
                  <div className="text-center">
                    <div className="h-16 w-32 border-b border-slate-600 mb-2 mx-auto"></div>
                    <div className="font-black text-base text-slate-300 uppercase tracking-widest drop-shadow-md">ผู้จ่ายเงิน</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Authorized Signature</div>
                  </div>
                </div>
                <div className="flex gap-16">
                  <div className="text-center">
                    <div className="h-16 w-32 border-b border-slate-600 mb-2 mx-auto"></div>
                    <div className="font-black text-base text-slate-300 uppercase tracking-widest drop-shadow-md">ผู้รับเงิน</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Employee Signature</div>
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

    </div>
  </Modal>
  );
}
