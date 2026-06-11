import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  DownloadSimple, 
  PenNib,
  CircleNotch
} from '@phosphor-icons/react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';
import html2canvas from 'html2canvas';

export default function CouncilLoanView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showAlert } = useAppStore();
  
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const documentRef = useRef(null);

  // Signature Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const docRef = doc(db, 'loan_contracts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContract({ id: docSnap.id, ...docSnap.data() });
        } else {
          showAlert('error', 'ไม่พบข้อมูลสัญญา');
          navigate('/council_loan');
        }
      } catch (err) {
        console.error(err);
        showAlert('error', 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchContract();
  }, [id, navigate, showAlert]);

  const handleDownloadImage = async () => {
    if (!documentRef.current) return;
    try {
      const canvas = await html2canvas(documentRef.current, { scale: 2 });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `contract_${contract?.contractId || 'document'}.png`;
      link.click();
      showAlert('success', 'ดาวน์โหลดรูปภาพสำเร็จ');
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ');
    }
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

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleCouncilSign = async () => {
    if (!hasSignature) {
      showAlert('error', 'กรุณาเซ็นชื่อก่อนกดยืนยัน');
      return;
    }
    setSigning(true);
    try {
      const signatureDataUrl = canvasRef.current.toDataURL();
      await updateDoc(doc(db, 'loan_contracts', contract.id), {
        status: 'active',
        councilSignedAt: serverTimestamp(),
        councilSignature: signatureDataUrl
      });
      setContract(prev => ({ 
        ...prev, 
        status: 'active', 
        councilSignature: signatureDataUrl 
      }));
      showAlert('success', 'ลงนามอนุมัติสัญญาสำเร็จ');
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการอนุมัติสัญญา');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CircleNotch size={32} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (!contract) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = dateStr?.toDate ? dateStr.toDate() : new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatMoney = (val) => (val || 0).toLocaleString();

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 px-4 sm:px-0">
        <button 
          onClick={() => navigate('/council_loan')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={20} />
          <span className="font-bold">กลับไปแดชบอร์ด</span>
        </button>
        <button 
          onClick={handleDownloadImage}
          className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg border border-slate-700 w-full sm:w-auto"
        >
          <DownloadSimple size={20} weight="bold" />
          บันทึกเป็นรูปภาพ
        </button>
      </div>

      {/* Contract Document */}
      <div className="overflow-x-auto pb-8">
        <div 
          ref={documentRef}
          className="bg-white text-slate-900 p-10 sm:p-16 rounded-sm shadow-2xl mx-auto font-sans leading-relaxed relative"
          style={{ minHeight: '1056px', width: '816px' }}
        >
          <h1 className="text-3xl font-black text-center mb-12">สัญญากู้ยืมเงิน</h1>
          
          <div className="flex justify-between items-start mb-10 text-sm font-medium">
            <div>เลขที่สัญญา: {contract.contractId}</div>
            <div className="text-right leading-relaxed">
              <div>ทำที่: ที่ทำการสภา WIP TOWN</div>
              <div>วันที่: {formatDate(contract.createdAt)}</div>
            </div>
          </div>

          <p className="mb-8 indent-12 text-[15px] leading-loose">
            สัญญานี้ทำขึ้นระหว่าง <strong>{contract.borrowerName}</strong> โดยต่อไปนี้เรียกว่า "ผู้กู้" และหน่วยงานสภา WIP TOWN โดยต่อไปนี้เรียกว่า "ผู้ให้กู้" ทั้งสองฝ่ายตกลงทำสัญญากันดังมีข้อความต่อไปนี้
          </p>

          <div className="space-y-8 text-[15px]">
            <div>
              <h3 className="font-bold mb-3 text-base">ข้อ 1. จำนวนเงินกู้และการรับเงิน</h3>
              <p className="indent-12 leading-loose">ผู้กู้ได้ตกลงกู้ยืมเงินและผู้ให้กู้ได้ตกลงให้กู้ยืมเงินเป็นจำนวนเงินทั้งสิ้น <strong>{formatMoney(contract.principalAmount)}</strong> บาท</p>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-base">ข้อ 2. อัตราดอกเบี้ย</h3>
              <div className="ml-12 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-slate-900 flex items-center justify-center text-sm font-bold bg-slate-100 shrink-0">
                    {contract.interestRate > 0 ? '✓' : ''}
                  </div>
                  <span>ร้อยละ <strong>{contract.interestRate || '..........'}</strong> จำนวน <strong>{formatMoney(contract.interestAmount) || '..........'}</strong> บาท</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-slate-900 flex items-center justify-center text-sm font-bold bg-slate-100 shrink-0">
                    {!contract.interestRate || contract.interestRate === 0 ? '✓' : ''}
                  </div>
                  <span>จำนวนเงิน <strong>..........</strong> บาท</span>
                </div>
                <p className="mt-4 font-bold">รวมเป็นเงินต้นและดอกเบี้ย {formatMoney(contract.totalAmount)} บาท</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-base">ข้อ 3. กำหนดการชำระเงินคืน</h3>
              <p className="indent-12 mb-4 leading-loose">ผู้กู้ตกลงจะชำระเงินต้นพร้อมดอกเบี้ยคืนให้แก่ผู้ให้กู้ ภายในวันที่ <strong>{formatDate(contract.dueDate)}</strong></p>
              <div className="ml-12 flex items-center gap-12">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-slate-900 flex items-center justify-center text-sm font-bold bg-slate-100 shrink-0">
                    {contract.paymentMethod === 'installments' ? '✓' : ''}
                  </div>
                  <span>รายวัน (วันละ {formatMoney(contract.installmentAmount)} บาท)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-slate-900 flex items-center justify-center text-sm font-bold bg-slate-100 shrink-0">
                    {contract.paymentMethod === 'full' ? '✓' : ''}
                  </div>
                  <span>ชำระเต็มจำนวน</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-base">ข้อ 4. การผิดนัดชำระหนี้</h3>
              <p className="indent-12 text-justify leading-loose">
                หากผู้กู้ผิดนัดชำระหนี้ตามที่ระบุไว้ในข้อ 3. ผู้กู้ยินยอมให้ผู้ให้กู้เรียกร้องให้ชำระหนี้ทั้งหมดได้ทันที พร้อมทั้งยินยอมชดใช้ค่าเสียหายและค่าใช้จ่ายต่างๆ ที่เกิดขึ้นจากการติดตามทวงถาม หากไม่ติดต่อชำระภายในเวลาที่กำหนดสภาจะทำการปรับโทษ BLACKLIST ครั้งที่ 1 ทันที
              </p>
            </div>
          </div>

          <div className="mt-32 flex justify-between items-end px-4">
            <div className="text-center w-64">
              <div className="h-20 flex items-end justify-center mb-3">
                {contract.borrowerSignature ? (
                  <img src={contract.borrowerSignature} alt="Borrower Signature" className="max-h-20 max-w-full" style={{ mixBlendMode: 'multiply' }} />
                ) : contract.borrowerSignedAt ? (
                  <span className="italic text-slate-500 font-serif">Signed electronically</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 w-full mb-3">
                <span className="text-sm">ลงชื่อ</span>
                <div className="border-b border-dotted border-slate-900 flex-1"></div>
              </div>
              <p className="mb-1">( {contract.borrowerName} )</p>
              <p className="text-sm text-slate-500">ผู้กู้ยืม</p>
            </div>

            <div className="text-center w-64">
              <div className="h-20 flex items-end justify-center mb-3">
                {contract.councilSignature ? (
                  <img src={contract.councilSignature} alt="Council Signature" className="max-h-20 max-w-full" style={{ mixBlendMode: 'multiply' }} />
                ) : null}
              </div>
              <div className="flex items-center gap-2 w-full mb-3">
                <span className="text-sm">ลงชื่อ</span>
                <div className="border-b border-dotted border-slate-900 flex-1"></div>
              </div>
              <p className="mb-1">( เจ้าหน้าที่ตัวแทนสภา )</p>
              <p className="text-sm text-slate-500">ผู้ให้กู้</p>
            </div>
          </div>
        </div>
      </div>

      {/* Council Signing Area */}
      {contract.status === 'pending_council_signature' && (
        <div className="bg-[#151923] border border-blue-500/20 p-8 rounded-3xl flex flex-col items-center text-center shadow-inner mt-8 mx-auto max-w-[816px]">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <PenNib size={28} weight="fill" />
            <h3 className="text-xl font-black text-white">กรุณาเซ็นชื่ออนุมัติสัญญา (สำหรับเจ้าหน้าที่สภา)</h3>
          </div>
          <p className="text-slate-400 text-sm mb-8">ประทับลายเซ็นเพื่อเป็นหลักฐานการอนุมัติเงินกู้</p>

          <div className="w-full bg-white rounded-2xl mb-8 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-slate-200">
            {!hasSignature && (
              <div className="absolute inset-0 flex items-start justify-start p-6 text-slate-300 text-sm font-medium pointer-events-none">
                พื้นที่เซ็นชื่อ...
              </div>
            )}
            <canvas 
              ref={canvasRef}
              width={750}
              height={220}
              className="w-full h-[220px] cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-12">
            <button 
              onClick={clearSignature}
              className="bg-[#1e2330] hover:bg-slate-700 text-white font-bold px-6 py-4 rounded-xl transition-all w-full sm:w-1/3 border border-slate-700/50"
            >
              ล้างลายเซ็น
            </button>
            <button 
              onClick={handleCouncilSign}
              disabled={signing}
              className="bg-[#d4af37] hover:bg-[#c5a028] disabled:opacity-50 text-slate-900 font-black px-6 py-4 rounded-xl transition-all w-full sm:w-2/3 shadow-[0_0_20px_rgba(212,175,55,0.3)] flex justify-center items-center gap-2"
            >
              {signing ? (
                <CircleNotch size={24} className="animate-spin" />
              ) : (
                'ยืนยันการเซ็นอนุมัติ'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment History Section */}
      <div className="mt-8 bg-slate-900/80 border border-slate-700/50 rounded-[32px] shadow-inner max-w-[816px] mx-auto overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Receipt size={20} weight="bold" />
          </div>
          <h3 className="text-xl font-bold text-white">ประวัติการชำระเงิน</h3>
        </div>
        <div className="p-12 text-center text-slate-500 text-sm font-medium">
          ยังไม่มีประวัติการชำระเงิน
        </div>
      </div>
    </div>
  );
}
