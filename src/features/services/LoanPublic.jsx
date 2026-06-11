import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, FileText, CheckCircle, WarningCircle, PenNib, Eraser } from '@phosphor-icons/react';
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
      
      // In a real app, you might save the canvas data URL to storage
      // const signatureDataUrl = canvasRef.current.toDataURL();
      
      await updateDoc(contractRef, {
        status: 'active',
        signedAt: serverTimestamp()
      });
      
      setContract({ ...contract, status: 'active', signedAt: new Date() });
      showAlert('success', 'เซ็นรับทราบสัญญากู้ยืมสำเร็จ');
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกลายเซ็น');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] -mt-6 -mx-6 bg-[#f4f4f5] p-6 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Search Bar matching screenshot */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 mb-6 mt-8">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="pl-4 pr-3 text-slate-400">
              <MagnifyingGlass size={22} weight="bold" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="CNCL-10328" 
              className="flex-1 bg-transparent border-none outline-none text-slate-800 px-2 py-3 text-[17px] font-bold placeholder:text-slate-400 w-full"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#d4af37] hover:bg-[#c5a028] disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-xl transition-colors text-[15px] shadow-sm flex items-center justify-center gap-2 min-w-[120px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'ค้นหา'
              )}
            </button>
          </form>
        </div>

        {error && (
          <p className="text-red-500 text-center mb-6 font-bold flex items-center justify-center gap-2">
            <WarningCircle size={20} weight="bold" /> {error}
          </p>
        )}

        {/* Contract Card matching screenshot */}
        {contract && (
          <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header - Dark slate */}
            <div className="bg-[#111827] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  เลขที่สัญญา: <span className="text-[#d4af37]">{contract.contractId}</span>
                </h2>
                <div className="text-slate-400 font-medium text-sm mt-1.5 flex items-center gap-2">
                  สถานะ: 
                  <span className="text-slate-300">
                    {contract.status === 'pending_signature' && 'รอผู้กู้เซ็นรับทราบ'}
                    {contract.status === 'active' && 'กำลังผ่อนชำระ'}
                    {contract.status === 'completed' && 'ชำระครบแล้ว'}
                    {contract.status === 'defaulted' && 'ผิดนัดชำระ'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-[#d4af37] hover:bg-[#c5a028] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
                  <FileText size={18} weight="fill" />
                  ดูตัวสัญญา
                </button>
                <div className="text-blue-400 opacity-80">
                  <PenNib size={28} weight="duotone" />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                {/* Col 1 */}
                <div className="space-y-8">
                  <div>
                    <div className="text-[13px] font-black text-slate-400 mb-1.5">ชื่อผู้กู้ยืม</div>
                    <div className="text-[19px] font-black text-slate-800">{contract.borrowerName}</div>
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-slate-400 mb-1.5">ยอดเงินกู้รวม (รวมดอกเบี้ย)</div>
                    <div className="text-[26px] font-black text-slate-800 tracking-tight">{(contract.totalAmount || contract.principalAmount || 0).toLocaleString()} <span className="text-xl">บาท</span></div>
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-slate-400 mb-1.5">วิธีการชำระ</div>
                    <div className="text-[17px] font-black text-slate-800">
                      รายวัน วันละ {contract.installmentAmount ? contract.installmentAmount.toLocaleString() : 'ไม่ระบุ'} บาท
                    </div>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-8">
                  <div>
                    <div className="text-[13px] font-black text-slate-400 mb-1.5">เหตุผลที่กู้ยืม</div>
                    <div className="text-[19px] font-black text-slate-800">{contract.reason || contract.conditions || 'ไม่ระบุ'}</div>
                  </div>
                  
                  <div className="border-2 border-slate-100 rounded-2xl p-6">
                    <div className="text-[13px] font-black text-slate-400 mb-2">ยอดที่ต้องชำระทั้งสิ้น</div>
                    <div className="text-4xl font-black text-slate-800 tracking-tight">{(contract.totalAmount || contract.principalAmount || 0).toLocaleString()} <span className="text-2xl">บาท</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Area (If Pending) */}
            {contract.status === 'pending_signature' && (
              <div className="bg-[#f8fafc] border-t border-slate-200 p-8 flex flex-col items-center text-center">
                <div className="flex items-center gap-3 text-[#1e40af] mb-2">
                  <PenNib size={24} weight="fill" />
                  <h3 className="text-[19px] font-black">กรุณาเซ็นชื่อเพื่อยอมรับเงื่อนไขสัญญา (สำหรับผู้กู้)</h3>
                </div>
                <p className="text-[#3b82f6] text-sm font-medium mb-8">
                  หากกดยืนยันการเซ็น ถือว่าท่านยอมรับเงื่อนไขในสัญญาฉบับนี้ทุกประการ
                </p>
                
                {/* Canvas Box */}
                <div className="w-full max-w-[600px] bg-white border-2 border-dashed border-slate-300 rounded-2xl mb-8 relative overflow-hidden">
                  {!hasSignature && (
                    <div className="absolute top-4 left-4 text-slate-400 text-[15px] font-medium pointer-events-none">
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
                    className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-700 font-black px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-1/3"
                  >
                    ล้างลายเซ็น
                  </button>
                  <button 
                    onClick={handleSignContract}
                    disabled={signing}
                    className="bg-[#d4af37] hover:bg-[#c5a028] disabled:opacity-50 text-white font-black px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-2/3 shadow-sm"
                  >
                    {signing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'ยืนยันการเซ็นรับทราบ'
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* If Not Pending Signature */}
            {contract.status !== 'pending_signature' && (
              <div className="bg-[#f8fafc] border-t border-slate-200 p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                  <CheckCircle size={32} weight="fill" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">สัญญานี้ได้รับการลงนามแล้ว</h3>
                <p className="text-slate-500 font-medium">คุณสามารถดูตัวสัญญาเพื่อตรวจสอบรายละเอียดเพิ่มเติมได้</p>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
