import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  Calculator,
  CalendarBlank,
  CircleNotch
} from '@phosphor-icons/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { useAppStore } from '../../store';
import GroupSelect from '../../components/ui/GroupSelect';

export default function CouncilLoanCreate() {
  const navigate = useNavigate();
  const { user, councilUsername, showAlert } = useAppStore();

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
    if (!borrowerName.trim()) {
      showAlert('error', 'กรุณาระบุชื่อผู้กู้ยืม');
      return;
    }
    if (!reason.trim()) {
      showAlert('error', 'กรุณาระบุเหตุผลการกู้');
      return;
    }
    if (principalAmount <= 0) {
      showAlert('error', 'เงินต้นต้องมากกว่า 0');
      return;
    }
    if (interestRate === '' || rateAmount < 0) {
      showAlert('error', 'กรุณาระบุอัตราดอกเบี้ยให้ถูกต้อง (หากไม่มีให้ใส่ 0)');
      return;
    }
    if (!dueDate) {
      showAlert('error', 'กรุณาระบุวันที่ครบกำหนดชำระ');
      return;
    }

    setIsSubmitting(true);
    try {
      const contractId = "CNCL-" + Math.floor(10000 + Math.random() * 90000);
      
      let installmentAmount = null;
      if (paymentMethod === 'installments') {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date(dueDate);
        end.setHours(0,0,0,0);
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        installmentAmount = Math.ceil(totalAmount / diffDays);
      }
      
      await addDoc(collection(db, 'loan_contracts'), {
        contractId,
        borrowerName,
        reason,
        principalAmount,
        interestType,
        interestRate: rateAmount,
        interestAmount,
        totalAmount,
        remainingAmount: totalAmount,
        paymentMethod,
        dueDate,
        installmentAmount,
        conditions,
        status: 'pending_signature',
        createdAt: serverTimestamp(),
        createdBy: {
          uid: user?.uid || 'unknown',
          email: user?.email || 'unknown',
          name: councilUsername || user?.email || 'Unknown'
        }
      });

      showAlert('success', `สร้างสัญญากู้ยืม ${contractId} สำเร็จ`);
      navigate('/council_loan');
    } catch (error) {
      console.error("Error creating loan contract:", error);
      showAlert('error', `ข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          สร้างสัญญากู้ยืมเงิน
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
              <GroupSelect 
                label={<>ชื่อ Gang / Family <span className="text-red-500">*</span></>}
                value={borrowerName}
                onChange={setBorrowerName}
                placeholder="ระบุชื่อแก๊ง หรือ ครอบครัว"
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
                min={new Date().toISOString().split('T')[0]}
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
            className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-[#d4af37] hover:bg-[#c5a028] transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} weight="bold" />
            บันทึกสัญญากู้ยืม
          </button>
        </div>
      </form>
    </div>
  );
}
