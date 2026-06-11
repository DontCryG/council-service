import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Coins, Receipt, ArrowLeft } from '@phosphor-icons/react';

export default function CouncilLoanHub() {
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
          ระบบกู้ยืม
        </h1>
        <p className="text-slate-400 mt-2">
          ระบบจัดการการกู้ยืมเงินและชำระเงินกู้สำหรับสภา
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] group"
          onClick={() => navigate('/council_loan/borrow')}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 bg-red-500/10 text-red-500 border border-red-500/20">
            <Coins size={32} weight="duotone" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">ระบบกู้ยืมเงิน</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            บริการกู้ยืมเงินสภาสำหรับประชาชนและองค์กร
          </p>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] group"
          onClick={() => navigate('/council_loan/repay')}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 bg-red-500/10 text-red-500 border border-red-500/20">
            <Receipt size={32} weight="duotone" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">ระบบชำระเงินกู้</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            บริการชำระเงินกู้และตรวจสอบสถานะการกู้ยืม
          </p>
        </Card>
      </div>
    </div>
  );
}
