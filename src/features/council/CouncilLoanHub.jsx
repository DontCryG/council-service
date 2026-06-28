import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CurrencyDollar, 
  WarningCircle, 
  Plus, 
  UploadSimple, 
  PencilSimple, 
  Trash, 
  ArrowLeft,
  CircleNotch,
  Copy,
  CheckCircle,
  X
} from '@phosphor-icons/react';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Modal from '../../components/ui/Modal';

export default function CouncilLoanHub() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    contractId: null,
    contractNumber: '',
    currentRemaining: 0,
    amountStr: '',
    isLoading: false
  });

  useEffect(() => {
    // Limit to 50 latest contracts to improve initial load performance
    const q = query(collection(db, 'loan_contracts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContracts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteContract = (contractId, id) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบสัญญา',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบสัญญากู้ยืม ${contractId} ?\nการกระทำนี้ไม่สามารถกู้คืนได้`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await deleteDoc(doc(db, 'loan_contracts', id));
          showAlert('success', 'ลบสัญญาสำเร็จ');
        } catch (err) {
          console.error(err);
          showAlert('error', 'เกิดข้อผิดพลาดในการลบสัญญา');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleCouncilSign = (contractId, id) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการอนุมัติ',
      message: `คุณต้องการลงนามอนุมัติสัญญากู้ยืม ${contractId} ใช่หรือไม่?\nสถานะจะเปลี่ยนเป็น "กำลังผ่อนชำระ"`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await updateDoc(doc(db, 'loan_contracts', id), {
            status: 'active',
            councilSignedAt: serverTimestamp()
          });
          showAlert('success', 'ลงนามอนุมัติสัญญาสำเร็จ');
        } catch (err) {
          console.error(err);
          showAlert('error', 'เกิดข้อผิดพลาดในการอนุมัติสัญญา');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleUpdateBalance = (id, contractId, currentRemaining) => {
    setPaymentModal({
      isOpen: true,
      contractId: id,
      contractNumber: contractId,
      currentRemaining: currentRemaining || 0,
      amountStr: '',
      isLoading: false
    });
  };

  const handlePaymentSubmit = async () => {
    try {
      setPaymentModal(prev => ({ ...prev, isLoading: true }));
      const payAmount = parseFloat(paymentModal.amountStr);
      if (isNaN(payAmount) || payAmount <= 0) {
        showAlert('error', 'กรุณาระบุจำนวนเงินที่ถูกต้อง');
        setPaymentModal(prev => ({ ...prev, isLoading: false }));
        return;
      }
      if (payAmount > paymentModal.currentRemaining) {
        showAlert('error', 'จำนวนเงินที่ชำระต้องไม่เกินยอดค้างชำระ');
        setPaymentModal(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Update remainingAmount
      const contractRef = doc(db, 'loan_contracts', paymentModal.contractId);
      const newRemaining = paymentModal.currentRemaining - payAmount;
      const updates = {
        remainingAmount: newRemaining,
        updatedAt: serverTimestamp()
      };
      if (newRemaining <= 0) {
        updates.status = 'completed';
      }
      await updateDoc(contractRef, updates);

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        contractId: paymentModal.contractId,
        type: 'payment',
        amount: payAmount,
        createdAt: serverTimestamp(),
        createdBy: 'council_staff'
      });

      showAlert('success', 'บันทึกการชำระเงินสำเร็จ');
      setPaymentModal({ isOpen: false, contractId: null, contractNumber: '', currentRemaining: 0, amountStr: '', isLoading: false });
    } catch (error) {
      console.error(error);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน');
      setPaymentModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const totalContracts = contracts.length;
  const totalPrincipal = contracts.reduce((sum, c) => sum + (c.principalAmount || 0), 0);
  const totalRemaining = contracts.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);

  const dueAlerts = [...contracts]
    .filter(c => c.status === 'active' && c.remainingAmount > 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="w-full px-4 xl:px-8 mx-auto animate-in fade-in zoom-in-95 duration-700 relative z-10 max-w-[1500px]">
      
      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]"></div>
      </div>

      <button 
        onClick={() => navigate('/home')}
        className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 mb-6 ml-2 bg-slate-900/50 hover:bg-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700/50 w-fit"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-sm">กลับหน้าหลัก</span>
      </button>

      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden font-sans text-white border border-slate-700/50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40"></div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 tracking-tight drop-shadow-md">
              ระบบจัดการเงินกู้สภา
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              ระบบจัดการข้อมูลการทำสัญญากู้ยืมและติดตามการชำระหนี้
            </p>
          </div>
          <button 
            onClick={() => navigate('/council_loan/create')}
            className="group relative overflow-hidden bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400 px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <Plus size={20} weight="bold" className="relative z-10" />
            <span className="relative z-10">สร้างสัญญาใหม่</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
          {/* Stat 1 */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-7 shadow-xl border border-slate-700/50 flex items-center gap-6 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[40px] opacity-50 group-hover:bg-blue-500/20 group-hover:scale-125 transition-all duration-700 pointer-events-none"></div>
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 z-10 border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <FileText size={32} weight="duotone" />
            </div>
            <div className="z-10">
              <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">จำนวนสัญญาทั้งหมด</p>
              {loading ? (
                <CircleNotch size={24} className="animate-spin text-blue-500/50 mt-1" />
              ) : (
                <p className="text-3xl font-black text-white drop-shadow-md">{totalContracts} <span className="text-base font-bold text-slate-500">ฉบับ</span></p>
              )}
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-7 shadow-xl border border-slate-700/50 flex items-center gap-6 relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-[40px] opacity-50 group-hover:bg-amber-500/20 group-hover:scale-125 transition-all duration-700 pointer-events-none"></div>
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 z-10 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <CurrencyDollar size={32} weight="duotone" />
            </div>
            <div className="z-10">
              <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">ยอดเงินกู้รวม</p>
              {loading ? (
                <CircleNotch size={24} className="animate-spin text-amber-500/50 mt-1" />
              ) : (
                <p className="text-3xl font-black text-white drop-shadow-md">{totalPrincipal.toLocaleString()} <span className="text-base font-bold text-slate-500">฿</span></p>
              )}
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-7 shadow-xl border border-slate-700/50 flex items-center gap-6 relative overflow-hidden group hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/10 rounded-full blur-[40px] opacity-50 group-hover:bg-red-500/20 group-hover:scale-125 transition-all duration-700 pointer-events-none"></div>
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0 z-10 border border-red-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <WarningCircle size={32} weight="duotone" />
            </div>
            <div className="z-10">
              <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">ยอดคงค้างรอรับชำระ</p>
              {loading ? (
                <CircleNotch size={24} className="animate-spin text-red-500/50 mt-1" />
              ) : (
                <p className="text-3xl font-black text-red-400 drop-shadow-md">{totalRemaining.toLocaleString()} <span className="text-base font-bold text-red-500/50">฿</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
          {/* Latest Contracts Table */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/50 xl:col-span-3 overflow-hidden flex flex-col relative z-10">
            <div className="p-8 border-b border-slate-800/80 bg-slate-950/30">
              <h2 className="flex items-center gap-3 text-amber-500 font-black text-xl drop-shadow-md">
                <FileText size={28} weight="duotone" className="text-amber-400" />
                รายการสัญญาล่าสุด
              </h2>
            </div>
            <div className="p-8 relative">
              {loading ? (
                <div className="py-12 text-center text-slate-500">
                  <CircleNotch size={32} className="animate-spin mx-auto mb-3 text-amber-500/50" />
                  <span className="font-bold tracking-widest uppercase text-[11px]">กำลังดึงข้อมูลสัญญา...</span>
                </div>
              ) : contracts.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-900/30 border-2 border-dashed border-slate-700/50 rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center mb-4 border border-slate-700/80 shadow-inner">
                    <FileText size={32} className="text-slate-600" />
                  </div>
                  <span className="font-bold tracking-widest uppercase text-xs">ยังไม่มีข้อมูลสัญญา</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
                      {/* Inner Glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 pointer-events-none transition-colors -mr-10 -mt-10"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50 group-hover:bg-amber-400 transition-colors shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                            <span className="font-black text-amber-500/90 group-hover:text-amber-400 transition-colors tracking-widest text-[11px] uppercase">{contract.contractId}</span>
                          </div>
                          <div className="flex justify-end">
                            {contract.status === 'pending_signature' && (
                              <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/30 shadow-inner">รอผู้กู้เซ็น</span>
                            )}
                            {contract.status === 'pending_council_signature' && (
                              <span className="bg-purple-500/10 text-purple-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-500/30 shadow-inner">รอสภาเซ็น</span>
                            )}
                            {contract.status === 'active' && (
                              <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/30 shadow-inner">กำลังผ่อนชำระ</span>
                            )}
                            {contract.status === 'completed' && (
                              <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 shadow-inner">ชำระครบแล้ว</span>
                            )}
                            {contract.status === 'defaulted' && (
                              <span className="bg-red-500/10 text-red-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-500/30 shadow-inner">ผิดนัดชำระ</span>
                            )}
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ผู้กู้ยืม</div>
                          <div className="text-white font-bold text-lg drop-shadow-md">{contract.borrowerName}</div>
                        </div>

                        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/50 mb-6 flex items-center justify-between shadow-inner">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ยอดคงค้าง</div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-emerald-400 text-2xl drop-shadow-md">{(contract.remainingAmount || 0).toLocaleString()}</span>
                            <span className="font-black text-emerald-500/50 text-sm">฿</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-800/80 relative z-10">
                        {contract.status === 'active' ? (
                          <button 
                            onClick={() => handleUpdateBalance(contract.id, contract.contractId, contract.remainingAmount)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black transition-all border border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)] shrink-0"
                          >
                            <UploadSimple size={16} weight="bold" />
                            อัพเดทยอด
                          </button>
                        ) : <div></div>}
                        
                        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/50 shadow-inner">
                          <button 
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all hover:shadow-md" 
                            title="ดูรายละเอียด"
                            onClick={() => navigate(`/council_loan/view/${contract.id}`)}
                          >
                            <FileText size={18} weight="fill" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all hover:shadow-md hover:border-blue-500/20 border border-transparent" 
                            title="คัดลอกลิงก์สัญญา"
                            onClick={() => {
                              const textToCopy = `กรุณาเซ็นสัญญากู้ยืมเลขที่: ${contract.contractId} ได้ที่\n${window.location.origin}/loan_public?id=${contract.contractId}`;
                              navigator.clipboard.writeText(textToCopy);
                              showAlert('success', 'คัดลอกข้อความสำหรับส่งให้ผู้กู้สำเร็จ');
                            }}
                          >
                            <Copy size={18} weight="fill" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all hover:shadow-md hover:border-amber-500/20 border border-transparent" 
                            title="แก้ไข"
                            onClick={() => navigate(`/council_loan/edit/${contract.id}`)}
                          >
                            <PencilSimple size={18} weight="fill" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all hover:shadow-md hover:border-red-500/20 border border-transparent" 
                            title="ลบสัญญา"
                            onClick={() => handleDeleteContract(contract.contractId, contract.id)}
                          >
                            <Trash size={18} weight="fill" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Alerts */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col relative z-10">
            <div className="bg-red-500/10 p-6 border-b border-red-500/20 flex items-center gap-3 text-red-500 font-black text-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16"></div>
              <WarningCircle size={28} weight="fill" className="animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="drop-shadow-md">แจ้งเตือนถึงกำหนดชำระ</span>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <CircleNotch size={28} className="animate-spin mx-auto text-slate-500" />
                </div>
              ) : dueAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm font-medium">
                  ไม่มีสัญญาที่ใกล้ถึงกำหนดชำระ
                </div>
              ) : (
                <div className="space-y-4">
                  {dueAlerts.map(alert => {
                    const due = new Date(alert.dueDate);
                    const isOverdue = due < new Date();
                    
                    return (
                      <div key={alert.id} className="bg-slate-950/80 border border-slate-700/80 rounded-2xl p-5 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300 cursor-pointer group shadow-inner">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="font-black text-white truncate drop-shadow-sm">{alert.contractId}</span>
                          {isOverdue ? (
                            <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] px-2.5 py-1.5 rounded-lg font-black uppercase tracking-widest whitespace-nowrap shrink-0 shadow-inner">
                              เลยกำหนดชำระ
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2.5 py-1.5 rounded-lg font-black uppercase tracking-widest whitespace-nowrap shrink-0 shadow-inner">
                              ใกล้ถึงกำหนด
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 font-bold text-sm mb-5 truncate group-hover:text-slate-300 transition-colors">
                          {alert.borrowerName}
                        </p>
                        <div className="flex flex-col gap-2 text-sm border-t border-slate-800/80 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ค้างชำระ</span>
                            <span className="text-red-400 font-black">{(alert.remainingAmount || 0).toLocaleString()} ฿</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ดิว</span>
                            <span className="text-slate-400 font-medium text-xs bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
                              {due.toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isLoading={confirmModal.isLoading}
      />

      <Modal 
        isOpen={paymentModal.isOpen} 
        onClose={() => !paymentModal.isLoading && setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        title="บันทึกการชำระเงิน"
        className="max-w-md bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl relative"
        hideCloseButton={true}
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20"></div>

        <div className="px-8 py-6 border-b border-slate-800/80 flex items-center justify-between relative z-10 bg-slate-900/50">
          <h2 className="text-white font-black text-xl drop-shadow-md">บันทึกการชำระเงิน</h2>
          <button 
            onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
            className="text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 p-2 rounded-xl transition-all border border-slate-700/50 shadow-inner"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
        
        <div className="p-8 relative z-10">
          <div className="mb-6">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">เลขที่สัญญา</p>
            <p className="text-2xl font-black text-amber-500 drop-shadow-md">{paymentModal.contractNumber}</p>
          </div>
          
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-inner">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">ยอดค้างชำระปัจจุบัน</span>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-black text-2xl drop-shadow-md">{paymentModal.currentRemaining.toLocaleString()}</span>
              <span className="text-emerald-500/50 font-bold">฿</span>
            </div>
          </div>

          <div className="mb-10">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
              จำนวนเงินที่ชำระ (บาท)
            </label>
            <div className="relative group/input">
              <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
              <input 
                type="number" 
                min="0"
                step="any"
                value={paymentModal.amountStr}
                onChange={(e) => setPaymentModal(prev => ({ ...prev, amountStr: e.target.value }))}
                className="w-full relative bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:border-amber-500/80 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-black text-2xl shadow-inner placeholder-slate-700"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
              disabled={paymentModal.isLoading}
              className="flex-1 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-4 rounded-2xl transition-all border border-slate-700/80 shadow-inner"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handlePaymentSubmit}
              disabled={paymentModal.isLoading || !paymentModal.amountStr}
              className="group/btn relative overflow-hidden flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-400 hover:text-amber-300 font-black py-4 rounded-2xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] border border-amber-500/30 hover:border-amber-400 hover:-translate-y-0.5 flex justify-center items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {paymentModal.isLoading ? (
                  <CircleNotch size={24} className="animate-spin" />
                ) : (
                  <>บันทึกยอด <CheckCircle size={22} weight="bold" /></>
                )}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
