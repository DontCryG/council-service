import { Link } from 'react-router-dom';
import { Globe, FacebookLogo } from '@phosphor-icons/react';

export default function Portal() {
  return (
    <div className="min-h-screen bg-[#13151A] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Top Right */}
      <div className="absolute top-8 right-8 md:right-12 text-right">
        <h2 className="text-lg md:text-xl font-bold tracking-wider">สำนักงานเลขานุการสภา</h2>
        <p className="text-[10px] md:text-xs text-slate-400 tracking-widest uppercase mt-1">The Council Secretary Office</p>
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <div className="text-center">
          <p className="text-xs md:text-sm tracking-[0.4em] text-slate-400 uppercase mb-3">Council</p>
          <h1 className="text-6xl md:text-8xl font-black tracking-widest text-white mb-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">PORTAL</h1>
          
          <Link 
            to="/home" 
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
            LOGIN เข้าสู่ระบบสภา
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-8 left-8 right-8 md:left-12 md:right-12 flex justify-between items-end">
        <div>
          <div className="flex gap-4 mb-4 text-slate-400">
            <a href="#" className="hover:text-white transition-colors"><Globe size={20} weight="fill" /></a>
            <a href="#" className="hover:text-white transition-colors"><FacebookLogo size={20} weight="fill" /></a>
          </div>
          <p className="text-[10px] md:text-xs text-slate-500">สงวนลิขสิทธิ์ &copy; 2567 สำนักงานเลขานุการสภา</p>
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-slate-600 font-mono">v.17.0</p>
        </div>
      </div>
    </div>
  );
}
