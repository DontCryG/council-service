import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

import Button from '../../components/ui/Button';
import { Trash, ArrowRight, Buildings, ArrowLeft } from '@phosphor-icons/react';

export default function RegisterOrg() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [formData, setFormData] = useState({
    orgType: 'GANG', // hardcoded to maintain backward compatibility
    name: '',
    alias: '',
    color: '#000000',
    logo: '',
    leader: '',
    councilStaffId: ''
  });
  
  const [coLeaders, setCoLeaders] = useState([]);
  const [members, setMembers] = useState([{ id: Date.now(), name: '' }]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'app_state'), (snapshot) => {
      let loaded = false;
      snapshot.forEach(doc => {
        if (doc.id === 'council_members') {
          setCouncilMembers(doc.data().members || []);
          loaded = true;
        }
      });
      if (!loaded) setCouncilMembers([]);
    });
    return () => unsub();
  }, []);

  const handleArrayAdd = (setter, state) => setter([...state, { id: Date.now(), name: '' }]);
  const handleArrayRemove = (setter, state, id) => setter(state.filter(item => item.id !== id));
  const handleArrayChange = (setter, state, id, val) => {
    setter(state.map(item => item.id === id ? { ...item, name: val } : item));
  };

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
      state: { formData, councilMembers, coLeaders, members: members.filter(m => m.name.trim() !== '') }
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Buildings size={32} weight="duotone" className="text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">ลงทะเบียนองค์กรใหม่</h2>
            <p className="text-slate-400">ระบบบันทึกการขึ้นทะเบียนแก๊งและครอบครัว</p>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white px-2">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับ
        </Button>
      </div>
      
      <div className="bg-slate-900 rounded-[24px] p-8 md:p-10 shadow-2xl border border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-3">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                ชื่อ GANG / FAMILY (ENG)
              </label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-600 uppercase"
                placeholder="เช่น COUNCIL"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z0-9\s\-_.]/g, '').toUpperCase()})}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                ตัวย่อ (ENG)
              </label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-600 text-center uppercase"
                placeholder="CC"
                maxLength={5}
                value={formData.alias}
                onChange={e => setFormData({...formData, alias: e.target.value.replace(/[^a-zA-Z0-9\s\-_.]/g, '').toUpperCase()})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            <div className="space-y-3">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                สีประจำสังกัด (HEX)
              </label>
              <div className="flex gap-3">
                <input 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-600 uppercase"
                  placeholder="#000000"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  required
                />
                <div 
                  className="w-14 h-14 rounded-xl border border-slate-800 shrink-0"
                  style={{ backgroundColor: formData.color || '#000000' }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                ลิงก์โลโก้ (URL .PNG)
              </label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-600"
                placeholder="https://..."
                value={formData.logo}
                onChange={e => setFormData({...formData, logo: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[14px] font-bold text-slate-300 tracking-wide">
              หัวหน้า (LEADER)
            </label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-600"
              placeholder="ชื่อ-นามสกุล (IC)"
              value={formData.leader}
              onChange={e => setFormData({...formData, leader: e.target.value})}
              required
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                รองหัวหน้า (CO-LEADER)
              </label>
              <button type="button" onClick={() => handleArrayAdd(setCoLeaders, coLeaders)} className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors">
                + เพิ่ม
              </button>
            </div>
            {coLeaders.length > 0 ? (
              <div className="space-y-3">
                {coLeaders.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <input 
                      placeholder="ระบุชื่อรองหัวหน้า..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-600" 
                      value={item.name} 
                      onChange={e => handleArrayChange(setCoLeaders, coLeaders, item.id, e.target.value)} 
                      required 
                    />
                    <button type="button" className="px-4 border border-slate-800 rounded-xl transition-colors bg-slate-900 text-red-400 hover:border-red-500 hover:bg-red-500/10" onClick={() => handleArrayRemove(setCoLeaders, coLeaders, item.id)}>
                      <Trash size={20}/>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                สมาชิกเริ่มต้น (FOUNDING MEMBERS)
              </label>
              <button type="button" onClick={() => handleArrayAdd(setMembers, members)} className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors">
                + เพิ่ม
              </button>
            </div>
            <div className="space-y-3">
              {members.map(item => (
                <div key={item.id} className="flex gap-3">
                  <input 
                    placeholder="ระบุชื่อสมาชิก..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-600" 
                    value={item.name} 
                    onChange={e => handleArrayChange(setMembers, members, item.id, e.target.value)} 
                  />
                  <button type="button" className={`px-4 border rounded-xl transition-colors bg-slate-900 ${members.length > 1 ? 'border-slate-800 text-red-400 hover:border-red-500 hover:bg-red-500/10' : 'border-slate-800 text-slate-600 cursor-not-allowed'}`} onClick={() => handleArrayRemove(setMembers, members, item.id)} disabled={members.length === 1}>
                    <Trash size={20}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800">
            <label className="text-[14px] font-bold text-slate-300 tracking-wide">
              เจ้าหน้าที่สภาผู้รับเรื่อง
            </label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-amber-500 focus:bg-slate-900 focus:ring-1 focus:ring-amber-500 transition-colors appearance-none"
              value={formData.councilStaffId}
              onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
              required
            >
              <option value="" disabled>-- เลือกเจ้าหน้าที่สภา --</option>
              {councilMembers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-6">
            <Button type="submit" size="lg" className="w-full bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 rounded-xl py-4 text-lg">
              ตรวจสอบข้อมูลก่อนส่ง <ArrowRight size={20} className="ml-2 inline" />
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
