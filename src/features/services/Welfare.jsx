import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GroupSelect from '../../components/ui/GroupSelect';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { PaperPlaneTilt, Trash, Gift, Car, Users, Sword, ArrowLeft, Skull, House, Buildings, Phone } from '@phosphor-icons/react';

export default function Welfare() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAppStore();
  const [step, setStep] = useState(location.state?.step || 1);
  
  const [formData, setFormData] = useState(() => location.state?.formData || {
    orgType: 'GANG',
    orgName: '',
    requester: '',
    phoneNumber: '',
    hasWeaponM9: false,
    hasWeaponHeavyRevolver: false,
    hasWeaponPoolCue: false,
    otherWelfare: ''
  });
  const [vehicles, setVehicles] = useState(() => location.state?.vehicles || []);

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { id: Date.now(), model: '', plate: '' }]);
  };

  const handleRemoveVehicle = (id) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleVehicleChange = (id, field, val) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.requester || !formData.phoneNumber) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (formData.phoneNumber.length !== 6 || isNaN(formData.phoneNumber)) {
      showAlert('error', 'กรุณาระบุเบอร์โทรศัพท์เป็นตัวเลข 6 หลัก');
      return;
    }
    if (vehicles.length > 0 && vehicles.some(v => !v.model.trim() || !v.plate.trim())) {
      showAlert('error', 'กรุณาระบุรุ่นรถและป้ายทะเบียนให้ครบทุกคัน');
      return;
    }
    // Navigate to preview page and pass the form data
    navigate('/welfare_preview', { state: { formData, vehicles } });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in fade-in slide-in-from-right-16 duration-700 ease-out relative">
      {/* Ambient Background Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none opacity-50 mix-blend-screen"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner relative backdrop-blur-md">
              <Gift size={32} weight="duotone" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ระบบเบิกสวัสดิการ</h2>
            <p className="text-emerald-400/80 font-medium mt-1">ยื่นแบบฟอร์มขอเบิกสวัสดิการสำหรับ GANG / FAMILY</p>
          </div>
        </div>
        <button 
          onClick={() => step === 2 ? setStep(1) : navigate('/home')} 
          className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-300 px-6 py-3 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-slate-600 backdrop-blur-sm self-start md:self-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/0 via-slate-800/50 to-slate-800/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="relative flex items-center gap-2 font-bold text-sm">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> กลับไปศูนย์บัญชาการ
          </div>
        </button>
      </div>

      {step === 1 ? (
        <div className="max-w-4xl mx-auto w-full pt-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-widest drop-shadow-sm">เลือกประเภทสังกัด</h1>
            <p className="text-emerald-400/60 mt-3 font-medium text-lg">กรุณาเลือกประเภทสังกัดที่คุณต้องการเบิกสวัสดิการ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-12">
            <button
              type="button"
              onClick={() => { setFormData({...formData, orgType: 'GANG'}); setStep(2); }}
              className="relative overflow-hidden bg-slate-950/40 border border-slate-800 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-amber-500/50 transition-all duration-500 group backdrop-blur-xl shadow-2xl hover:shadow-amber-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative w-32 h-32 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-amber-500/30 group-hover:bg-amber-950/30 shadow-inner">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Buildings size={56} weight="duotone" className="text-amber-600 group-hover:text-amber-400 transition-colors duration-300 relative z-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-300 group-hover:text-amber-400 tracking-widest transition-colors duration-300 relative z-10">GANG</h2>
            </button>
            
            <button
              type="button"
              onClick={() => { setFormData({...formData, orgType: 'FAMILY'}); setStep(2); }}
              className="relative overflow-hidden bg-slate-950/40 border border-slate-800 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-blue-500/50 transition-all duration-500 group backdrop-blur-xl shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative w-32 h-32 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-blue-500/30 group-hover:bg-blue-950/30 shadow-inner">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Buildings size={56} weight="duotone" className="text-blue-600 group-hover:text-blue-400 transition-colors duration-300 relative z-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-300 group-hover:text-blue-400 tracking-widest transition-colors duration-300 relative z-10">FAMILY</h2>
            </button>
          </div>
        </div>
      ) : (
      <div className="bg-slate-950/40 border border-slate-700/50 rounded-[32px] p-6 md:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 opacity-50"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">1</span> ชื่อ GANG / FAMILY <span className="text-amber-500">*</span>
              </label>
              <GroupSelect 
                label={null}
                orgType={formData.orgType}
                value={formData.orgName}
                onChange={val => setFormData({...formData, orgName: val})}
                placeholder="ระบุชื่อ..."
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">2</span> ผู้ทำรายการ (REQUESTER) <span className="text-amber-500">*</span>
              </label>
              <AutocompleteInput 
                placeholder="ชื่อ-นามสกุล (IC)"
                type="text"
                value={formData.requester}
                onChange={val => setFormData({...formData, requester: val})}
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">3</span> เบอร์โทรศัพท์ (6 หลัก) <span className="text-amber-500">*</span>
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 shadow-inner">
                <Phone size={20} className="text-slate-500 mr-3 shrink-0" weight="duotone" />
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none font-medium"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, phoneNumber: val});
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">4</span> เลือกสวัสดิการที่ได้รับ
            </label>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Vehicles Card */}
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-[24px] p-6 md:p-8 flex flex-col min-h-[280px] shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 flex items-center justify-center shadow-inner">
                      <Car size={24} weight="duotone" className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    </div>
                    <h3 className="font-black text-white text-lg tracking-wide whitespace-nowrap">สวัสดิการรถ</h3>
                  </div>
                  <button type="button" onClick={handleAddVehicle} className="text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm hover:shadow-blue-500/20 whitespace-nowrap shrink-0">
                    + เพิ่มรถ
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-900/20">
                    <Car size={32} weight="duotone" className="text-slate-600 mb-3" />
                    <p className="text-slate-400 text-sm font-medium">ยังไม่มีการเพิ่มข้อมูลรถ</p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 relative z-10">
                    {vehicles.map((v) => (
                      <div key={v.id} className="flex gap-3 items-center group/item">
                        <div className="flex-1 flex gap-2 relative">
                          <input 
                            className="w-1/2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-bold focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-500 shadow-inner transition-all"
                            placeholder="ระบุรุ่นรถ..."
                            value={v.model}
                            onChange={(e) => handleVehicleChange(v.id, 'model', e.target.value)}
                          />
                          <input 
                            className="w-1/2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-bold focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-500 shadow-inner transition-all uppercase"
                            placeholder="ระบุป้ายทะเบียน..."
                            value={v.plate}
                            onChange={(e) => handleVehicleChange(v.id, 'plate', e.target.value)}
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveVehicle(v.id)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all shadow-sm">
                          <Trash size={18} weight="duotone" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weapons Card */}
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-[24px] p-6 md:p-8 flex flex-col min-h-[280px] shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-red-500/20 to-red-900/40 border border-red-500/30 flex items-center justify-center shadow-inner">
                    <Sword size={24} weight="duotone" className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                  </div>
                  <h3 className="font-black text-white text-lg tracking-wide whitespace-nowrap">สวัสดิการอาวุธ</h3>
                </div>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <label className="flex items-center gap-4 cursor-pointer p-4 border border-slate-700/60 rounded-xl hover:border-red-500/50 hover:bg-slate-800/80 bg-slate-900/40 shadow-inner transition-all">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-red-500 shrink-0 rounded bg-slate-800 border-slate-600"
                      checked={formData.hasWeaponM9}
                      onChange={e => setFormData({...formData, hasWeaponM9: e.target.checked})}
                    />
                    <span className="font-bold text-slate-300 text-sm">มีด M9</span>
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer p-4 border border-slate-700/60 rounded-xl hover:border-red-500/50 hover:bg-slate-800/80 bg-slate-900/40 shadow-inner transition-all">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-red-500 shrink-0 rounded bg-slate-800 border-slate-600"
                      checked={formData.hasWeaponHeavyRevolver}
                      onChange={e => setFormData({...formData, hasWeaponHeavyRevolver: e.target.checked})}
                    />
                    <span className="font-bold text-slate-300 text-sm">ปืน Heavy Revolver Mk II</span>
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer p-4 border border-slate-700/60 rounded-xl hover:border-red-500/50 hover:bg-slate-800/80 bg-slate-900/40 shadow-inner transition-all">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-red-500 shrink-0 rounded bg-slate-800 border-slate-600"
                      checked={formData.hasWeaponPoolCue}
                      onChange={e => setFormData({...formData, hasWeaponPoolCue: e.target.checked})}
                    />
                    <span className="font-bold text-slate-300 text-sm">ไม้ Pool Cue</span>
                  </label>
                </div>

                <div className="flex-1 flex flex-col relative z-10">
                  <label className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">สวัสดิการอื่นๆ (เพิ่มเติม)</label>
                  <textarea 
                    className="w-full flex-1 min-h-[80px] bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-bold focus:outline-none focus:border-red-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-red-500/50 resize-none placeholder:text-slate-500 shadow-inner transition-all"
                    placeholder="ระบุเพิ่มเติม (ถ้ามี)..."
                    value={formData.otherWelfare}
                    onChange={e => setFormData({...formData, otherWelfare: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/60 relative z-10">
            <button 
              type="submit" 
              className="w-full h-16 text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-teal-500 disabled:shadow-none flex items-center justify-center gap-3 transition-all duration-300"
              disabled={
                !formData.orgName.trim() || 
                !formData.requester.trim() || 
                (vehicles.length === 0 && !formData.hasWeaponM9 && !formData.hasWeaponHeavyRevolver && !formData.hasWeaponPoolCue && !formData.otherWelfare.trim()) ||
                (vehicles.length > 0 && vehicles.some(v => !v.model.trim() || !v.plate.trim()))
              }
            >
              <PaperPlaneTilt size={24} weight="fill" /> ดำเนินการต่อ (ตรวจสอบสัญญา)
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
}
