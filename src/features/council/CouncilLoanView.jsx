import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  DownloadSimple, 
  PenNib,
  CircleNotch,
  Receipt,
  SealCheck
} from '@phosphor-icons/react';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';
import { toPng } from 'html-to-image';

export default function CouncilLoanView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showAlert } = useAppStore();
  
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
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
          const contractData = { id: docSnap.id, ...docSnap.data() };
          setContract(contractData);

          // Fetch Payment History
          const q = query(
            collection(db, 'transactions'),
            where('contractId', '==', docSnap.id)
          );
          const querySnapshot = await getDocs(q);
          
          // Filter and sort in memory to avoid requiring a composite index
          const historyDocs = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.type === 'payment') {
              historyDocs.push({ id: doc.id, ...data });
            }
          });
          
          historyDocs.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeA - timeB; // ascending
          });

          const history = [];
          let currentBalance = contractData.totalAmount || 0;
          
          for (const tx of historyDocs) {
            currentBalance -= tx.amount;
            history.push({
              ...tx,
              balanceAfter: currentBalance
            });
          }
          
          // Reverse to show newest first
          setPaymentHistory(history.reverse());

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
      const dataUrl = await toPng(documentRef.current, { 
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `สัญญา_${contract?.contractId || 'document'}.png`;
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
        <div className="shadow-2xl mx-auto w-fit">
          <div 
            ref={documentRef}
            className="bg-[#fdfbf7] text-[#1a202c] p-12 sm:p-20 font-sans leading-relaxed relative overflow-hidden"
            style={{ minHeight: '1056px', width: '816px' }}
          >
            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <SealCheck size={600} weight="fill" />
            </div>

            {/* Inner Border Frame */}
            <div className="absolute inset-6 border-double border-[6px] border-[#c9b794]/40 pointer-events-none rounded-lg"></div>

            <div className="relative z-10">
              <h1 className="text-4xl font-black text-center mb-16 tracking-wide text-[#2d3748]">สัญญากู้ยืมเงิน</h1>
            
              <div className="flex justify-between items-end mb-12 text-[15px] font-semibold border-b-2 border-[#c9b794]/20 pb-6">
                <div><span className="text-slate-500 mr-2">เลขที่สัญญา:</span> {contract.contractId}</div>
                <div className="text-right leading-relaxed">
                  <div><span className="text-slate-500 mr-2">ทำที่:</span> ที่ทำการสภา WIP TOWN</div>
                  <div><span className="text-slate-500 mr-2">วันที่:</span> {formatDate(contract.createdAt)}</div>
                </div>
              </div>

              <p className="mb-10 indent-16 text-[16px] leading-loose text-justify">
                สัญญานี้ทำขึ้นระหว่าง <strong className="text-lg mx-1">{contract.borrowerName}</strong> ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"ผู้กู้"</strong> ฝ่ายหนึ่ง และ <strong>หน่วยงานสภา WIP TOWN</strong> ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"ผู้ให้กู้"</strong> อีกฝ่ายหนึ่ง ทั้งสองฝ่ายตกลงทำสัญญากันโดยมีข้อความดังต่อไปนี้
              </p>

              <div className="space-y-8 text-[16px]">
                {/* Clause 1 */}
                <div className="bg-white/60 p-6 rounded-xl border border-[#c9b794]/20 shadow-sm">
                  <h3 className="font-bold mb-3 text-[17px] text-[#2d3748] flex items-center gap-3">
                    <span className="bg-[#c9b794] text-white w-7 h-7 flex items-center justify-center rounded-full text-sm shadow-sm">1</span> 
                    จำนวนเงินกู้และการรับเงิน
                  </h3>
                  <p className="indent-12 leading-loose">ผู้กู้ตกลงกู้ยืมเงินและผู้ให้กู้ตกลงให้กู้ยืมเงินเป็นจำนวนเงินทั้งสิ้น <strong className="text-lg text-amber-700">{formatMoney(contract.principalAmount)}</strong> บาท</p>
                </div>

                {/* Clause 2 */}
                <div className="bg-white/60 p-6 rounded-xl border border-[#c9b794]/20 shadow-sm">
                  <h3 className="font-bold mb-5 text-[17px] text-[#2d3748] flex items-center gap-3">
                    <span className="bg-[#c9b794] text-white w-7 h-7 flex items-center justify-center rounded-full text-sm shadow-sm">2</span> 
                    อัตราดอกเบี้ย
                  </h3>
                  <div className="ml-10 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 border-2 border-slate-400 bg-white shrink-0 text-center rounded shadow-sm" style={{ lineHeight: '16px' }}>
                        <span className="text-[13px] font-black block text-slate-800">{contract.interestRate > 0 ? '✓' : ''}</span>
                      </div>
                      <span>คิดอัตราดอกเบี้ยร้อยละ <strong className="text-amber-700 mx-1">{contract.interestRate || '..........'}</strong> จำนวน <strong className="text-amber-700 mx-1">{formatMoney(contract.interestAmount) || '..........'}</strong> บาท</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 border-2 border-slate-400 bg-white shrink-0 text-center rounded shadow-sm" style={{ lineHeight: '16px' }}>
                        <span className="text-[13px] font-black block text-slate-800">{!contract.interestRate || contract.interestRate === 0 ? '✓' : ''}</span>
                      </div>
                      <span>ไม่คิดดอกเบี้ย (จำนวนเงิน <strong>..........</strong> บาท)</span>
                    </div>
                    <div className="mt-6 p-4 bg-[#c9b794]/10 rounded-lg border border-[#c9b794]/30 font-bold text-center">
                      รวมเป็นเงินต้นและดอกเบี้ยทั้งสิ้น <span className="text-xl text-amber-700 mx-2">{formatMoney(contract.totalAmount)}</span> บาท
                    </div>
                  </div>
                </div>

                {/* Clause 3 */}
                <div className="bg-white/60 p-6 rounded-xl border border-[#c9b794]/20 shadow-sm">
                  <h3 className="font-bold mb-4 text-[17px] text-[#2d3748] flex items-center gap-3">
                    <span className="bg-[#c9b794] text-white w-7 h-7 flex items-center justify-center rounded-full text-sm shadow-sm">3</span> 
                    กำหนดการชำระเงินคืน
                  </h3>
                  <p className="indent-12 mb-5 leading-loose">ผู้กู้ตกลงจะชำระเงินต้นพร้อมดอกเบี้ยคืนให้แก่ผู้ให้กู้ให้เสร็จสิ้น ภายในวันที่ <strong className="text-amber-700">{formatDate(contract.dueDate)}</strong></p>
                  <div className="ml-10 flex flex-col sm:flex-row gap-6 sm:gap-12">
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 border-2 border-slate-400 bg-white shrink-0 text-center rounded shadow-sm" style={{ lineHeight: '16px' }}>
                        <span className="text-[13px] font-black block text-slate-800">{contract.paymentMethod === 'installments' ? '✓' : ''}</span>
                      </div>
                      <span>ผ่อนชำระรายวัน (วันละ <strong className="text-amber-700 mx-1">{formatMoney(contract.installmentAmount)}</strong> บาท)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 border-2 border-slate-400 bg-white shrink-0 text-center rounded shadow-sm" style={{ lineHeight: '16px' }}>
                        <span className="text-[13px] font-black block text-slate-800">{contract.paymentMethod === 'full' ? '✓' : ''}</span>
                      </div>
                      <span>ชำระเต็มจำนวน</span>
                    </div>
                  </div>
                </div>

                {/* Clause 4 */}
                <div className="bg-white/60 p-6 rounded-xl border border-[#c9b794]/20 shadow-sm">
                  <h3 className="font-bold mb-3 text-[17px] text-[#2d3748] flex items-center gap-3">
                    <span className="bg-[#c9b794] text-white w-7 h-7 flex items-center justify-center rounded-full text-sm shadow-sm">4</span> 
                    การผิดนัดชำระหนี้
                  </h3>
                  <p className="indent-12 text-justify leading-loose text-slate-700">
                    หากผู้กู้ผิดนัดชำระหนี้ตามที่ระบุไว้ในข้อ 3. ผู้กู้ยินยอมให้ผู้ให้กู้เรียกร้องให้ชำระหนี้ทั้งหมดได้ทันที พร้อมทั้งยินยอมชดใช้ค่าเสียหายและค่าใช้จ่ายต่างๆ ที่เกิดขึ้นจากการติดตามทวงถาม หากไม่ติดต่อชำระภายในเวลาที่กำหนด สภาจะทำการปรับโทษ <strong className="text-red-600 bg-red-50 px-2 py-0.5 rounded">BLACKLIST ครั้งที่ 1</strong> ทันที
                  </p>
                </div>
              </div>

              <div className="mt-24 flex justify-between items-end px-8">
                <div className="text-center w-64">
                  <div className="h-20 flex items-end justify-center mb-4 relative">
                    {contract.borrowerSignature ? (
                      <img src={contract.borrowerSignature} alt="Borrower Signature" className="max-h-24 max-w-full absolute bottom-0 z-10" style={{ mixBlendMode: 'multiply' }} />
                    ) : contract.borrowerSignedAt ? (
                      <span className="italic text-slate-400 font-serif text-lg">Signed electronically</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 w-full mb-3">
                    <span className="text-[15px] font-bold text-slate-600">ลงชื่อ</span>
                    <div className="border-b-2 border-dotted border-slate-400 flex-1"></div>
                  </div>
                  <p className="mb-1 font-bold text-lg text-[#2d3748]">( {contract.borrowerName} )</p>
                  <p className="text-[15px] text-slate-500 font-medium">ผู้กู้ยืม</p>
                </div>

                <div className="text-center w-64">
                  <div className="h-20 flex items-end justify-center mb-4 relative">
                    {contract.councilSignature ? (
                      <>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                          <SealCheck size={90} weight="fill" className="text-red-600" />
                        </div>
                        <img src={contract.councilSignature} alt="Council Signature" className="max-h-24 max-w-full absolute bottom-0 z-10" style={{ mixBlendMode: 'multiply' }} />
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 w-full mb-3">
                    <span className="text-[15px] font-bold text-slate-600">ลงชื่อ</span>
                    <div className="border-b-2 border-dotted border-slate-400 flex-1"></div>
                  </div>
                  <p className="mb-1 font-bold text-lg text-[#2d3748]">( เจ้าหน้าที่ตัวแทนสภา )</p>
                  <p className="text-[15px] text-slate-500 font-medium">ผู้ให้กู้ / ผู้อนุมัติ</p>
                </div>
              </div>
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
      <div className="mt-8 bg-[#151923] border border-slate-800 rounded-2xl shadow-sm max-w-[816px] mx-auto overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 bg-amber-950 border border-amber-900">
            <Receipt size={18} weight="fill" />
          </div>
          <h3 className="text-[17px] font-bold text-white">ประวัติการชำระเงิน</h3>
        </div>
        
        {paymentHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-medium">
            ยังไม่มีประวัติการชำระเงิน
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="py-4 px-6 text-[13px] font-bold text-slate-500 whitespace-nowrap">วันที่ชำระ</th>
                  <th className="py-4 px-6 text-[13px] font-bold text-slate-500 whitespace-nowrap">เลขที่ใบเสร็จ</th>
                  <th className="py-4 px-6 text-[13px] font-bold text-slate-500 whitespace-nowrap text-center">ยอดชำระ (บาท)</th>
                  <th className="py-4 px-6 text-[13px] font-bold text-slate-500 whitespace-nowrap text-center">ยอดคงเหลือ (บาท)</th>
                  <th className="py-4 px-6 text-[13px] font-bold text-slate-500 whitespace-nowrap text-center">ใบเสร็จ</th>
                </tr>
              </thead>
              <tbody className="bg-[#151923]">
                {paymentHistory.map((tx, index) => {
                  const dateStr = tx.createdAt?.toDate ? 
                    tx.createdAt.toDate().toLocaleString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-';
                  
                  // Generate dummy receipt ID from transaction ID
                  const receiptId = `RC-${tx.id.substring(0, 6).toUpperCase()}`;

                  return (
                    <tr key={tx.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 text-[14px] text-slate-300 whitespace-nowrap">{dateStr}</td>
                      <td className="py-4 px-6 text-[14px] text-slate-400 whitespace-nowrap">{receiptId}</td>
                      <td className="py-4 px-6 text-[14px] font-bold text-emerald-400 text-center whitespace-nowrap">
                        +{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-[14px] font-bold text-white text-center whitespace-nowrap">
                        {tx.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => navigate(`/council_loan/receipt/${tx.id}`, { state: { tx, contract } })}
                          className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors mx-auto"
                        >
                          <Receipt size={16} /> ดูใบเสร็จ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
