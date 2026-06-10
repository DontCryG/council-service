import { Link } from 'react-router-dom';
import { Globe, FacebookLogo } from '@phosphor-icons/react';

export default function Portal() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/portal_bg.png')" }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/90"></div>
      
      {/* Subtle Animated Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Top Right */}
      <div className="absolute top-8 right-8 md:right-12 text-right z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <h2 className="text-lg md:text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          สำนักงานเลขานุการสภา
        </h2>
        <p className="text-[10px] md:text-xs text-slate-500 tracking-[0.3em] uppercase mt-1">The Council Secretary Office</p>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 -mt-10">
        
        {/* Glassmorphism Card Wrapper */}
        <div className="relative p-10 md:p-16 rounded-3xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000 delay-300">
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl border border-white/10 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.5)]"></div>
          
          <div className="relative text-center">
            <p className="text-xs md:text-sm tracking-[0.5em] text-emerald-400/80 uppercase mb-4 font-medium flex items-center justify-center gap-4">
              <span className="w-8 h-[1px] bg-emerald-500/30"></span>
              Council
              <span className="w-8 h-[1px] bg-emerald-500/30"></span>
            </p>
            
            <h1 className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              PORTAL
            </h1>
            
            <Link 
              to="/home" 
              className="group relative inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-sm tracking-widest transition-all duration-300 border border-white/20 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:-translate-y-1 overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>
              
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
              </span>
              LOGIN เข้าสู่ระบบสภา
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="absolute bottom-8 left-8 right-8 md:left-12 md:right-12 flex flex-col md:flex-row justify-between items-center md:items-end gap-4 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex gap-5 mb-4 text-slate-500">
            <a href="#" className="hover:text-white hover:scale-110 transition-all duration-300"><Globe size={22} weight="duotone" /></a>
            <a href="#" className="hover:text-blue-500 hover:scale-110 transition-all duration-300"><FacebookLogo size={22} weight="duotone" /></a>
          </div>
          <p className="text-[10px] md:text-xs text-slate-600 tracking-wider">สงวนลิขสิทธิ์ &copy; 2567 สำนักงานเลขานุการสภา</p>
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-slate-700 font-mono tracking-widest">VERSION 17.0</p>
        </div>
      </div>
    </div>
  );
}
