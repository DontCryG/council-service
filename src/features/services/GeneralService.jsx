import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { transactions } from '../../data/models';
import AutocompleteInput from '../../components/ui/AutocompleteInput';

import Button from '../../components/ui/Button';
import GroupSelect from '../../components/ui/GroupSelect';
import { Users, House, Plus, Trash, ArrowRight, WarningCircle, UserPlus, FileText, ArrowLeft, Skull, Buildings } from '@phosphor-icons/react';

export default function GeneralService() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [step, setStep] = useState(location.state?.step || 1);
  const [formData, setFormData] = useState(() => location.state?.formData || {
    transactionId: '',
    groupType: 'GANG',
    groupName: '',
    requester: '',
    councilMemberId: ''
  });
  const [members, setMembers] = useState(() => location.state?.members || [{ id: 1, value: '' }]);

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
    <div className="max-w-4xl mx-auto py-4 px-2 md:px-0 animate-in fade-in slide-in-from-right-16 duration-700 ease-out">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center">
            <FileText size={28} weight="duotone" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">ระบบให้บริการทั่วไป</h2>
            <p className="text-slate-400 text-sm">บันทึกการทำธุรกรรมทั่วไปของแก๊งและครอบครัว</p>
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
            <p className="text-slate-400 mt-2">กรุณาเลือกประเภทสังกัดที่คุณต้องการดำเนินการ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => { setFormData({...formData, groupType: 'GANG'}); setStep(2); }}
                className="bg-slate-900 border border-slate-800 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-amber-500/50 hover:bg-slate-800/50 transition-all group"
              >
                <div className="w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-black/20">
                  <Buildings size={40} weight="fill" className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-widest">GANG</h2>
              </button>
              
              <button
                type="button"
                onClick={() => { setFormData({...formData, groupType: 'FAMILY'}); setStep(2); }}
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
      <div className="bg-slate-900 rounded-[24px] p-8 md:p-10 shadow-2xl border border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GroupSelect 
                label={<><span className="text-blue-500">1.</span> ชื่อสังกัด (GROUP NAME)</>}
                orgType={formData.groupType}
                value={formData.groupName}
                onChange={val => setFormData({...formData, groupName: val})}
                placeholder="ระบุชื่อแก๊ง หรือ ครอบครัว"
              />

            <div className="space-y-3">
              <label className="text-[15px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <span className="text-blue-500">2.</span> ผู้ทำรายการ (REQUESTER)
              </label>
              <AutocompleteInput 
                placeholder="ชื่อ-นามสกุล (IC)"
                type="text"
                value={formData.requester}
                onChange={val => setFormData({...formData, requester: val})}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <label className="text-[15px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <span className="text-blue-500">3.</span> ธุรกรรมที่ต้องการทำ (TRANSACTION)
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
                <span className="text-blue-500">4.</span> รายชื่อสมาชิก (ที่เกี่ยวข้อง)
              </label>
              <button type="button" onClick={handleAddMember} className="text-sm font-bold bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors shadow-sm">
                <UserPlus size={16} /> เพิ่มรายชื่อ
              </button>
            </div>
            <div className="space-y-3">
              {members.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex-1 relative">
                    <AutocompleteInput 
                      placeholder="ระบุชื่อสมาชิก..." 
                      type="text"
                      value={item.value} 
                      onChange={val => handleMemberChange(item.id, val)} 
                    />
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
              <span className="text-blue-500">5.</span> เจ้าหน้าที่สภาผู้รับเรื่อง (COUNCIL MEMBER)
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
      )}
    </div>
  );
}
