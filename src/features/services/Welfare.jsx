import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GroupSelect from '../../components/ui/GroupSelect';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { PaperPlaneTilt, Trash, Gift, Car, Users, Sword, ArrowLeft, Skull, House, Buildings } from '@phosphor-icons/react';

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
    // Navigate to preview page and pass the form data
    navigate('/welfare_preview', { state: { formData, vehicles } });
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 md:px-0 animate-in fade-in slide-in-from-right-16 duration-700 ease-out">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Gift size={28} weight="duotone" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">ระบบเบิกสวัสดิการ</h2>
            <p className="text-slate-400 text-sm">ยื่นแบบฟอร์มขอเบิกสวัสดิการสำหรับ GANG / FAMILY</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => step === 2 ? setStep(1) : navigate('/home')} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
          <ArrowLeft size={20} className="mr-2" /> <span className="hidden sm:inline">กลับไปศูนย์บัญชาการ</span>
        </Button>
      </div>

      {step === 1 ? (
        <div className="max-w-4xl mx-auto w-full pt-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-widest">เลือกประเภทสังกัด</h1>
            <p className="text-slate-400 mt-2">กรุณาเลือกประเภทสังกัดที่คุณต้องการเบิกสวัสดิการ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => { setFormData({...formData, orgType: 'GANG'}); setStep(2); }}
                className="bg-slate-900 border border-slate-800 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-amber-500/50 hover:bg-slate-800/50 transition-all group"
              >
                <div className="w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-black/20">
                  <Buildings size={40} weight="fill" className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-widest">GANG</h2>
              </button>
              
              <button
                type="button"
                onClick={() => { setFormData({...formData, orgType: 'FAMILY'}); setStep(2); }}
                className="bg-slate-900 border border-slate-800 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
              >
                <div className="w-24 h-24 rounded-full bg-blue-900/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-black/20">
                  <Buildings size={40} weight="fill" className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-widest">FAMILY</h2>
              </button>
          </div>
        </div>
      ) : (
      <div className="bg-slate-900/80 border border-slate-800 rounded-[24px] p-8 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <GroupSelect 
                label="1. ชื่อ GANG / FAMILY"
                orgType={formData.orgType}
                value={formData.orgName}
                onChange={val => setFormData({...formData, orgName: val})}
                placeholder="ระบุชื่อ..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-400 tracking-wide">2. ชื่อผู้กรอกข้อมูล</label>
              <AutocompleteInput 
                placeholder="ชื่อในเกม..."
                type="text"
                value={formData.requester}
                onChange={val => setFormData({...formData, requester: val})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-400 tracking-wide">3. เบอร์โทรศัพท์ (6 หลัก)</label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({...formData, phoneNumber: val});
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[13px] font-bold text-slate-400 tracking-wide">4. เลือกสวัสดิการที่ได้รับ</label>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Vehicles Card */}
              <div className="bg-slate-800/30 border-2 border-slate-700/50 rounded-2xl p-6 flex flex-col min-h-[240px]">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Car size={20} weight="fill" className="text-blue-400" />
                    </div>
                    <h3 className="font-bold text-slate-200 text-base whitespace-nowrap">สวัสดิการรถ</h3>
                  </div>
                  <button type="button" onClick={handleAddVehicle} className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
                    + เพิ่มรถ
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <p className="text-slate-500 italic text-sm">ยังไม่มีการเพิ่มข้อมูลรถ</p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    {vehicles.map((v) => (
                      <div key={v.id} className="flex gap-2">
                        <input 
                          className="w-1/2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-bold focus:outline-none focus:border-blue-500 focus:bg-slate-800 placeholder:text-slate-600"
                          placeholder="รุ่นรถ"
                          value={v.model}
                          onChange={(e) => handleVehicleChange(v.id, 'model', e.target.value)}
                        />
                        <input 
                          className="w-1/2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-bold focus:outline-none focus:border-blue-500 focus:bg-slate-800 placeholder:text-slate-600"
                          placeholder="ป้ายทะเบียน"
                          value={v.plate}
                          onChange={(e) => handleVehicleChange(v.id, 'plate', e.target.value)}
                        />
                        <button type="button" onClick={() => handleRemoveVehicle(v.id)} className="text-slate-500 hover:text-red-400 px-2 transition-colors">
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weapons Card */}
              <div className="bg-slate-800/30 border-2 border-slate-700/50 rounded-2xl p-6 flex flex-col min-h-[240px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Sword size={20} weight="fill" className="text-red-400" />
                  </div>
                  <h3 className="font-bold text-slate-200 text-base whitespace-nowrap">สวัสดิการอาวุธ</h3>
                </div>
                
                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-700 rounded-xl hover:border-red-500/50 hover:bg-slate-800/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-red-500 shrink-0"
                      checked={formData.hasWeaponM9}
                      onChange={e => setFormData({...formData, hasWeaponM9: e.target.checked})}
                    />
                    <span className="font-bold text-slate-300 text-sm">มีด M9</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-700 rounded-xl hover:border-red-500/50 hover:bg-slate-800/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-red-500 shrink-0"
                      checked={formData.hasWeaponHeavyRevolver}
                      onChange={e => setFormData({...formData, hasWeaponHeavyRevolver: e.target.checked})}
                    />
                    <span className="font-bold text-slate-300 text-sm">ปืน Heavy Revolver Mk II</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-700 rounded-xl hover:border-red-500/50 hover:bg-slate-800/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-red-500 shrink-0"
                      checked={formData.hasWeaponPoolCue}
                      onChange={e => setFormData({...formData, hasWeaponPoolCue: e.target.checked})}
                    />
                    <span className="font-bold text-slate-300 text-sm">ไม้ Pool Cue</span>
                  </label>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 mb-2">สวัสดิการอื่นๆ</label>
                  <textarea 
                    className="w-full flex-1 min-h-[80px] bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 font-bold focus:outline-none focus:border-red-500/50 focus:bg-slate-800 resize-none placeholder:text-slate-600"
                    placeholder="ระบุเพิ่มเติม..."
                    value={formData.otherWelfare}
                    onChange={e => setFormData({...formData, otherWelfare: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-base shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            disabled={
              !formData.orgName.trim() || 
              !formData.requester.trim() || 
              (vehicles.length === 0 && !formData.hasWeaponM9 && !formData.hasWeaponHeavyRevolver && !formData.hasWeaponPoolCue && !formData.otherWelfare.trim()) ||
              (vehicles.length > 0 && vehicles.some(v => !v.model.trim() || !v.plate.trim()))
            }
          >
            <PaperPlaneTilt size={20} weight="bold" /> ดำเนินการต่อ (ตรวจสอบสัญญา)
          </Button>
        </form>
      </div>
      )}
    </div>
  );
}
