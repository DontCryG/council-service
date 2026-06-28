import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { transactions } from '../../data/models';
import AutocompleteInput from '../../components/ui/AutocompleteInput';

import Button from '../../components/ui/Button';
import GroupSelect from '../../components/ui/GroupSelect';
import { Users, House, Plus, Trash, ArrowRight, WarningCircle, UserPlus, FileText, ArrowLeft, Skull, Buildings, UserCircle } from '@phosphor-icons/react';

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
    const unsub = onSnapshot(doc(db, 'app_state', 'council_members'), (docSnap) => {
      if (docSnap.exists()) {
        setCouncilMembers(docSnap.data().members || []);
      } else {
        setCouncilMembers([]);
      }
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
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in fade-in slide-in-from-right-16 duration-700 ease-out relative">
      {/* Ambient Background Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div className="flex items-center justify-between mb-10 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <FileText size={32} weight="duotone" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ระบบให้บริการทั่วไป</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              บันทึกการทำธุรกรรมทั่วไปของแก๊งและครอบครัว
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => step === 2 ? setStep(1) : navigate('/home')} className="text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-2xl px-5 h-[48px] border border-transparent hover:border-slate-700 transition-all font-bold relative z-10">
          <ArrowLeft size={20} className="mr-2" /> <span className="hidden sm:inline">กลับไปศูนย์บัญชาการ</span>
        </Button>
      </div>
      
      {step === 1 ? (
        <div className="max-w-4xl mx-auto w-full pt-6 relative">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-lg mb-3">เลือกประเภทสังกัด</h1>
            <p className="text-slate-400 font-medium">กรุณาเลือกประเภทสังกัดที่คุณต้องการดำเนินการเพื่อเริ่มต้นทำธุรกรรม</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                type="button"
                onClick={() => { setFormData({...formData, groupType: 'GANG'}); setStep(2); }}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all duration-500 group shadow-xl relative overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-[50px] transition-all duration-500 group-hover:bg-amber-500/20 group-hover:scale-150"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-[50px] transition-all duration-500 group-hover:bg-red-500/20 group-hover:scale-150"></div>
                
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_40px_rgba(245,158,11,0.2)] relative z-10">
                  <Buildings size={48} weight="duotone" className="text-amber-500 drop-shadow-md" />
                </div>
                <div className="relative z-10 text-center">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-widest mb-2">GANG</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">Proceed as Gang</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => { setFormData({...formData, groupType: 'FAMILY'}); setStep(2); }}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-500 group shadow-xl relative overflow-hidden"
              >
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] transition-all duration-500 group-hover:bg-blue-500/20 group-hover:scale-150"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] transition-all duration-500 group-hover:bg-indigo-500/20 group-hover:scale-150"></div>

                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] relative z-10">
                  <Buildings size={48} weight="duotone" className="text-blue-500 drop-shadow-md" />
                </div>
                <div className="relative z-10 text-center">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-widest mb-2">FAMILY</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">Proceed as Family</p>
                </div>
              </button>
          </div>
        </div>
      ) : (
      <div className="bg-slate-900/70 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 shadow-2xl border border-slate-700/50 relative overflow-hidden">
        {/* Subtle decorative blob */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">1</span> ชื่อสังกัด (GROUP NAME) <span className="text-amber-500">*</span>
              </label>
              <GroupSelect 
                label={null}
                orgType={formData.groupType}
                value={formData.groupName}
                onChange={val => setFormData({...formData, groupName: val})}
                placeholder="ระบุชื่อแก๊ง หรือ ครอบครัว"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">2</span> ผู้ทำรายการ (REQUESTER) <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <UserCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                <div className="[&>div]:relative [&>div>div]:pl-12">
                  <AutocompleteInput 
                    placeholder="ชื่อ-นามสกุล (IC)"
                    type="text"
                    value={formData.requester}
                    onChange={val => setFormData({...formData, requester: val})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">3</span> ธุรกรรมที่ต้องการทำ (TRANSACTION) <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <FileText size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <select 
                className="w-full pl-12 bg-slate-950/80 border border-slate-700/50 rounded-2xl pr-4 py-4 text-slate-200 font-bold focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none shadow-inner"
                value={formData.transactionId}
                onChange={e => setFormData({...formData, transactionId: e.target.value})}
                required
              >
                <option value="" disabled>-- กรุณาเลือกรายการ --</option>
                {transactions.map(t => (
                  <option key={t.id} value={t.id} className="font-medium bg-slate-900">
                    {t.name} - ${t.price.toLocaleString()} {t.type === 'per_head' ? '(ต่อหัว)' : '(เหมา)'}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 space-y-6 shadow-inner relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">4</span> รายชื่อสมาชิกที่เกี่ยวข้อง <span className="text-amber-500">*</span>
              </label>
              <button type="button" onClick={handleAddMember} className="text-sm font-bold bg-slate-800 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-xl hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-all shadow-md hover:border-slate-500 group">
                <UserPlus size={18} className="group-hover:text-blue-400 transition-colors" /> เพิ่มรายชื่อ
              </button>
            </div>
            
            <div className="space-y-4 relative z-20">
              {members.map((item, index) => (
                <div key={item.id} className="flex gap-3 group relative" style={{ zIndex: 50 - index }}>
                  <div className="flex-1 relative">
                    <AutocompleteInput 
                      placeholder="ระบุชื่อสมาชิก..." 
                      type="text"
                      value={item.value} 
                      onChange={val => handleMemberChange(item.id, val)} 
                    />
                  </div>
                  <button 
                    type="button" 
                    className={`px-5 border rounded-xl transition-all shadow-sm ${members.length > 1 ? 'bg-slate-900/80 border-slate-700/50 text-red-400 hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-red-500/10 hover:text-red-500' : 'bg-slate-900/50 border-slate-800/50 text-slate-600 cursor-not-allowed'}`} 
                    onClick={() => handleRemoveMember(item.id)} 
                    disabled={members.length === 1}
                  >
                    <Trash size={20} weight={members.length > 1 ? "duotone" : "regular"} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3 relative z-10 shadow-sm backdrop-blur-sm">
              <WarningCircle size={20} className="text-blue-400 mt-0.5 shrink-0" weight="duotone" />
              <p className="text-sm text-blue-200/80 font-medium">หากธุรกรรมคิดเงินเป็น <span className="font-bold text-blue-300">รายหัว</span> ระบบจะนำจำนวนคนไปคูณยอดค่าปรับโดยอัตโนมัติ</p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800/60">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">5</span> เจ้าหน้าที่สภาผู้รับเรื่อง (COUNCIL MEMBER) <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <Users size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <select 
                className="w-full pl-12 bg-slate-950/80 border border-slate-700/50 rounded-2xl pr-4 py-4 text-slate-200 font-bold focus:outline-none focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none shadow-inner"
                value={formData.councilMemberId}
                onChange={e => setFormData({...formData, councilMemberId: e.target.value})}
                required
              >
                <option value="" disabled>-- เลือกเจ้าหน้าที่สภา --</option>
                {councilMembers.map(c => (
                  <option key={c.id} value={c.id} className="font-medium bg-slate-900">{c.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2">
            <Button 
              type="submit" 
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/50 flex justify-center items-center gap-2 text-lg transition-all duration-300 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10">ตรวจสอบข้อมูลก่อนส่ง</span>
              <ArrowRight size={24} weight="bold" className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

        </form>
      </div>
      )}
    </div>
  );
}
