import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { HandCoins, ArrowLeft } from '@phosphor-icons/react';

export default function LoanPublic() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        <span>กลับหน้าหลัก</span>
      </button>

      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
          ระบบขอกู้ยืมเงิน
        </h1>
        <p className="text-slate-400 mt-2">
          กำลังพัฒนาระบบ กรุณารอติดตามเร็วๆ นี้...
        </p>
      </div>
    </div>
  );
}
