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
    if ((s.id === 'council_manage' || s.id === 'admin/transactions') && user?.role !== 'admin') {
      return false;
    }
    return true;
  });
  const filteredWebsites = filterServices(relatedWebsites);

  const renderServiceCard = (service, index = 0, isDanger = false, isExternal = false) => (
    <Card 
      key={service.id}
      style={{ animationDelay: `${index * 100}ms` }}
      className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up opacity-0 [animation-fill-mode:forwards] ${isDanger ? 'hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'}`}
      onClick={() => {
        if (service.id === 'council_manage' && user?.role !== 'admin') {
          showAlert('error', 'ไม่มีสิทธิ์เข้าถึง: เฉพาะระดับ Admin เท่านั้น');
          return;
        }
        if (isExternal) {
          window.open(service.url, '_blank');
        } else {
          navigate(`/${service.id}`);
        }
      }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-slate-700/50 text-blue-400'}`}>
        <i className={`ph-duotone ${service.icon} text-2xl`}></i>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{service.desc}</p>
    </Card>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-xl">
        <div className="absolute right-[-5%] top-[-20%] opacity-[0.03] scale-150 pointer-events-none">
          {/* Mock Logo or Icon */}
          <ShieldStar weight="fill" className="w-[400px] h-[400px] text-white" />
        </div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight uppercase">
            COUNCIL <span className="text-amber-500">SECRETARY</span><br/>
            E - SERVICE SYSTEM
          </h1>
          <p className="text-sm md:text-base text-slate-400 mb-10 tracking-[0.2em] font-bold uppercase">
            ALL-IN-ONE GANG & FAMILY SERVICE PLATFORM
          </p>
          
          <div className="w-full max-w-2xl relative">
            <MagnifyingGlass size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input 
              type="text" 
              placeholder="ค้นหาบริการ..." 
              className="pl-12 py-4 text-lg rounded-xl shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Public Services */}
      {(filteredPublic.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users size={28} weight="duotone" className="text-blue-500" />
            <h2 className="text-2xl font-bold text-white">บริการประชาชน</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPublic.map((s, i) => renderServiceCard(s, i))}
          </div>
        </section>
      )}

      {/* Council Services (Auth Required) */}
      {user && (filteredCouncil.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <ShieldStar size={28} weight="duotone" className="text-red-500" />
            <h2 className="text-2xl font-bold text-white">ระบบจัดการสำหรับสภา</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCouncil.map((s, i) => renderServiceCard(s, i, true))}
          </div>
        </section>
      )}

      {/* Related Websites */}
      {(filteredWebsites.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen size={28} weight="duotone" className="text-emerald-500" />
            <h2 className="text-2xl font-bold text-white">เว็บไซต์ที่เกี่ยวข้อง</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWebsites.map((s, i) => renderServiceCard(s, i, false, true))}
          </div>
        </section>
      )}

    </div>
  );
}
