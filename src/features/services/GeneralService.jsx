import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { transactions } from '../../data/models';

import Button from '../../components/ui/Button';
import { Users, House, Plus, Trash, ArrowRight, WarningCircle, UserPlus, FileText, ArrowLeft } from '@phosphor-icons/react';

export default function GeneralService() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [formData, setFormData] = useState({
    transactionId: '',
    groupType: 'GANG',
    groupName: '',
    requester: '',
    councilMemberId: ''
  });
  const [members, setMembers] = useState([{ id: 1, value: '' }]);

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

  const handleAddMember = () => setMembers([...members, { id: Date.now(), value: '' }]);
  const handleRemoveMember = (id) => {
    if (members.length > 1) {
      setMembers(members.filter(m => m.id !== id));
    }
  };
  const handleMemberChange = (id, val) => setMembers(members.map(m => m.id === id ? { ...m, value: val } : m));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.transactionId || !formData.groupName || !formData.requester || !formData.councilMemberId) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (members.some(m => !m.value.trim())) {
      showAlert('error', 'กรุณากรอกชื่อสมาชิกให้ครบถ้วน');
      return;
    }

    navigate('/general_service_preview', {
      state: { formData, councilMembers, members }
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <FileText size={32} weight="duotone" className="text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">ระบบให้บริการทั่วไป</h2>
            <p className="text-slate-400">ระบบบันทึกการทำธุรกรรมทั่วไปของแก๊งและครอบครัว</p>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white px-2">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับ
        </Button>
      </div>
      
      <div className="bg-slate-900 rounded-[24px] p-8 md:p-10 shadow-2xl border border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Group Type */}
          <div className="space-y-4">
            <label className="text-[15px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <span className="text-blue-500">1.</span> ประเภทสังกัด (GROUP TYPE)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                className={`py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border-2 ${formData.groupType === 'GANG' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                onClick={() => setFormData({...formData, groupType: 'GANG'})}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.groupType === 'GANG' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                   <Users size={20} weight="fill" />
                </div>
                GANG (แก๊ง)
              </button>
              <button
                type="button"
                className={`py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border-2 ${formData.groupType === 'FAMILY' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                onClick={() => setFormData({...formData, groupType: 'FAMILY'})}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.groupType === 'FAMILY' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                   <House size={20} weight="fill" />
                </div>
                FAMILY (ครอบครัว)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[15px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <span className="text-blue-500">2.</span> ชื่อสังกัด (GROUP NAME)
              </label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-600"
                placeholder="ระบุชื่อแก๊ง หรือ ครอบครัว"
                value={formData.groupName}
                onChange={e => setFormData({...formData, groupName: e.target.value.toUpperCase()})}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[15px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <span className="text-blue-500">3.</span> ผู้ทำรายการ (REQUESTER)
              </label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-600"
                placeholder="ชื่อ-นามสกุล (IC)"
                value={formData.requester}
                onChange={e => setFormData({...formData, requester: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <label className="text-[15px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <span className="text-blue-500">4.</span> เลือกรายการธุรกรรม (TRANSACTION)
            </label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={formData.transactionId}
              onChange={e => setFormData({...formData, transactionId: e.target.value})}
              required
            >
              <option value="" disabled>-- กรุณาเลือกรายการ --</option>
              {transactions.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} - ${t.price.toLocaleString()} {t.type === 'per_head' ? '(ต่อหัว)' : '(เหมา)'}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[16px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <Users size={22} className="text-slate-200" />
                <span className="text-blue-500">5.</span> รายชื่อสมาชิก (ที่เกี่ยวข้อง)
              </label>
              <button type="button" onClick={handleAddMember} className="text-sm font-bold bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors shadow-sm">
                <UserPlus size={16} /> เพิ่มรายชื่อ
              </button>
            </div>
            <div className="space-y-3">
              {members.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex-1 relative">
                    <UserPlus size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input placeholder="ระบุชื่อสมาชิก..." className="w-full pl-12 bg-slate-950 border border-slate-800 rounded-xl pr-4 py-3.5 text-slate-200 focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-600" value={item.value} onChange={e => handleMemberChange(item.id, e.target.value)} required />
                  </div>
                  <button type="button" className={`px-4 border rounded-xl transition-colors bg-slate-900 ${members.length > 1 ? 'border-slate-700 text-red-400 hover:border-red-500 hover:bg-red-500/10' : 'border-slate-800 text-slate-600 cursor-not-allowed'}`} onClick={() => handleRemoveMember(item.id)} disabled={members.length === 1}><Trash size={20}/></button>
                </div>
              ))}
            </div>
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 flex items-start gap-3">
              <WarningCircle size={20} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-300">หากธุรกรรมคิดเงินเป็นรายหัว ระบบจะนำจำนวนคนไปคูณยอดอัตโนมัติ</p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800">
            <label className="text-[15px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <span className="text-blue-500">6.</span> เจ้าหน้าที่สภาผู้รับเรื่อง (COUNCIL MEMBER)
            </label>
            <div className="relative">
              <UserPlus size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <select 
                className="w-full pl-12 bg-slate-950 border border-slate-800 rounded-xl pr-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                value={formData.councilMemberId}
                onChange={e => setFormData({...formData, councilMemberId: e.target.value})}
                required
              >
                <option value="" disabled>-- เลือกเจ้าหน้าที่สภา --</option>
                {councilMembers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6">
            <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 rounded-xl py-4 text-lg">
              ตรวจสอบข้อมูลก่อนส่ง <ArrowRight size={20} className="ml-2 inline" />
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
