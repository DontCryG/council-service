import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, DownloadSimple, CircleNotch } from '@phosphor-icons/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';
import { toPng } from 'html-to-image';

export default function CouncilReceiptView() {
  const navigate = useNavigate();
  const { txId } = useParams();
  const location = useLocation();
  const { showAlert } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState(location.state?.tx || null);
  const [contract, setContract] = useState(location.state?.contract || null);
  const receiptRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!tx) {
          const txRef = doc(db, 'transactions', txId);
          const txSnap = await getDoc(txRef);
          if (!txSnap.exists()) {
            showAlert('error', 'ไม่พบข้อมูลใบเสร็จ');
            navigate('/council_loan');
            return;
          }
          setTx({ id: txSnap.id, ...txSnap.data() });
          
          if (!contract) {
            const contractRef = doc(db, 'loan_contracts', txSnap.data().contractId);
            const contractSnap = await getDoc(contractRef);
            if (contractSnap.exists()) {
              setContract({ id: contractSnap.id, ...contractSnap.data() });
            }
          }
        }
      } catch (error) {
        console.error(error);
        showAlert('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [txId, tx, contract, navigate, showAlert]);

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { 
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `receipt_${txId.substring(0, 6).toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
      showAlert('success', 'ดาวน์โหลดใบเสร็จสำเร็จ');
    } catch (err) {
      console.error(err);
      showAlert('error', 'ไม่สามารถบันทึกรูปภาพได้');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch size={48} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (!tx || !contract) return null;

  const dateStr = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
  const timeStr = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleTimeString('th-TH') : '-';
  const receiptId = `RC-${tx.id.substring(0, 6).toUpperCase()}`;

  const balanceAfter = tx.balanceAfter !== undefined ? tx.balanceAfter : contract.remainingAmount;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(`/council_loan/view/${contract.id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>กลับไปก่อนหน้า</span>
        </button>
        <button 
          onClick={handleDownloadImage}
          className="bg-[#1e2330] hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/50"
        >
          <DownloadSimple size={20} weight="bold" />
          บันทึกเป็นรูปภาพ
        </button>
      </div>

      <div className="shadow-2xl mx-auto w-fit">
        <div 
          ref={receiptRef}
          className="bg-white text-[#1a202c] p-12 sm:p-16 relative overflow-hidden"
          style={{ minHeight: '800px', width: '700px' }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-800 mb-2">ใบเสร็จรับเงิน</h1>
            <p className="text-slate-500 font-medium">สภา WIP TOWN</p>
          </div>

          <div className="border-b-2 border-slate-800 mb-8"></div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-4 mb-8">
            <div className="text-[15px]">
              <span className="font-bold text-slate-800">เลขที่ใบเสร็จ:</span> <span className="text-slate-600">{receiptId}</span>
            </div>
            <div className="text-[15px] text-right">
              <span className="font-bold text-slate-800">วันที่ชำระ:</span> <span className="text-slate-600">{dateStr}</span>
            </div>
            <div className="text-[15px]">
              <span className="font-bold text-slate-800">อ้างอิงเลขที่สัญญา:</span> <span className="text-slate-600">{contract.contractId}</span>
            </div>
            <div className="text-[15px] text-right">
              <span className="font-bold text-slate-800">เวลา:</span> <span className="text-slate-600">{timeStr}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="border border-slate-200 rounded-2xl p-8 mb-16 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-medium text-[15px]">ได้รับเงินจาก:</span>
              <span className="font-bold text-slate-800 text-[15px]">{contract.borrowerName || '[CC] COUNCIL'}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-medium text-[15px]">ชำระค่างวด/คืนเงินกู้:</span>
              <span className="font-bold text-slate-800 text-[15px]">ชำระหนี้ตามสัญญา</span>
            </div>
            
            <div className="border-b border-slate-200 mb-6"></div>

            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-slate-800 text-lg">จำนวนเงินที่ชำระ:</span>
              <span className="font-black text-emerald-600 text-xl">{tx.amount?.toLocaleString()} บาท</span>
            </div>
            
            <div className="border-b border-slate-200 mb-6"></div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-[15px]">ยอดหนี้คงเหลือหลังชำระ:</span>
              <span className="font-bold text-red-500 text-[15px]">{balanceAfter?.toLocaleString()} บาท</span>
            </div>
          </div>

          {/* Signature Area */}
          <div className="mt-24 text-center">
            <div className="flex justify-end pr-12">
              <div className="w-64 text-center">
                <div className="flex items-end gap-2 mb-4 justify-center">
                  <span className="font-bold text-slate-800">ลงชื่อ</span>
                  <div className="border-b-2 border-dotted border-slate-400 w-48"></div>
                </div>
                <p className="font-bold text-slate-800 mb-1">( เจ้าหน้าที่ตัวแทนสภา )</p>
                <p className="text-slate-500 text-sm">ผู้รับเงิน</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
