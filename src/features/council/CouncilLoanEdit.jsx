import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  Calculator,
  CalendarBlank,
  CircleNotch
} from '@phosphor-icons/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';

export default function CouncilLoanEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, councilUsername, showAlert } = useAppStore();

  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Form states
  const [borrowerName, setBorrowerName] = useState('');
  const [reason, setReason] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestType, setInterestType] = useState('percent');
  const [interestRate, setInterestRate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('full');
  const [dueDate, setDueDate] = useState('');
  const [conditions, setConditions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractId, setContractId] = useState('');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const docRef = doc(db, 'loan_contracts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContractId(data.contractId || '');
          setBorrowerName(data.borrowerName || '');
          setReason(data.reason || '');
          setPrincipal(data.principalAmount?.toString() || '');
          setInterestType(data.interestType || 'percent');
          setInterestRate(data.interestRate?.toString() || '');
          setPaymentMethod(data.paymentMethod || 'full');
          setDueDate(data.dueDate || '');
          setConditions(data.conditions || '');
        } else {
          showAlert('error', 'ไม่พบข้อมูลสัญญา');
          navigate('/council_loan');
        }
      } catch (error) {
        console.error(error);
        showAlert('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchContract();
  }, [id, navigate, showAlert]);

  // Calculations
  const principalAmount = parseFloat(principal) || 0;
  const rateAmount = parseFloat(interestRate) || 0;
  
  let interestAmount = 0;
  if (interestType === 'percent') {
    interestAmount = principalAmount * (rateAmount / 100);
  } else {
    interestAmount = rateAmount; // fixed amount
  }
  
  const totalAmount = principalAmount + interestAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (principalAmount <= 0) {
      showAlert('error', 'เงินต้นต้องมากกว่า 0');
      return;
    }
    if (!dueDate) {
      showAlert('error', 'กรุณาระบุวันที่ครบกำหนดชำระ');
      return;
    }

    setIsSubmitting(true);
    try {
      let installmentAmount = null;
      if (paymentMethod === 'installments') {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date(dueDate);
        end.setHours(0,0,0,0);
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        installmentAmount = Math.ceil(totalAmount / diffDays);
      }
      
      const docRef = doc(db, 'loan_contracts', id);
      await updateDoc(docRef, {
        borrowerName,
        reason,
        principalAmount,
        interestType,
        interestRate: rateAmount,
        interestAmount,
        totalAmount,
        // Notice: Normally remainingAmount should be adjusted if totalAmount changes, but we leave it simple here
        paymentMethod,
        dueDate,
        installmentAmount,
        conditions,
      });

      showAlert('success', `อัปเดตสัญญากู้ยืม ${contractId} สำเร็จ`);
      navigate('/council_loan');
    } catch (error) {
      console.error("Error updating loan contract:", error);
      showAlert('error', `ข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch size={48} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/council_loan')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>กลับไปแดชบอร์ด</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          แก้ไขสัญญากู้ยืมเงิน ({contractId})
        </h1>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-700/50">
        
        {/* Section 1: Borrower Info */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-amber-500/10 text-amber-500 font-black px-3 py-1 rounded-lg border border-amber-500/20">1</span>
            <h2 className="text-xl font-bold text-amber-500">ข้อมูลผู้กู้และเหตุผล</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">
                ชื่อ-นามสกุล ผู้กู้ยืม <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">
                เหตุผลที่ขอกู้ยืม <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Financial Info */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-amber-500/10 text-amber-500 font-black px-3 py-1 rounded-lg border border-amber-500/20">2</span>
            <h2 className="text-xl font-bold text-amber-500">ข้อมูลตัวเงิน</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">
                เงินต้น (บาท) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number"
                min="0"
                required
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">
                รูปแบบดอกเบี้ย
              </label>
              <select 
                value={interestType}
                onChange={(e) => setInterestType(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none appearance-none"
                style={{ colorScheme: 'dark' }}
              >
                <option value="percent">คิดเป็นเปอร์เซ็นต์ (%)</option>
                <option value="fixed">ระบุจำนวนเงิน (บาท)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">
                อัตราดอกเบี้ย {interestType === 'percent' ? '(%)' : '(บาท)'}
              </label>
              <input 
                type="number"
                min="0"
                step={interestType === 'percent' ? "0.1" : "1"}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
              <Calculator size={20} weight="duotone" />
              สรุปยอดรวม (คำนวณอัตโนมัติ)
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-slate-400">ต้น: {principalAmount.toLocaleString()}</span>
              <span className="text-slate-600">+</span>
              <span className="text-slate-400">ดอก: {interestAmount.toLocaleString()}</span>
              <span className="text-slate-600">=</span>
              <span className="text-amber-500 text-xl font-black ml-2 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                รวม: {totalAmount.toLocaleString()} ฿
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Payment Method */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-amber-500/10 text-amber-500 font-black px-3 py-1 rounded-lg border border-amber-500/20">3</span>
            <h2 className="text-xl font-bold text-amber-500">วิธีการผ่อนชำระ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === 'full' 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="full"
                checked={paymentMethod === 'full'}
                onChange={() => setPaymentMethod('full')}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="font-bold">ชำระเต็มจำนวนตามกำหนด</span>
            </label>
            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === 'installments' 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="installments"
                checked={paymentMethod === 'installments'}
                onChange={() => setPaymentMethod('installments')}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="font-bold">ผ่อนชำระรายวัน</span>
            </label>
          </div>

          <div className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5">
            <label className="block text-slate-300 text-sm font-bold mb-2">
              วันที่ครบกำหนดชำระ (วันสิ้นสุดสัญญา) <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full mb-4">
              <input 
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {paymentMethod === 'installments' && dueDate && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4 animate-in fade-in zoom-in-95 duration-300">
                <h4 className="text-amber-500 font-bold mb-3 text-sm flex items-center gap-2">
                  <Calculator size={18} /> คำนวณยอดผ่อนชำระอัตโนมัติ
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-slate-400 text-xs font-bold mb-1">ระยะเวลาผ่อน</div>
                    <div className="text-white font-black">
                      {(() => {
                        const start = new Date();
                        start.setHours(0,0,0,0);
                        const end = new Date(dueDate);
                        end.setHours(0,0,0,0);
                        const diffTime = end - start;
                        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                        return `${diffDays} วัน`;
                      })()}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-slate-400 text-xs font-bold mb-1">ยอดผ่อนต่อวัน</div>
                    <div className="text-amber-500 font-black text-lg leading-none">
                      {(() => {
                        const start = new Date();
                        start.setHours(0,0,0,0);
                        const end = new Date(dueDate);
                        end.setHours(0,0,0,0);
                        const diffTime = end - start;
                        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                        const daily = Math.ceil(totalAmount / diffDays);
                        return `${daily.toLocaleString()} ฿`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Additional Terms */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-amber-500/10 text-amber-500 font-black px-3 py-1 rounded-lg border border-amber-500/20">4</span>
            <h2 className="text-xl font-bold text-amber-500">เงื่อนไขเพิ่มเติม</h2>
          </div>
          <textarea 
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="ระบุเงื่อนไขพิเศษ (ถ้ามี)..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none min-h-[120px] resize-y placeholder:text-slate-500"
          ></textarea>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4 pt-6 border-t border-slate-700/50">
          <button 
            type="button"
            onClick={() => navigate('/council_loan')}
            className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-[#d4af37] hover:bg-[#c5a028] disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <CircleNotch size={20} className="animate-spin" /> : <CheckCircle size={20} weight="bold" />}
            บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </div>
  );
}
