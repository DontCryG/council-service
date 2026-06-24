import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, DownloadSimple, CircleNotch, SealCheck, Barcode, Receipt } from '@phosphor-icons/react';
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
        <CircleNotch size={48} className="animate-spin text-emerald-500" />
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
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <DownloadSimple size={20} weight="bold" />
          บันทึกรูปภาพใบเสร็จ
        </button>
      </div>

      {/* Main Receipt Container */}
      <div className="mx-auto w-fit relative group">
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <div 
          ref={receiptRef}
          className="bg-slate-900 rounded-[2rem] text-slate-200 relative overflow-hidden flex flex-col justify-between shadow-2xl ring-1 ring-white/10"
          style={{ minHeight: '850px', width: '650px' }}
        >
          {/* Top Decorative Neon Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>

          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
            <img src="/logo.png" alt="Council Logo Background" className="w-[500px] h-[500px] object-contain grayscale" />
          </div>

          <div className="p-10 sm:p-14 relative z-10 flex-grow flex flex-col">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-14">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-lg shadow-black/50 backdrop-blur-md">
                  <Receipt size={32} className="text-emerald-400" weight="duotone" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight text-shadow-glow whitespace-nowrap">ใบเสร็จรับเงิน</h1>
                  <p className="text-emerald-400 font-bold tracking-[0.2em] text-xs mt-2 uppercase text-shadow-glow whitespace-nowrap">OFFICIAL RECEIPT</p>
                </div>
              </div>
            </div>

            {/* PAID Stamp Badge - Animated */}
            <div className="absolute top-10 right-10 opacity-90 pointer-events-none z-20">
              <div className="animate-pop-in border-[3px] border-emerald-500 text-emerald-500 rounded-xl px-5 py-2 flex items-center gap-3 bg-slate-950/40 backdrop-blur-sm shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <SealCheck size={28} weight="fill" />
                <div className="flex flex-col">
                  <span className="font-black text-2xl tracking-widest leading-none">ชำระแล้ว</span>
                </div>
              </div>
              <div className="absolute top-14 right-1 text-right mt-1 rotate-12 opacity-0 animate-[popIn_0.6s_0.2s_forwards]">
                <p className="text-emerald-500/80 font-bold text-[10px] tracking-widest uppercase">สภา WIP TOWN</p>
                <p className="text-emerald-500/60 font-mono text-[8px] tracking-[0.3em] uppercase">COUNCIL SERVICE</p>
              </div>
            </div>

            {/* Info Grid - Glassmorphism */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-6 mb-12 p-8 bg-slate-800/30 backdrop-blur-md rounded-[1.5rem] border border-slate-700/50 shadow-inner">
              <div>
                <p className="text-slate-500 text-[11px] mb-1 font-bold uppercase tracking-[0.1em]">NO. / เลขที่ใบเสร็จ</p>
                <p className="font-mono text-lg font-bold text-slate-100">{receiptId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[11px] mb-1 font-bold uppercase tracking-[0.1em]">DATE / วันที่ชำระ</p>
                <p className="font-mono text-lg font-bold text-slate-100">{dateStr} <span className="text-slate-400 text-sm ml-1">{timeStr}</span></p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px] mb-1 font-bold uppercase tracking-[0.1em]">REF / อ้างอิงสัญญา</p>
                <p className="font-mono text-lg font-bold text-slate-100">{contract.contractId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[11px] mb-1 font-bold uppercase tracking-[0.1em]">RECEIVED FROM / ได้รับเงินจาก</p>
                <p className="text-lg font-bold text-white text-shadow-glow">{contract.borrowerName || '[CC] COUNCIL'}</p>
              </div>
            </div>

            {/* Payment Details Table */}
            <div className="mb-auto">
              <div className="flex justify-between items-end border-b border-slate-700 pb-3 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <h3 className="font-black text-white text-lg tracking-wide whitespace-nowrap">รายการชำระเงิน</h3>
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-widest">Description</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="font-black text-white text-lg tracking-wide whitespace-nowrap">จำนวนเงิน</h3>
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-widest">Amount</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  <span className="text-slate-200 font-medium text-lg">ชำระหนี้ตามสัญญา (คืนเงินกู้)</span>
                </div>
                <span className="font-mono text-xl font-bold text-white tracking-wider">{tx.amount?.toLocaleString()}.-</span>
              </div>
            </div>

            {/* Total Box - Cyberpunk Style */}
            <div className="mt-12 bg-[#0d131a] border border-slate-800/80 rounded-[1.5rem] p-8 flex justify-between items-center shadow-inner relative overflow-hidden group/total">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-l-[1.5rem]"></div>
              {/* Subtle grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
              
              <div className="relative z-10">
                <p className="text-emerald-500/80 font-bold mb-1 uppercase tracking-widest text-[11px]">Total Paid / ยอดรวมที่ชำระ</p>
                <p className="text-slate-400 text-sm font-medium">ชำระเงินเสร็จสมบูรณ์</p>
              </div>
              <div className="relative z-10 text-right flex items-baseline gap-2">
                <span className="font-mono text-4xl font-black text-emerald-400 text-shadow-glow tracking-tight">{tx.amount?.toLocaleString()}</span>
                <span className="text-emerald-500 font-black text-xl tracking-wider">THB</span>
              </div>
            </div>

            {/* Remaining Balance & Signatures */}
            <div className="flex justify-between items-end mt-8">
              <div className="bg-rose-950/30 border border-rose-900/40 px-6 py-4 rounded-2xl shadow-inner relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500/50"></div>
                <p className="text-rose-400/80 text-[10px] font-black uppercase tracking-widest mb-1">Remaining Balance / ยอดหนี้คงเหลือ</p>
                <p className="font-mono text-xl font-bold text-rose-400 text-shadow-glow-rose tracking-wide">{balanceAfter?.toLocaleString()} THB</p>
              </div>

              <div className="text-center w-64 pt-4">
                <div className="border-b-[1.5px] border-dashed border-slate-600 mb-4 w-48 mx-auto"></div>
                <p className="font-bold text-white text-base tracking-wide">( เจ้าหน้าที่ตัวแทนสภา )</p>
                <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider">ผู้รับเงิน / Authorized Signature</p>
              </div>
            </div>
            
          </div>

          {/* Footer Barcode Section with Scanner Line */}
          <div className="bg-slate-950 border-t border-slate-800/80 p-8 flex flex-col items-center justify-center relative z-10 receipt-cutout overflow-hidden">
            {/* Animated Scanner Line */}
            <div className="absolute inset-0 flex justify-center pointer-events-none">
              <div className="w-48 h-0.5 bg-emerald-500 shadow-[0_0_15px_2px_rgba(16,185,129,0.8)] animate-scan-line"></div>
            </div>
            
            <Barcode size={56} weight="thin" className="text-slate-500 mb-3" />
            <p className="font-mono text-[9px] text-slate-500 font-bold tracking-[0.3em]">{tx.id.toUpperCase()}</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
