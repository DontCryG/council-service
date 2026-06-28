import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, FileText, CheckCircle, WarningCircle, PenNib, Eraser, ArrowLeft, ArrowRight, CurrencyDollar, CalendarBlank, Clock, Buildings } from '@phosphor-icons/react';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';

export default function LoanPublic() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  
  const [searchQuery, setSearchQuery] = useState(idParam || '');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);

  // Signature Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (idParam) {
      performSearch(idParam);
    }
  }, [idParam]);

  const performSearch = async (queryId) => {
    if (!queryId.trim()) return;
    setLoading(true);
    setError('');
    setContract(null);
    setHasSignature(false);
    
    try {
      const q = query(collection(db, 'loan_contracts'), where('contractId', '==', queryId.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('ไม่พบข้อมูลสัญญากู้ยืมนี้ กรุณาตรวจสอบเลขที่สัญญาอีกครั้ง');
      } else {
        const docData = querySnapshot.docs[0];
        setContract({ id: docData.id, ...docData.data() });
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // dark slate
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSignContract = async () => {
    if (!contract || contract.status !== 'pending_signature') return;
    if (!hasSignature) {
      showAlert('error', 'กรุณาเซ็นชื่อก่อนกดยืนยัน');
      return;
    }
    
    setSigning(true);
    try {
      const contractRef = doc(db, 'loan_contracts', contract.id);
      
      const signatureDataUrl = canvasRef.current.toDataURL();
      
      await updateDoc(contractRef, {
        status: 'pending_council_signature',
        borrowerSignedAt: serverTimestamp(),
        borrowerSignature: signatureDataUrl
      });
      
      setContract({ 
        ...contract, 
        status: 'pending_council_signature', 
        borrowerSignedAt: new Date(),
        borrowerSignature: signatureDataUrl
      });
      showAlert('success', 'เซ็นรับทราบสัญญากู้ยืมสำเร็จ');
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกลายเซ็น');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out relative">
      
      {/* Ambient Background Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none opacity-50 mix-blend-screen"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner relative backdrop-blur-md">
              <FileText size={32} weight="duotone" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ตรวจสอบข้อมูลสัญญากู้ยืม</h2>
            <p className="text-amber-400/80 font-medium mt-1">บริการตรวจสอบและเซ็นสัญญากู้ยืมเงิน</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/home')} 
          className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-300 px-6 py-3 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-slate-600 backdrop-blur-sm self-start md:self-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/0 via-slate-800/50 to-slate-800/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="relative flex items-center gap-2 font-bold text-sm">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> กลับไปศูนย์บัญชาการ
          </div>
        </button>
      </div>

      <div className="bg-slate-950/40 border border-slate-700/50 rounded-[32px] p-6 md:p-12 shadow-2xl backdrop-blur-2xl relative overflow-hidden z-10 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-[#d4af37] to-amber-600 opacity-50"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10">
          {!contract ? (
            <>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight mb-4 drop-shadow-sm">
                  ตรวจสอบข้อมูลสัญญา
                </h1>
                <p className="text-amber-400/60 md:text-lg max-w-2xl mx-auto font-medium">
                  สำหรับผู้กู้ยืม กรุณากรอกเลขที่สัญญาของคุณเพื่อเซ็นรับทราบ หรือตรวจสอบยอดค้างชำระ
                </p>
              </div>

              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center bg-slate-900/80 rounded-[20px] p-2 shadow-inner border border-slate-700/80 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none"></div>
                  <div className="pl-6 text-amber-500/50 hidden sm:block relative z-10">
                    <MagnifyingGlass size={28} weight="duotone" />
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="เช่น CNCL-10001" 
                    className="flex-1 bg-transparent border-none outline-none text-white px-4 py-4 text-xl placeholder:text-slate-600 w-full text-center sm:text-left font-black tracking-wider uppercase relative z-10"
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto h-16 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:opacity-50 text-white font-black px-10 rounded-xl transition-all text-lg tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 relative z-10"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>ค้นหา <ArrowRight size={20} weight="bold" /></>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-8 bg-red-950/40 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-lg animate-in fade-in slide-in-from-top-4 max-w-xl mx-auto backdrop-blur-sm">
                    <div className="bg-red-500/20 text-red-400 p-3 rounded-xl shrink-0 border border-red-500/20 shadow-inner">
                      <WarningCircle size={28} weight="duotone" />
                    </div>
                    <div className="text-left mt-0.5">
                      <h3 className="text-red-400 font-black text-lg mb-1 tracking-wide">ไม่พบข้อมูล</h3>
                      <p className="text-red-400/80 font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-700/80 pb-8">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                     <FileText size={28} weight="duotone" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">
                       รายละเอียดสัญญา
                     </h2>
                     <p className="text-slate-400 font-bold mt-1 text-sm tracking-widest">เลขที่: <span className="text-amber-400">{contract.contractId}</span></p>
                   </div>
                </div>
                
                <div className="flex flex-col sm:items-end">
                  {contract.status === 'pending_signature' && (
                    <div className="relative group">
                       <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                       <span className="relative bg-slate-900/80 text-blue-400 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border border-blue-500/30 flex items-center gap-2 shadow-inner">
                         <PenNib size={18} /> รอผู้กู้เซ็นรับทราบ
                       </span>
                    </div>
                  )}
                  {contract.status === 'pending_council_signature' && (
                    <div className="relative group">
                       <div className="absolute inset-0 bg-purple-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                       <span className="relative bg-slate-900/80 text-purple-400 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border border-purple-500/30 flex items-center gap-2 shadow-inner">
                         <Clock size={18} /> รอสภาเซ็นอนุมัติ
                       </span>
                    </div>
                  )}
                  {contract.status === 'active' && (
                    <div className="relative group">
                       <div className="absolute inset-0 bg-amber-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                       <span className="relative bg-slate-900/80 text-amber-400 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border border-amber-500/30 flex items-center gap-2 shadow-inner">
                         <CurrencyDollar size={18} /> กำลังผ่อนชำระ
                       </span>
                    </div>
                  )}
                  {contract.status === 'completed' && (
                    <div className="relative group">
                       <div className="absolute inset-0 bg-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                       <span className="relative bg-slate-900/80 text-emerald-400 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-2 shadow-inner">
                         <CheckCircle size={18} /> ชำระครบแล้ว
                       </span>
                    </div>
                  )}
                  {contract.status === 'defaulted' && (
                    <div className="relative group">
                       <div className="absolute inset-0 bg-red-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                       <span className="relative bg-slate-900/80 text-red-400 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border border-red-500/30 flex items-center gap-2 shadow-inner">
                         <WarningCircle size={18} /> ผิดนัดชำระ
                       </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Borrower Name */}
                <div className="bg-slate-900/40 p-8 rounded-[24px] border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group hover:border-slate-600 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                    <div className="text-[11px] font-black text-slate-500 tracking-widest uppercase mb-2">ชื่อผู้กู้ยืม</div>
                    <div className="text-2xl font-black text-white">{contract.borrowerName}</div>
                  </div>
                </div>
                
                {/* Total Loan */}
                <div className="bg-slate-900/40 p-8 rounded-[24px] border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors"></div>
                  <div className="relative z-10 flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">ยอดเงินกู้รวม (ดอกเบี้ย)</span>
                    <CurrencyDollar size={24} className="text-amber-500" weight="duotone" />
                  </div>
                  <div className="relative z-10 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tight">
                    {(contract.totalAmount || contract.principalAmount || 0).toLocaleString()} <span className="text-2xl text-amber-500/50">฿</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-slate-900/40 p-8 rounded-[24px] border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/30 transition-colors flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="relative z-10 flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">วิธีการชำระ</span>
                    <CalendarBlank size={24} className="text-blue-400" weight="duotone" />
                  </div>
                  <div className="relative z-10 text-xl font-black text-white">
                    {contract.paymentMethod === 'full' ? (
                      <span className="text-emerald-400 flex items-center gap-2"><CheckCircle size={20} /> ชำระเต็มจำนวน</span>
                    ) : (
                      <>
                        <span className="text-slate-300 font-medium">รายวัน วันละ</span> {' '}
                        <span className="text-blue-400 text-2xl">
                        {contract.installmentAmount 
                          ? contract.installmentAmount.toLocaleString() 
                          : (() => {
                              if (!contract.dueDate || !contract.createdAt) return 'ไม่ระบุ';
                              const start = contract.createdAt?.toDate ? contract.createdAt.toDate() : new Date(contract.createdAt);
                              start.setHours(0,0,0,0);
                              const end = new Date(contract.dueDate);
                              end.setHours(0,0,0,0);
                              const diffTime = end - start;
                              const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                              const total = contract.totalAmount || contract.principalAmount || 0;
                              return Math.ceil(total / diffDays).toLocaleString();
                            })()
                        }
                        </span> <span className="text-blue-400/50">฿</span>
                      </>
                    )}
                  </div>
                  {contract.dueDate && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm relative z-10">
                      <span className="text-slate-500 font-black tracking-wider uppercase text-[10px]">วันสิ้นสุดสัญญา:</span>
                      <span className="text-slate-300 font-bold bg-slate-800/50 px-3 py-1 rounded-lg">
                        {new Date(contract.dueDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Due */}
                <div className="bg-gradient-to-br from-red-950/20 to-slate-900/40 p-8 rounded-[24px] border border-red-500/20 backdrop-blur-sm relative overflow-hidden group hover:border-red-500/40 transition-colors flex flex-col justify-center shadow-inner">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-500/20 transition-colors"></div>
                  <div className="relative z-10 flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-red-400/70 tracking-widest uppercase">ยอดที่ต้องชำระทั้งสิ้น</span>
                    <WarningCircle size={24} className="text-red-400" weight="duotone" />
                  </div>
                  <div className="relative z-10 text-4xl font-black text-red-400 tracking-tight drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]">
                    {(contract.totalAmount || contract.principalAmount || 0).toLocaleString()} <span className="text-2xl opacity-50">฿</span>
                  </div>
                </div>
              </div>

              {(contract.reason || contract.conditions) && (
                <div className="bg-slate-900/40 p-8 rounded-[24px] border border-slate-700/50 mb-10 relative overflow-hidden shadow-inner">
                  <div className="text-[11px] font-black text-slate-500 mb-4 tracking-widest uppercase flex items-center gap-2">
                    <FileText size={18} weight="duotone" /> เหตุผลที่กู้ยืม / หมายเหตุ
                  </div>
                  <div className="text-slate-300 font-bold whitespace-pre-wrap leading-relaxed text-lg">
                    {contract.reason || contract.conditions}
                  </div>
                </div>
              )}

              {/* Signature Section */}
              {contract.status === 'pending_signature' && (
                <div className="bg-slate-900/80 border border-amber-500/30 p-8 md:p-12 rounded-[32px] flex flex-col items-center text-center shadow-[inset_0_0_40px_rgba(245,158,11,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                  
                  <div className="flex items-center gap-4 text-amber-500 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <PenNib size={32} weight="duotone" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">กรุณาเซ็นชื่อเพื่อยอมรับเงื่อนไขสัญญา (สำหรับผู้กู้)</h3>
                  <p className="text-slate-400 text-sm font-bold mb-10 tracking-wide">
                    หากกดยืนยันการเซ็น ถือว่าท่านยอมรับเงื่อนไขในสัญญาฉบับนี้ทุกประการ
                  </p>
                  
                  {/* Canvas Box */}
                  <div className="w-full max-w-[600px] bg-slate-50 rounded-2xl mb-10 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)] border-4 border-slate-800/50">
                    {!hasSignature && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xl font-black tracking-widest pointer-events-none">
                        พื้นที่เซ็นชื่อ...
                      </div>
                    )}
                    <canvas 
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="w-full h-[200px] cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-[600px]">
                    <button 
                      onClick={clearSignature}
                      className="bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white font-black px-6 py-5 rounded-2xl transition-all flex items-center justify-center gap-2 w-full sm:w-1/3 border border-slate-700/80 shadow-inner"
                    >
                      ล้างลายเซ็น
                    </button>
                    <button 
                      onClick={handleSignContract}
                      disabled={signing}
                      className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:opacity-50 text-white font-black px-6 py-5 rounded-2xl transition-all flex items-center justify-center gap-3 w-full sm:w-2/3 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-lg"
                    >
                      {signing ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>ยืนยันการเซ็นรับทราบ <CheckCircle size={24} weight="bold" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* If Not Pending Signature */}
              {contract.status === 'pending_council_signature' && (
                <div className="bg-slate-900/80 border border-purple-500/30 p-10 rounded-[32px] flex flex-col items-center text-center shadow-[inset_0_0_40px_rgba(168,85,247,0.05)]">
                  <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20 shadow-inner">
                    <CheckCircle size={40} weight="duotone" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">คุณลงนามในสัญญาเรียบร้อยแล้ว</h3>
                  <p className="text-slate-400 font-bold">ขณะนี้กำลังรอตัวแทนสภาลงนามอนุมัติเพื่อเริ่มสัญญากู้ยืม</p>
                </div>
              )}
              
              {contract.status !== 'pending_signature' && contract.status !== 'pending_council_signature' && (
                <div className="bg-slate-900/80 border border-emerald-500/30 p-10 rounded-[32px] flex flex-col items-center text-center shadow-[inset_0_0_40px_rgba(16,185,129,0.05)]">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 shadow-inner">
                    <CheckCircle size={40} weight="duotone" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">สัญญานี้มีผลสมบูรณ์แล้ว</h3>
                  <p className="text-slate-400 font-bold">สัญญากู้ยืมนี้ได้รับการอนุมัติและลงนามครบถ้วนแล้ว</p>
                </div>
              )}

              <div className="flex justify-center mt-12">
                <button 
                  onClick={() => {
                    setContract(null);
                    setSearchQuery('');
                  }}
                  className="text-slate-500 hover:text-amber-500 font-bold transition-colors text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-amber-500 pb-1 flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> ค้นหาสัญญาอื่น
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
