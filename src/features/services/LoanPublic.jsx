import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, ArrowLeft } from '@phosphor-icons/react';

export default function LoanPublic() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // TODO: Implement search logic
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        <span>กลับหน้าหลัก</span>
      </button>

      <div className="bg-slate-50 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100 rounded-full blur-3xl -ml-20 -mb-20 opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-4">
            ตรวจสอบข้อมูลสัญญา
          </h1>
          <p className="text-slate-600 md:text-lg mb-10 max-w-2xl mx-auto">
            สำหรับผู้กู้ยืม กรุณากรอกเลขที่สัญญาของคุณเพื่อเซ็นรับทราบหรือตรวจสอบยอดค้างชำระ
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
              <div className="pl-4 text-slate-400">
                <MagnifyingGlass size={24} weight="bold" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="เช่น CNCL-10001" 
                className="flex-1 bg-transparent border-none outline-none text-slate-800 px-4 py-3 text-lg placeholder:text-slate-300 w-full"
              />
              <button 
                type="submit"
                className="bg-[#d4af37] hover:bg-[#c5a028] text-white font-bold px-8 py-3 md:py-4 rounded-xl transition-colors text-lg whitespace-nowrap"
              >
                ค้นหา
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
