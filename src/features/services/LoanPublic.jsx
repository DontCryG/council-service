import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, ArrowLeft, FileText, CheckCircle, WarningCircle, CurrencyDollar, CalendarBlank, PenNib } from '@phosphor-icons/react';
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

  const handleSignContract = async () => {
    if (!contract || contract.status !== 'pending_signature') return;
    
    setSigning(true);
    try {
      const contractRef = doc(db, 'loan_contracts', contract.id);
      await updateDoc(contractRef, {
        status: 'active',
        signedAt: serverTimestamp()
      });
      
      // Update local state
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
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 ml-2"
      >
        <ArrowLeft size={20} />
        <span>กลับหน้าหลัก</span>
      </button>

      <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-700/50">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <div className="relative z-10">
          {!contract ? (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                  ตรวจสอบข้อมูลสัญญา
                </h1>
                <p className="text-slate-400 md:text-lg max-w-2xl mx-auto">
                  สำหรับผู้กู้ยืม กรุณากรอกเลขที่สัญญาของคุณเพื่อเซ็นรับทราบหรือตรวจสอบยอดค้างชำระ
                </p>
              </div>

              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center bg-slate-900/50 rounded-2xl p-2 shadow-inner border border-slate-700 focus-within:border-amber-500/50 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all gap-2">
                  <div className="pl-4 text-slate-400 hidden sm:block">
                    <MagnifyingGlass size={24} weight="bold" />
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="เช่น CNCL-10001" 
                    className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 text-lg placeholder:text-slate-500 w-full text-center sm:text-left font-bold"
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-[#d4af37] hover:bg-[#c5a028] disabled:opacity-50 text-slate-900 font-black px-8 py-3.5 rounded-xl transition-colors text-lg whitespace-nowrap shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                    ) : (
                      'ค้นหา'
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-red-400 text-center mt-4 font-bold flex items-center justify-center gap-2">
                    <WarningCircle size={20} weight="bold" /> {error}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-700/50 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <FileText size={28} className="text-amber-500" weight="duotone" />
                    รายละเอียดสัญญา
                  </h2>
                  <p className="text-slate-400 font-medium mt-1">เลขที่: <span className="text-amber-500 font-bold">{contract.contractId}</span></p>
                </div>
                
                <div className="flex flex-col sm:items-end">
                  {contract.status === 'pending_signature' && (
                    <span className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border border-blue-500/20 inline-block text-center">
                      รอผู้กู้เซ็นรับทราบ
                    </span>
                  )}
                  {contract.status === 'active' && (
                    <span className="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border border-amber-500/20 inline-block text-center">
                      กำลังผ่อนชำระ
                    </span>
                  )}
                  {contract.status === 'completed' && (
                    <span className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border border-emerald-500/20 inline-block text-center">
                      ชำระครบแล้ว
                    </span>
                  )}
                  {contract.status === 'defaulted' && (
                    <span className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border border-red-500/20 inline-block text-center">
                      ผิดนัดชำระ
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                  <div className="text-sm font-bold text-slate-400 mb-1">ชื่อผู้กู้ยืม</div>
                  <div className="text-xl font-black text-white">{contract.borrowerName}</div>
                </div>
                
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-400">ยอดเงินกู้รวม (เงินต้น)</span>
                    <CurrencyDollar size={20} className="text-amber-500" weight="bold" />
                  </div>
                  <div className="text-2xl font-black text-amber-500">{(contract.principalAmount || 0).toLocaleString()} <span className="text-lg text-amber-500/50">฿</span></div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-400">ยอดคงค้าง (รวมดอกเบี้ย)</span>
                    <WarningCircle size={20} className={contract.remainingAmount > 0 ? "text-red-400" : "text-emerald-400"} weight="bold" />
                  </div>
                  <div className={`text-2xl font-black ${contract.remainingAmount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {(contract.remainingAmount || 0).toLocaleString()} <span className="text-lg opacity-50">฿</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-400">กำหนดชำระ (วันดิว)</span>
                    <CalendarBlank size={20} className="text-blue-400" weight="bold" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {new Date(contract.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {contract.conditions && (
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 mb-8">
                  <div className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <FileText size={18} /> เงื่อนไขสัญญา / หมายเหตุ
                  </div>
                  <div className="text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                    {contract.conditions}
                  </div>
                </div>
              )}

              {/* Signature Section */}
              {contract.status === 'pending_signature' && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400">
                    <PenNib size={32} weight="duotone" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">ลงนามรับทราบสัญญา</h3>
                  <p className="text-slate-400 text-sm max-w-lg mb-6">
                    ข้าพเจ้า <span className="font-bold text-white">{contract.borrowerName}</span> ขอยืนยันว่าได้รับเงินกู้ตามจำนวนที่ระบุไว้ และตกลงที่จะชำระคืนตามกำหนดเวลาและเงื่อนไขที่ตกลงกันไว้
                  </p>
                  
                  <button 
                    onClick={handleSignContract}
                    disabled={signing}
                    className="bg-blue-500 hover:bg-blue-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                  >
                    {signing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle size={22} weight="bold" />
                        ข้าพเจ้ายอมรับและเซ็นรับทราบสัญญา
                      </>
                    )}
                  </button>
                </div>
              )}

              {contract.status !== 'pending_signature' && (
                <div className="flex justify-center mt-8">
                  <button 
                    onClick={() => {
                      setContract(null);
                      setSearchQuery('');
                    }}
                    className="text-slate-400 hover:text-white font-bold transition-colors text-sm border-b border-transparent hover:border-white pb-0.5"
                  >
                    ค้นหาสัญญาอื่น
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
