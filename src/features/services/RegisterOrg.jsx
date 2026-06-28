import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';

import Button from '../../components/ui/Button';
import { Trash, ArrowRight, Buildings, ArrowLeft, Plus, Users, WarningCircle, Link, Palette } from '@phosphor-icons/react';

export default function RegisterOrg() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAppStore();
  const initialState = location.state || {};
  
  const [step, setStep] = useState(initialState.step || 1);
  const [councilMembers, setCouncilMembers] = useState([]);
  
  const [formData, setFormData] = useState(initialState.formData || {
    orgType: 'GANG', // hardcoded to maintain backward compatibility
    name: '',
    alias: '',
    color: '#000000',
    logo: '',
    leader: '',
    councilStaffId: ''
  });
  
  const [coLeaders, setCoLeaders] = useState(initialState.coLeaders || []);
  const [members, setMembers] = useState(initialState.members || [{ id: Date.now(), name: '' }]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_state', 'council_members'), (docSnap) => {
      if (docSnap.exists()) {
        setCouncilMembers(docSnap.data().members || []);
      } else {
        setCouncilMembers([]);
      }
    });
    return () => unsub();
  }, []);

  const handleArrayAdd = (setter, state) => setter([...state, { id: Date.now(), name: '' }]);
  const handleArrayRemove = (setter, state, id) => setter(state.filter(item => item.id !== id));
  const handleArrayChange = (setter, state, id, val) => {
    setter(state.map(item => item.id === id ? { ...item, name: val } : item));
  };

  const isLogoValid = !formData.logo || /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(formData.logo) || formData.logo.includes('discordapp.') || formData.logo.includes('discord.com');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.leader || !formData.councilStaffId || !formData.logo) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(formData.logo) && !formData.logo.includes('discordapp.') && !formData.logo.includes('discord.com')) {
      showAlert('error', 'ให้ใส่แค่ลิ้งค์รูปภาพเท่านั้น');
      return;
    }
    
    navigate('/register_org_preview', {
      state: { 
        formData, 
        councilMembers, 
        coLeaders: coLeaders.filter(c => c.name.trim() !== ''), 
        members: members.filter(m => m.name.trim() !== '') 
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out relative">
      
      {/* Ambient Background Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none opacity-50 mix-blend-screen"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner relative backdrop-blur-md">
              <Buildings size={32} weight="duotone" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ลงทะเบียนองค์กรใหม่</h2>
            <p className="text-amber-400/80 font-medium mt-1">ระบบบันทึกการขึ้นทะเบียนแก๊งและครอบครัว</p>
          </div>
        </div>
        <button 
          onClick={() => step === 2 ? setStep(1) : navigate('/home')}
          className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-300 px-6 py-3 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-slate-600 backdrop-blur-sm self-start md:self-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/0 via-slate-800/50 to-slate-800/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="relative flex items-center gap-2 font-bold text-sm">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            {step === 2 ? 'ย้อนกลับ' : 'กลับไปศูนย์บัญชาการ'}
          </div>
        </button>
      </div>
      
      {step === 1 ? (
        <div className="max-w-4xl mx-auto w-full pt-10 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight mb-4 drop-shadow-sm">เลือกประเภทสังกัด</h1>
            <p className="text-amber-400/60 md:text-lg max-w-2xl mx-auto font-medium">กรุณาเลือกประเภทสังกัดที่คุณต้องการจดทะเบียน</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                type="button"
                onClick={() => { setFormData({...formData, orgType: 'GANG'}); setStep(2); }}
                className="bg-slate-900/40 border border-slate-700/50 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all duration-500 group relative overflow-hidden backdrop-blur-md shadow-2xl hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-amber-500/20 transition-colors duration-500"></div>
                <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-inner">
                  <Buildings size={64} weight="duotone" className="text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-widest relative z-10 drop-shadow-md">GANG</h2>
              </button>
              
              <button
                type="button"
                onClick={() => { setFormData({...formData, orgType: 'FAMILY'}); setStep(2); }}
                className="bg-slate-900/40 border border-slate-700/50 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-500 group relative overflow-hidden backdrop-blur-md shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 shadow-inner">
                  <Users size={64} weight="duotone" className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-widest relative z-10 drop-shadow-md">FAMILY</h2>
              </button>
          </div>
        </div>
      ) : (
      <div className="max-w-4xl mx-auto w-full bg-slate-950/40 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 shadow-2xl border border-slate-700/50 relative overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Decorative Top Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${formData.orgType === 'GANG' ? 'via-amber-500' : 'via-blue-500'} to-transparent opacity-50`}></div>
        
        {/* Form Title & Context */}
        <div className="mb-10 flex items-center gap-4 border-b border-slate-700/50 pb-6">
           <div className={`w-14 h-14 rounded-2xl ${formData.orgType === 'GANG' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'} flex items-center justify-center border`}>
             {formData.orgType === 'GANG' ? <Buildings size={28} weight="duotone" /> : <Users size={28} weight="duotone" />}
           </div>
           <div>
             <h2 className="text-2xl font-black text-white tracking-tight">รายละเอียดองค์กร</h2>
             <p className="text-slate-400 font-bold mt-1 text-sm tracking-widest uppercase">ประเภท: <span className={formData.orgType === 'GANG' ? 'text-amber-400' : 'text-blue-400'}>{formData.orgType}</span></p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            {/* Org Name */}
            <div className="space-y-3 group">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                <Users size={16} /> ชื่อ {formData.orgType} (ENG)
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity"></div>
                <input 
                  className="w-full relative bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-4 text-white font-black text-lg focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-600 uppercase shadow-inner"
                  placeholder="เช่น COUNCIL"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z0-9\s\-_.]/g, '').toUpperCase()})}
                  required
                />
              </div>
            </div>

            {/* Alias */}
            <div className="space-y-3 group">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
                ตัวย่อ (ENG)
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity"></div>
                <input 
                  className="w-full relative bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-4 text-white font-black text-lg focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-600 text-center uppercase shadow-inner"
                  placeholder="CC"
                  maxLength={5}
                  value={formData.alias}
                  onChange={e => setFormData({...formData, alias: e.target.value.replace(/[^a-zA-Z0-9\s\-_.]/g, '').toUpperCase()})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            {/* Color */}
            <div className="space-y-3 group">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                <Palette size={16} /> สีประจำสังกัด (HEX)
              </label>
              <div className="flex gap-3 relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                <input 
                  className="flex-1 relative bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-4 text-white font-black text-lg focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-600 uppercase shadow-inner"
                  placeholder="#000000"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  required
                />
                <div 
                  className="w-16 h-16 rounded-xl border-2 border-slate-700/80 shrink-0 relative overflow-hidden shadow-inner"
                  style={{ backgroundColor: formData.color || '#000000' }}
                >
                   {/* Glossy overlay for the color box */}
                   <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Logo Link */}
            <div className="space-y-3 group">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                <Link size={16} /> ลิงก์โลโก้ (URL .PNG)
              </label>
              <div className="relative">
                <div className={`absolute inset-0 ${!isLogoValid ? 'bg-red-500/20' : 'bg-amber-500/20'} blur-md opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity pointer-events-none`}></div>
                <input 
                  className={`w-full relative bg-slate-900/80 border ${!isLogoValid ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700/80 focus:border-amber-500/80 focus:ring-amber-500/20'} rounded-xl px-4 py-4 text-white font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 shadow-inner`}
                  placeholder="https://..."
                  value={formData.logo}
                  onChange={e => setFormData({...formData, logo: e.target.value})}
                  required
                />
              </div>
              {!isLogoValid && (
                <p className="text-red-400 text-xs font-bold mt-2 flex items-center gap-1 animate-in fade-in"><WarningCircle size={14} /> * ให้ใส่แค่ลิ้งค์รูปภาพเท่านั้น</p>
              )}
            </div>
          </div>

          {/* Leader */}
          <div className="space-y-3 pt-4 group">
            <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
              หัวหน้า (LEADER)
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
              <input 
                className="w-full relative bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-4 text-white font-medium text-lg focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="ชื่อ-นามสกุล (IC)"
                value={formData.leader}
                onChange={e => setFormData({...formData, leader: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Co-Leaders */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80 mt-6">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
                รองหัวหน้า (CO-LEADER)
              </label>
              <button type="button" onClick={() => handleArrayAdd(setCoLeaders, coLeaders)} className="text-xs font-black text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <Plus size={14} /> เพิ่ม
              </button>
            </div>
            {coLeaders.length > 0 ? (
              <div className="space-y-3">
                {coLeaders.map(item => (
                  <div key={item.id} className="flex gap-3 group">
                    <input 
                      placeholder="ระบุชื่อรองหัวหน้า..." 
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-medium focus:border-amber-500/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-600 shadow-inner" 
                      value={item.name} 
                      onChange={e => handleArrayChange(setCoLeaders, coLeaders, item.id, e.target.value)} 
                      required 
                    />
                    <button type="button" className="px-4 border border-slate-700/80 rounded-xl transition-colors bg-slate-900/80 text-red-400 hover:border-red-500 hover:bg-red-500/20 shadow-inner" onClick={() => handleArrayRemove(setCoLeaders, coLeaders, item.id)}>
                      <Trash size={20} weight="duotone"/>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Members */}
          <div className="space-y-4 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
                สมาชิกเริ่มต้น (FOUNDING MEMBERS)
              </label>
              <button type="button" onClick={() => handleArrayAdd(setMembers, members)} className="text-xs font-black text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <Plus size={14} /> เพิ่ม
              </button>
            </div>
            <div className="space-y-3">
              {members.map(item => (
                <div key={item.id} className="flex gap-3">
                  <input 
                    placeholder="ระบุชื่อสมาชิก..." 
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-medium focus:border-amber-500/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-600 shadow-inner" 
                    value={item.name} 
                    onChange={e => handleArrayChange(setMembers, members, item.id, e.target.value)} 
                  />
                  <button type="button" className={`px-4 border rounded-xl transition-colors bg-slate-900/80 shadow-inner ${members.length > 1 ? 'border-slate-700/80 text-red-400 hover:border-red-500 hover:bg-red-500/20' : 'border-slate-800 text-slate-700 cursor-not-allowed'}`} onClick={() => handleArrayRemove(setMembers, members, item.id)} disabled={members.length === 1}>
                    <Trash size={20} weight={members.length > 1 ? 'duotone' : 'regular'}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Council Staff */}
          <div className="space-y-3 pt-6 border-t border-slate-800/80">
            <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
              เจ้าหน้าที่สภาผู้รับเรื่อง
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
              <select 
                className="w-full relative bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-4 text-white font-bold text-lg focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none shadow-inner"
                value={formData.councilStaffId}
                onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
                required
              >
                <option value="" disabled className="text-slate-500 bg-slate-900">-- เลือกเจ้าหน้าที่สภา --</option>
                {councilMembers.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <ArrowRight size={20} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button 
              type="submit" 
              className="w-full h-16 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black px-10 rounded-2xl transition-all text-xl tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 relative z-10 hover:scale-[1.02]"
            >
              ตรวจสอบข้อมูลก่อนส่ง <ArrowRight size={24} weight="bold" />
            </button>
          </div>

        </form>
      </div>
      )}
    </div>
  );
}
