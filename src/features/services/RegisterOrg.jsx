import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Buildings, Users, House, Plus, Trash, ArrowRight, WarningCircle, UserPlus } from '@phosphor-icons/react';

export default function RegisterOrg() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [formData, setFormData] = useState({
    orgType: 'GANG',
    name: '',
    alias: '',
    color: '#000000',
    logo: '',
    leader: '',
    councilStaffId: ''
  });
  
  const [coLeaders, setCoLeaders] = useState([]);
  const [members, setMembers] = useState([]);

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

  const handleArrayAdd = (setter, state) => setter([...state, { id: Date.now(), name: '', phone: '' }]);
  const handleArrayRemove = (setter, state, id) => setter(state.filter(item => item.id !== id));
  const handleArrayChange = (setter, state, id, field, value) => {
    setter(state.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.logo && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(formData.logo) && !formData.logo.includes('discordapp.')) {
      showAlert('error', 'ลิงก์รูปภาพไม่ถูกต้อง โปรดใช้ลิงก์ที่ลงท้ายด้วยนามสกุลไฟล์รูปภาพ');
      return;
    }
    navigate('/register_org_preview', {
      state: { formData, councilMembers, coLeaders, members }
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Buildings size={32} weight="duotone" className="text-amber-500" />
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">รับรององค์กร / ลงทะเบียน</h2>
          <p className="text-slate-400">ระบบบันทึกการจัดตั้ง Gang หรือ Family อย่างเป็นทางการ</p>
        </div>
      </div>
      
      <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-xl border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Group Type */}
          <div className="space-y-4">
            <label className="text-[15px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
              <span className="text-blue-600">1.</span> ประเภทสังกัด (GROUP TYPE)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                className={`py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border-2 ${formData.orgType === 'GANG' ? 'bg-amber-50 border-amber-400 text-[#1e293b]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                onClick={() => setFormData({...formData, orgType: 'GANG'})}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.orgType === 'GANG' ? 'bg-amber-100 text-[#1e293b]' : 'bg-slate-100 text-slate-400'}`}>
                   <Users size={20} weight="fill" />
                </div>
                GANG (แก๊ง)
              </button>
              <button
                type="button"
                className={`py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border-2 ${formData.orgType === 'FAMILY' ? 'bg-blue-50 border-blue-400 text-[#1e293b]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.orgType === 'FAMILY' ? 'bg-blue-100 text-[#1e293b]' : 'bg-slate-100 text-slate-400'}`}>
                   <House size={20} weight="fill" />
                </div>
                FAMILY (ครอบครัว)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[15px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
                <span className="text-blue-600">2.</span> ชื่อสังกัด (GROUP NAME)
              </label>
              <input 
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400"
                placeholder="ระบุชื่อแก๊ง หรือ ครอบครัว"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[15px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
                <span className="text-blue-600">3.</span> ผู้ทำรายการ (REQUESTER)
              </label>
              <input 
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400"
                placeholder="ชื่อ-นามสกุล (IC)"
                value={formData.leader}
                onChange={e => setFormData({...formData, leader: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[15px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
                <span className="text-blue-600">4.</span> นามแฝง/ตัวย่อ (ALIAS)
              </label>
              <input 
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400"
                placeholder="ตัวย่อสังกัด"
                value={formData.alias}
                onChange={e => setFormData({...formData, alias: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-[15px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
                <span className="text-blue-600">5.</span> โลโก้ (LOGO URL)
              </label>
              <input 
                type="url"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400"
                placeholder="https://..."
                value={formData.logo}
                onChange={e => setFormData({...formData, logo: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[15px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
                <span className="text-blue-600">6.</span> สีประจำกลุ่ม (COLOR)
              </label>
              <div className="flex gap-3 h-[50px]">
                <input 
                  type="color"
                  className="h-full w-14 rounded-xl cursor-pointer border border-slate-300"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                />
                <input 
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 font-medium focus:outline-none text-slate-700"
                  value={formData.color}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[16px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
                <Users size={22} className="text-blue-600" />
                <span className="text-blue-600">7.</span> รายชื่อรองหัวหน้า (CO-LEADERS)
              </label>
              <button type="button" onClick={() => handleArrayAdd(setCoLeaders, coLeaders)} className="text-sm font-bold bg-white border border-slate-300 text-[#1e293b] px-4 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition-colors shadow-sm">
                <UserPlus size={16} /> เพิ่มรายชื่อ
              </button>
            </div>
            <div className="space-y-3">
              {coLeaders.map(item => (
                <div key={item.id} className="flex gap-3">
                  <input placeholder="ระบุชื่อรองหัวหน้า..." className="flex-[1.5] bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={item.name} onChange={e => handleArrayChange(setCoLeaders, coLeaders, item.id, 'name', e.target.value)} />
                  <input type="number" placeholder="เบอร์โทรศัพท์ (ถ้ามี)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={item.phone} onChange={e => handleArrayChange(setCoLeaders, coLeaders, item.id, 'phone', e.target.value)} />
                  <button type="button" className="px-4 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors bg-white" onClick={() => handleArrayRemove(setCoLeaders, coLeaders, item.id)}><Trash size={20}/></button>
                </div>
              ))}
              {coLeaders.length === 0 && (
                <div className="text-slate-400 text-sm italic py-2">ไม่มีข้อมูลรองหัวหน้า (คลิก "เพิ่มรายชื่อ" เพื่อเพิ่ม)</div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[16px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
                <Users size={22} className="text-blue-600" />
                <span className="text-blue-600">8.</span> รายชื่อสมาชิก (MEMBERS)
              </label>
              <button type="button" onClick={() => handleArrayAdd(setMembers, members)} className="text-sm font-bold bg-white border border-slate-300 text-[#1e293b] px-4 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition-colors shadow-sm">
                <UserPlus size={16} /> เพิ่มรายชื่อ
              </button>
            </div>
            <div className="space-y-3">
              {members.map(item => (
                <div key={item.id} className="flex gap-3">
                  <input placeholder="ระบุชื่อสมาชิก..." className="flex-[1.5] bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={item.name} onChange={e => handleArrayChange(setMembers, members, item.id, 'name', e.target.value)} />
                  <input type="number" placeholder="เบอร์โทรศัพท์ (ถ้ามี)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={item.phone} onChange={e => handleArrayChange(setMembers, members, item.id, 'phone', e.target.value)} />
                  <button type="button" className="px-4 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors bg-white" onClick={() => handleArrayRemove(setMembers, members, item.id)}><Trash size={20}/></button>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-slate-400 text-sm italic py-2">ไม่มีข้อมูลสมาชิก (คลิก "เพิ่มรายชื่อ" เพื่อเพิ่ม)</div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <WarningCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700">ระบบจะทำการออกเอกสารใบรับรองโดยอัตโนมัติตามรายชื่อข้างต้น</p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-200">
            <label className="text-[15px] font-bold text-[#1e293b] tracking-wide flex items-center gap-2">
              <span className="text-blue-600">9.</span> เจ้าหน้าที่สภาผู้รับเรื่อง (COUNCIL MEMBER)
            </label>
            <select 
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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
            <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-xl py-4 text-lg">
              ตรวจสอบข้อมูลก่อนส่ง <ArrowRight size={20} className="ml-2 inline" />
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
