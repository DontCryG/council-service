import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, Trash, Gift, Car, Users, House, Sword, ArrowLeft } from '@phosphor-icons/react';

export default function Welfare() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAppStore();
  
  const [formData, setFormData] = useState(() => location.state?.formData || {
    orgType: 'GANG',
    orgName: '',
    requester: '',
    hasWeaponWelfare: false,
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
    if (!formData.orgName || !formData.requester) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    // Navigate to preview page and pass the form data
    navigate('/welfare_preview', { state: { formData, vehicles } });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[800px] mx-auto py-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gift size={32} weight="duotone" className="text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">ระบบเบิกสวัสดิการ Gang / Family</h1>
            <p className="text-slate-400">ยื่นแบบฟอร์มขอเบิกสวัสดิการสำหรับ GANG / FAMILY</p>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={() => navigate('/home')} className="text-slate-400 hover:text-white px-2">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับ
        </Button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-[24px] p-8 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-3">
            <label className="text-[13px] font-bold text-slate-400 tracking-wide">1. ประเภทสังกัดของคุณ</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`py-4 rounded-xl font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all border-2 ${formData.orgType === 'GANG' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800'}`}
                onClick={() => setFormData({...formData, orgType: 'GANG'})}
              >
                <Users size={20} className={formData.orgType === 'GANG' ? 'text-amber-500' : 'text-slate-500'} /> GANG
              </button>
              <button
                type="button"
                className={`py-4 rounded-xl font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all border-2 ${formData.orgType === 'FAMILY' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800'}`}
                onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
              >
                <House size={20} className={formData.orgType === 'FAMILY' ? 'text-blue-500' : 'text-slate-500'} /> FAMILY
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-400 tracking-wide">2. ชื่อ GANG / FAMILY</label>
              <input 
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-bold focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-colors placeholder:text-slate-600"
                placeholder="ระบุชื่อ..."
                value={formData.orgName}
                onChange={e => {
                  const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                  setFormData({...formData, orgName: val});
                }}
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-400 tracking-wide">3. ชื่อผู้กรอกข้อมูล</label>
              <input 
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-bold focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-colors placeholder:text-slate-600"
                placeholder="ชื่อในเกม..."
                value={formData.requester}
                onChange={e => setFormData({...formData, requester: e.target.value})}
                required
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
                
                <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-700 rounded-xl hover:border-red-500/50 hover:bg-slate-800/50 transition-colors mb-4">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 cursor-pointer accent-red-500 shrink-0"
                    checked={formData.hasWeaponWelfare}
                    onChange={e => setFormData({...formData, hasWeaponWelfare: e.target.checked})}
                  />
                  <span className="font-bold text-slate-300 text-sm">สวัสดิการอาวุธไม้พูล</span>
                </label>

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
              (vehicles.length === 0 && !formData.hasWeaponWelfare && !formData.otherWelfare.trim()) ||
              (vehicles.length > 0 && vehicles.some(v => !v.model.trim() || !v.plate.trim()))
            }
          >
            <PaperPlaneTilt size={20} weight="bold" /> ดำเนินการต่อ (ตรวจสอบสัญญา)
          </Button>
        </form>
      </div>
    </div>
  );
}
