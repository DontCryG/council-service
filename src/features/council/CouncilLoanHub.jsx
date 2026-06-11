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
  Copy
} from '@phosphor-icons/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';

export default function CouncilLoanHub() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'loan_contracts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContracts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalContracts = contracts.length;
  const totalPrincipal = contracts.reduce((sum, c) => sum + (c.principalAmount || 0), 0);
  const totalRemaining = contracts.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);

  const dueAlerts = [...contracts]
    .filter(c => c.status === 'active' && c.remainingAmount > 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <p className="text-sm font-medium text-slate-400 mb-1">ยอดเงินกู้รวม (เงินต้น)</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Contracts Table */}
          <div className="bg-slate-900/50 rounded-2xl shadow-inner border border-slate-700/50 lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="flex items-center gap-2 text-amber-500 font-bold text-lg">
                <FileText size={24} weight="duotone" />
                รายการสัญญาล่าสุด
              </h2>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="pb-4 pt-2 text-xs font-bold text-slate-400 tracking-wider uppercase">เลขที่สัญญา</th>
                    <th className="pb-4 pt-2 text-xs font-bold text-slate-400 tracking-wider uppercase">ผู้กู้ยืม</th>
                    <th className="pb-4 pt-2 text-xs font-bold text-slate-400 tracking-wider uppercase">ยอดคงค้าง</th>
                    <th className="pb-4 pt-2 text-xs font-bold text-slate-400 tracking-wider uppercase text-center">สถานะ</th>
                    <th className="pb-4 pt-2 text-xs font-bold text-slate-400 tracking-wider uppercase text-right">จัดการ</th>
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
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500/50 group-hover:bg-amber-400 transition-colors"></span>
                            <span className="font-black text-amber-500/90 group-hover:text-amber-400 transition-colors tracking-wide">{contract.contractId}</span>
                          </div>
                        </td>
                        <td className="py-4 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs text-slate-300">
                            {contract.borrowerName?.charAt(0) || '?'}
                          </div>
                          {contract.borrowerName}
                        </td>
                        <td className="py-4">
                          <span className="font-black text-emerald-400">{(contract.remainingAmount || 0).toLocaleString()} <span className="text-emerald-500/50 ml-0.5">฿</span></span>
                        </td>
                        <td className="py-4 text-center">
                          {contract.status === 'pending_signature' && (
                            <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-blue-500/20 w-28">
                              รอผู้กู้เซ็น
                            </span>
                          )}
                          {contract.status === 'active' && (
                            <span className="inline-flex items-center justify-center bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-amber-500/20 w-28">
                              กำลังผ่อนชำระ
                            </span>
                          )}
                          {contract.status === 'completed' && (
                            <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-emerald-500/20 w-28">
                              ชำระครบแล้ว
                            </span>
                          )}
                          {contract.status === 'defaulted' && (
                            <span className="inline-flex items-center justify-center bg-red-500/10 text-red-400 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-red-500/20 w-28">
                              ผิดนัดชำระ
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-end gap-2">
                            {contract.status === 'active' && (
                              <button className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all border border-emerald-500/20 hover:border-emerald-500 whitespace-nowrap shadow-sm">
                                <UploadSimple size={14} weight="bold" />
                                อัพเดทยอด
                              </button>
                            )}
                            
                            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/50 shadow-inner">
                              <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="ดูรายละเอียด">
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
                              <button className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="แก้ไข">
                                <PencilSimple size={16} weight="fill" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="ลบสัญญา">
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
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-black text-white">{alert.contractId}</span>
                          {isOverdue ? (
                            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded-md font-bold">
                              เลยกำหนดชำระ
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-md font-bold">
                              ใกล้ถึงกำหนด
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 font-medium text-sm mb-5">
                          {alert.borrowerName}
                        </p>
                        <div className="flex justify-between items-center text-sm border-t border-slate-700/50 pt-3 mt-2">
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
    </div>
  );
}
