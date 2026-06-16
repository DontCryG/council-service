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
    <div className="w-full px-4 xl:px-8 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 ml-2"
      >
        <ArrowLeft size={20} />
        <span>กลับหน้าหลัก</span>
      </button>

      <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden font-sans text-white border border-slate-700/50">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              แดชบอร์ดจัดการสัญญา
            </h1>
            <p className="text-slate-400 mt-1">
              ระบบจัดการข้อมูลและติดตามหนี้
            </p>
          </div>
          <button 
            onClick={() => navigate('/council_loan/create')}
            className="bg-[#d4af37] hover:bg-[#c5a028] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={20} weight="bold" />
            สร้างสัญญาใหม่
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat 1 */}
          <div className="bg-slate-900/50 rounded-2xl p-6 shadow-inner border border-slate-700/50 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-50 group-hover:bg-blue-500/20 transition-colors"></div>
            <div className="w-14 h-14 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center shrink-0 z-10 border border-slate-700">
              <FileText size={28} weight="fill" />
            </div>
            <div className="z-10">
              <p className="text-sm font-medium text-slate-400 mb-1">จำนวนสัญญาทั้งหมด</p>
              {loading ? (
                <CircleNotch size={24} className="animate-spin text-slate-500" />
              ) : (
                <p className="text-2xl font-black text-white">{totalContracts} <span className="text-lg font-bold">ฉบับ</span></p>
              )}
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-slate-900/50 rounded-2xl p-6 shadow-inner border border-slate-700/50 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl opacity-50 group-hover:bg-amber-500/20 transition-colors"></div>
            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 z-10 border border-amber-500/20">
              <CurrencyDollar size={28} weight="bold" />
            </div>
            <div className="z-10">
              <p className="text-sm font-medium text-slate-400 mb-1">ยอดเงินกู้รวม (ดอกเบี้ย)</p>
              {loading ? (
                <CircleNotch size={24} className="animate-spin text-amber-500/50" />
              ) : (
                <p className="text-2xl font-black text-white">{totalPrincipal.toLocaleString()} ฿</p>
              )}
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-slate-900/50 rounded-2xl p-6 shadow-inner border border-slate-700/50 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl opacity-50 group-hover:bg-red-500/20 transition-colors"></div>
            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0 z-10 border border-red-500/20">
              <WarningCircle size={28} weight="fill" />
            </div>
            <div className="z-10">
              <p className="text-sm font-medium text-slate-400 mb-1">ยอดคงค้างรอรับชำระ</p>
              {loading ? (
                <CircleNotch size={24} className="animate-spin text-red-500/50" />
              ) : (
                <p className="text-2xl font-black text-red-400">{totalRemaining.toLocaleString()} ฿</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Latest Contracts Table */}
          <div className="bg-slate-900/50 rounded-2xl shadow-inner border border-slate-700/50 xl:col-span-3 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="flex items-center gap-2 text-amber-500 font-bold text-lg">
                <FileText size={24} weight="duotone" />
                รายการสัญญาล่าสุด
              </h2>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="pb-4 pt-2 pr-3 text-xs font-bold text-slate-400 tracking-wider uppercase w-[15%]">เลขที่สัญญา</th>
                    <th className="pb-4 pt-2 px-3 text-xs font-bold text-slate-400 tracking-wider uppercase w-[30%]">ผู้กู้ยืม</th>
                    <th className="pb-4 pt-2 px-3 text-xs font-bold text-slate-400 tracking-wider uppercase w-[20%]">ยอดคงค้าง</th>
                    <th className="pb-4 pt-2 px-3 text-xs font-bold text-slate-400 tracking-wider uppercase text-center w-[15%]">สถานะ</th>
                    <th className="pb-4 pt-2 pl-3 text-xs font-bold text-slate-400 tracking-wider uppercase text-right w-[20%] min-w-[220px]">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500">
                        <CircleNotch size={32} className="animate-spin mx-auto mb-3 text-amber-500/50" />
                        <span className="font-medium tracking-wide">กำลังดึงข้อมูลสัญญา...</span>
                      </td>
                    </tr>
                  ) : contracts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700/50">
                          <FileText size={28} className="text-slate-600" />
                        </div>
                        <span className="font-medium tracking-wide">ยังไม่มีข้อมูล</span>
                      </td>
                    </tr>
                  ) : (
                    contracts.map((contract) => (
                      <tr key={contract.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition-all group">
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-amber-500/50 group-hover:bg-amber-400 transition-colors shrink-0"></span>
                            <span className="font-black text-amber-500/90 group-hover:text-amber-400 transition-colors tracking-wide">{contract.contractId}</span>
                          </div>
                        </td>
                        <td className="py-4 px-3 font-bold text-white">
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <span className="text-[15px]">{contract.borrowerName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-black text-emerald-400 text-[15px]">{(contract.remainingAmount || 0).toLocaleString()}</span>
                            <span className="font-black text-emerald-500/50 text-[15px]">฿</span>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex justify-center whitespace-nowrap">
                            {contract.status === 'pending_signature' && (
                              <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-blue-500/20 w-32">
                                รอผู้กู้เซ็น
                              </span>
                            )}
                            {contract.status === 'pending_council_signature' && (
                              <span className="inline-flex items-center justify-center bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-purple-500/20 w-32">
                                รอสภาเซ็น
                              </span>
                            )}
                            {contract.status === 'active' && (
                              <span className="inline-flex items-center justify-center bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-500/20 w-32">
                                กำลังผ่อนชำระ
                              </span>
                            )}
                            {contract.status === 'completed' && (
                              <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/20 w-32">
                                ชำระครบแล้ว
                              </span>
                            )}
                            {contract.status === 'defaulted' && (
                              <span className="inline-flex items-center justify-center bg-red-500/10 text-red-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-red-500/20 w-32">
                                ผิดนัดชำระ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pl-3">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            {contract.status === 'active' && (
                              <button 
                                onClick={() => handleUpdateBalance(contract.id, contract.contractId, contract.remainingAmount)}
                                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all border border-emerald-500/20 hover:border-emerald-500 shadow-sm shrink-0"
                              >
                                <UploadSimple size={14} weight="bold" />
                                อัพเดทยอด
                              </button>
                            )}
                            
                            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/50 shadow-inner shrink-0">
                              <button 
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" 
                                title="ดูรายละเอียด"
                                onClick={() => navigate(`/council_loan/view/${contract.id}`)}
                              >
                                <FileText size={16} weight="fill" />
                              </button>
                              <button 
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" 
                                title="คัดลอกลิงก์สัญญา"
                                onClick={() => {
                                  const textToCopy = `กรุณาเซ็นสัญญากู้ยืมเลขที่: ${contract.contractId} ได้ที่\n${window.location.origin}/loan_public?id=${contract.contractId}`;
                                  navigator.clipboard.writeText(textToCopy);
                                  showAlert('success', 'คัดลอกข้อความสำหรับส่งให้ผู้กู้สำเร็จ');
                                }}
                              >
                                <Copy size={16} weight="fill" />
                              </button>
                              <button 
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" 
                                title="แก้ไข"
                                onClick={() => navigate(`/council_loan/edit/${contract.id}`)}
                              >
                                <PencilSimple size={16} weight="fill" />
                              </button>
                              <button 
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" 
                                title="ลบสัญญา"
                                onClick={() => handleDeleteContract(contract.contractId, contract.id)}
                              >
                                <Trash size={16} weight="fill" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Alerts */}
          <div className="bg-slate-900/50 rounded-2xl shadow-inner border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="bg-red-500/10 p-5 border-b border-red-500/20 flex items-center gap-2 text-red-400 font-bold text-lg">
              <WarningCircle size={24} weight="duotone" />
              แจ้งเตือนถึงกำหนดชำระ
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">
                  <CircleNotch size={24} className="animate-spin mx-auto text-slate-500" />
                </div>
              ) : dueAlerts.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  ไม่มีสัญญาที่ใกล้ถึงกำหนดชำระ
                </div>
              ) : (
                <div className="space-y-4">
                  {dueAlerts.map(alert => {
                    const due = new Date(alert.dueDate);
                    const isOverdue = due < new Date();
                    
                    return (
                      <div key={alert.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-red-500/50 hover:shadow-md hover:shadow-red-500/5 transition-all cursor-pointer">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="font-black text-white truncate">{alert.contractId}</span>
                          {isOverdue ? (
                            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2 py-1 rounded-md font-bold whitespace-nowrap shrink-0">
                              เลยกำหนดชำระ
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-md font-bold whitespace-nowrap shrink-0">
                              ใกล้ถึงกำหนด
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 font-medium text-sm mb-5 truncate">
                          {alert.borrowerName}
                        </p>
                        <div className="flex flex-wrap justify-between items-center gap-2 text-sm border-t border-slate-700/50 pt-3 mt-2">
                          <span className="text-red-400 font-black">ค้างชำระ: {(alert.remainingAmount || 0).toLocaleString()} ฿</span>
                          <span className="text-slate-500 font-medium text-xs">
                            ดิว: {due.toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                          </span>
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
        className="max-w-md bg-slate-950 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl"
        hideCloseButton={true}
      >
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">บันทึกการชำระเงิน</h2>
          <button 
            onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
        
        <div className="p-6 bg-slate-800/50">
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 mb-1">เลขที่สัญญา</p>
            <p className="text-xl font-black text-white">{paymentModal.contractNumber}</p>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-red-400 font-bold text-sm">ยอดค้างชำระปัจจุบัน</span>
            <span className="text-red-400 font-black text-xl">{paymentModal.currentRemaining.toLocaleString()} ฿</span>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-300 mb-2">
              จำนวนเงินที่ชำระ (บาท)
            </label>
            <input 
              type="number" 
              min="0"
              step="any"
              value={paymentModal.amountStr}
              onChange={(e) => setPaymentModal(prev => ({ ...prev, amountStr: e.target.value }))}
              className="w-full bg-slate-900 border-2 border-amber-500/50 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:ring-0 outline-none transition-all font-bold text-lg"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
              disabled={paymentModal.isLoading}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl transition-all"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handlePaymentSubmit}
              disabled={paymentModal.isLoading || !paymentModal.amountStr}
              className="flex-1 bg-[#d4af37] hover:bg-[#c5a028] disabled:opacity-50 text-slate-900 font-black py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex justify-center items-center gap-2"
            >
              {paymentModal.isLoading ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : (
                'บันทึกยอด'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
