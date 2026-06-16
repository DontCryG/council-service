import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, DownloadSimple, CircleNotch, ShieldStar, SealCheck, Barcode, Receipt } from '@phosphor-icons/react';
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
        backgroundColor: '#0b0f19'
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

  const getTxDate = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
    return null;
  };

  const txDate = getTxDate(tx.createdAt);
  const dateStr = txDate ? txDate.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
  const timeStr = txDate ? txDate.toLocaleTimeString('th-TH') : '-';
  const receiptId = `RC-${tx.id.substring(0, 6).toUpperCase()}`;

  const balanceAfter = tx.balanceAfter !== undefined ? tx.balanceAfter : contract.remainingAmount;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(`/council_loan/view/${contract.id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">ย้อนกลับ</span>
        </button>
        <button 
          onClick={handleDownloadImage}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <DownloadSimple size={20} weight="bold" />
          บันทึกรูปภาพใบเสร็จ
        </button>
      </div>

      {/* Main Receipt Container */}
      <div className="mx-auto w-fit relative group">
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

        <div 
          ref={receiptRef}
          className="bg-slate-950 ring-1 ring-white/10 rounded-2xl text-slate-200 relative overflow-hidden flex flex-col justify-between"
          style={{ minHeight: '850px', width: '650px' }}
        >
          {/* Top Decorative Bar */}
          <div className="h-3 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <ShieldStar size={400} weight="fill" />
          </div>

          <div className="p-12 sm:p-14 relative z-10 flex-grow">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-inner">
                  <Receipt size={32} className="text-emerald-400" weight="duotone" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">ใบเสร็จรับเงิน</h1>
                  <p className="text-emerald-400 font-bold tracking-widest text-sm mt-1 uppercase">OFFICIAL RECEIPT</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-black text-slate-300">สภา WIP TOWN</h2>
                <p className="text-slate-500 font-mono text-sm mt-1">COUNCIL SERVICE</p>
              </div>
            </div>

            {/* PAID Stamp Badge */}
            <div className="absolute top-10 right-10 rotate-12 opacity-80 pointer-events-none">
              <div className="border-4 border-emerald-500 text-emerald-500 rounded-xl px-6 py-2 flex items-center gap-3 bg-slate-950/50 backdrop-blur-sm">
                <SealCheck size={32} weight="fill" />
                <span className="font-black text-2xl tracking-widest">ชำระแล้ว</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-6 mb-10 p-6 bg-slate-800/20 rounded-2xl border border-slate-700/30">
              <div>
                <p className="text-slate-500 text-[13px] mb-1 font-medium uppercase tracking-wider">No. / เลขที่ใบเสร็จ</p>
                <p className="font-mono text-lg font-bold text-white">{receiptId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[13px] mb-1 font-medium uppercase tracking-wider">Date / วันที่ชำระ</p>
                <p className="font-mono text-lg font-bold text-white">{dateStr} <span className="text-slate-400 text-sm ml-1">{timeStr}</span></p>
              </div>
              <div>
                <p className="text-slate-500 text-[13px] mb-1 font-medium uppercase tracking-wider">Ref / อ้างอิงสัญญา</p>
                <p className="font-mono text-lg font-bold text-white">{contract.contractId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[13px] mb-1 font-medium uppercase tracking-wider">Received From / ได้รับเงินจาก</p>
                <p className="text-lg font-bold text-white">{contract.borrowerName || '[CC] COUNCIL'}</p>
              </div>
            </div>

            {/* Payment Details Table */}
            <div className="mb-10">
              <div className="flex justify-between items-end border-b-2 border-slate-700/50 pb-4 mb-6">
                <h3 className="font-bold text-slate-300 text-lg">รายการชำระเงิน <span className="text-slate-500 font-normal text-sm ml-2">Description</span></h3>
                <h3 className="font-bold text-slate-300 text-lg">จำนวนเงิน <span className="text-slate-500 font-normal text-sm ml-2">Amount</span></h3>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-white text-lg">ชำระหนี้ตามสัญญา (คืนเงินกู้)</span>
                </div>
                <span className="font-mono text-xl font-bold text-white">{tx.amount?.toLocaleString()}.-</span>
              </div>
            </div>

            {/* Total Box */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900/40 border border-emerald-900/30 rounded-2xl p-8 mb-12 flex justify-between items-center shadow-inner relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500"></div>
              <div>
                <p className="text-emerald-500/80 font-bold mb-1 uppercase tracking-wider text-sm">Total Paid / ยอดรวมที่ชำระ</p>
                <p className="text-slate-400 text-sm">ชำระเงินเสร็จสมบูรณ์</p>
              </div>
              <div className="text-right flex items-baseline gap-2">
                <span className="font-mono text-4xl font-black text-emerald-400">{tx.amount?.toLocaleString()}</span>
                <span className="text-emerald-500 font-bold text-xl">THB</span>
              </div>
            </div>

            {/* Remaining Balance & Signatures */}
            <div className="flex justify-between items-end">
              <div className="bg-rose-950/20 border border-rose-900/30 px-5 py-3 rounded-xl">
                <p className="text-rose-400/80 text-xs font-bold uppercase tracking-wider mb-1">Remaining Balance / ยอดหนี้คงเหลือ</p>
                <p className="font-mono text-lg font-bold text-rose-400">{balanceAfter?.toLocaleString()} THB</p>
              </div>

              <div className="text-center w-64 pt-4">
                <div className="border-b-2 border-dashed border-slate-600 mb-3 w-48 mx-auto"></div>
                <p className="font-bold text-white text-lg">( เจ้าหน้าที่ตัวแทนสภา )</p>
                <p className="text-slate-500 text-sm mt-1">ผู้รับเงิน / Authorized Signature</p>
              </div>
            </div>
            
          </div>

          {/* Footer Barcode Section */}
          <div className="bg-slate-900 border-t border-slate-800 p-6 flex flex-col items-center justify-center relative z-10">
            <Barcode size={48} weight="light" className="text-slate-600 mb-2" />
            <p className="font-mono text-[10px] text-slate-600 tracking-[0.2em]">{tx.id.toUpperCase()}</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
