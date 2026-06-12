import { CircleNotch } from '@phosphor-icons/react';

export default function LoadingScreen({ fullScreen = true, message = "กำลังโหลดข้อมูล..." }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
      {/* Logo with pulse effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
        <img src="/logo.png" alt="COUNCIL SYSTEM" className="h-24 md:h-32 object-contain relative z-10 drop-shadow-2xl animate-pulse" />
      </div>
      
      {/* Loading Indicator */}
      <div className="flex flex-col items-center space-y-3">
        <CircleNotch size={32} weight="bold" className="text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium tracking-wide animate-pulse">{message}</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800/50">
      {content}
    </div>
  );
}
