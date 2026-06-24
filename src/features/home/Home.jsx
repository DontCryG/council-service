import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { publicServices, councilServices, relatedWebsites } from '../../data/models';
import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { MagnifyingGlass, Users, ShieldStar, BookOpen } from '@phosphor-icons/react';

export default function Home() {
  const navigate = useNavigate();
  const { user, showAlert } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filterServices = (services) => {
    if (!searchTerm) return services;
    const term = searchTerm.toLowerCase();
    return services.filter(
      s => s.title.toLowerCase().includes(term) || s.desc.toLowerCase().includes(term)
    );
  };

  const filteredPublic = filterServices(publicServices);
  const filteredCouncil = filterServices(councilServices).filter(s => {
    // Hide Admin-only rooms from non-admin users
    if ((s.id === 'council_manage' || s.id === 'transactions') && user?.role !== 'admin') {
      return false;
    }
    return true;
  });
  const filteredWebsites = filterServices(relatedWebsites);

  const renderBentoCard = (service, spanClass, isDanger = false, isExternal = false, isFeatured = false) => (
    <Card 
      key={service.id}
      className={`group cursor-pointer transition-all duration-500 overflow-hidden relative border ${spanClass} ${
        isDanger ? 'hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] border-white/5' 
        : 'hover:border-[#5865F2]/50 hover:shadow-[0_0_30px_rgba(88,101,242,0.2)] border-white/5'
      }`}
      onClick={() => {
        if (service.id === 'council_manage' && user?.role !== 'admin') {
          showAlert('error', 'ไม่มีสิทธิ์เข้าถึง: เฉพาะระดับ Admin เท่านั้น');
          return;
        }
        if (isExternal) window.open(service.url, '_blank');
        else navigate(`/${service.id}`);
      }}
    >
      {/* Background Gradient/Pattern */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isDanger ? 'bg-gradient-to-br from-red-500 to-transparent' : 'bg-gradient-to-br from-[#5865F2] to-transparent'}`} />
      
      <div className={`flex ${isFeatured ? 'flex-col h-full justify-between' : 'flex-col md:flex-row items-start md:items-center gap-4'} relative z-10 p-2`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
          isDanger ? 'bg-red-500/10 text-red-500' : 'bg-[#5865F2]/10 text-[#5865F2]'
        }`}>
          <i className={`ph-duotone ${service.icon} text-3xl`}></i>
        </div>
        
        <div className={`${isFeatured ? 'mt-4' : ''}`}>
          <h3 className={`font-bold text-white mb-1 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>{service.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{service.desc}</p>
        </div>
      </div>
      
      {/* Interactive indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-500/20 text-red-400' : 'bg-[#5865F2]/20 text-[#5865F2]'}`}>
          <i className="ph-bold ph-arrow-right"></i>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner - Premium Modern Design */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 md:p-16">
        {/* Abstract Glowing Background Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[100px]"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]"></div>
        </div>

        {/* Floating Shield Background */}
        <div className="absolute right-[-5%] top-[-10%] opacity-[0.02] scale-[1.8] pointer-events-none rotate-12">
          <ShieldStar weight="fill" className="w-[400px] h-[400px] text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-md mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-300 tracking-wider">COUNCIL SYSTEM V2</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-normal leading-[1.1] uppercase drop-shadow-sm">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500">
              COUNCIL
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 ml-4 md:ml-6">
              SECRETARY
            </span>
            <br/>
            <span className="text-3xl md:text-5xl text-slate-100 font-extrabold mt-3 block tracking-wide">
              E - SERVICE SYSTEM
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-slate-400 mb-12 tracking-[0.2em] font-bold uppercase max-w-2xl mx-auto">
            ALL-IN-ONE <span className="text-slate-300">GANG</span> & <span className="text-slate-300">FAMILY</span> SERVICE PLATFORM
          </p>
          
          {/* Search Bar - Glassmorphism */}
          <div className="w-full max-w-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="relative bg-slate-950/50 backdrop-blur-xl border border-slate-700/50 hover:border-slate-600 rounded-2xl flex items-center p-2 shadow-2xl transition-all duration-300 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20">
              <div className="pl-4 pr-2 text-slate-400">
                <MagnifyingGlass size={24} weight="bold" />
              </div>
              <input 
                type="text" 
                placeholder="ค้นหาบริการที่ต้องการ..." 
                className="w-full bg-transparent border-none outline-none text-lg text-white placeholder:text-slate-500 px-2 py-3 shadow-none focus:ring-0 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {/* Fake Shortcut Hint */}
              <div className="pr-4 hidden sm:flex items-center gap-1 opacity-50">
                <kbd className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300">Ctrl</kbd>
                <span className="text-xs text-slate-500">+</span>
                <kbd className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300">K</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Services - Bento Grid */}
      {(filteredPublic.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users size={28} weight="duotone" className="text-[#5865F2]" />
            <h2 className="text-2xl font-bold text-white">Public Sector (ประชาชน)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
            {filteredPublic.map((s, i) => {
              // Create dynamic bento grid spans based on index
              let spanClass = "col-span-1 md:col-span-1 xl:col-span-1";
              let isFeatured = false;
              
              if (i === 0) {
                spanClass = "col-span-1 md:col-span-2 xl:col-span-2 row-span-2"; // Large feature block
                isFeatured = true;
              } else if (i === 1 || i === 2) {
                spanClass = "col-span-1 md:col-span-1 xl:col-span-2 row-span-1"; // Wide block
              } else {
                spanClass = "col-span-1 md:col-span-1 xl:col-span-1 row-span-1"; // Standard block
              }
              
              return renderBentoCard(s, spanClass, false, false, isFeatured);
            })}
          </div>
        </section>
      )}

      {/* Council Services - Bento Grid */}
      {(user && filteredCouncil.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6 mt-10">
            <ShieldStar size={28} weight="duotone" className="text-amber-500" />
            <h2 className="text-2xl font-bold text-white">Council Sector (เจ้าหน้าที่สภา)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
            {filteredCouncil.map((s, i) => {
              let spanClass = "col-span-1 md:col-span-1 xl:col-span-1";
              let isFeatured = false;
              
              if (i === 0) {
                spanClass = "col-span-1 md:col-span-2 xl:col-span-2 row-span-2";
                isFeatured = true;
              } else if (i === 1) {
                spanClass = "col-span-1 md:col-span-1 xl:col-span-2 row-span-1";
              }
              
              return renderBentoCard(s, spanClass, true, false, isFeatured);
            })}
          </div>
        </section>
      )}

      {/* Related Websites */}
      {(filteredWebsites.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6 mt-10">
            <BookOpen size={28} weight="duotone" className="text-emerald-500" />
            <h2 className="text-2xl font-bold text-white">เอกสารอ้างอิง</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredWebsites.map((s) => renderBentoCard(s, "col-span-1 md:col-span-2 xl:col-span-2", false, true, false))}
          </div>
        </section>
      )}

    </div>
  );
}
