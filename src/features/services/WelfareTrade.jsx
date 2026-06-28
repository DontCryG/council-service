import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';

import Button from '../../components/ui/Button';
import GroupSelect from '../../components/ui/GroupSelect';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { Trash, ArrowRight, ArrowsLeftRight, Car, Crosshair, ArrowLeft, Users, House, Skull, Buildings, Phone } from '@phosphor-icons/react';

export default function WelfareTrade() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [step, setStep] = useState(location.state?.step || 1);
  
  const [formData, setFormData] = useState(location.state?.formData || {
    tradeType: 'VEHICLE', // VEHICLE | WEAPON
    orgType: 'GANG', // GANG | FAMILY
    orgName: '',
    oldOwner: '',
    oldOwnerPhone: '',
    newOwner: '',
    newOwnerPhone: '',
    councilStaffId: '',
    pricingType: '300,000'
  });
  
  const [items, setItems] = useState(location.state?.items || [{ id: 1, name: '', detail: '' }]);

  // Load Council Members
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

  const handleAddItem = () => setItems([...items, { id: Date.now(), name: '', detail: '' }]);
  const handleRemoveItem = (id) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };
  const handleItemChange = (id, field, val) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.oldOwner || !formData.newOwner || !formData.councilStaffId || !formData.oldOwnerPhone || !formData.newOwnerPhone) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (formData.oldOwnerPhone.length !== 6 || formData.newOwnerPhone.length !== 6) {
      showAlert('error', 'กรุณาระบุเบอร์โทรศัพท์เป็นตัวเลข 6 หลักทั้งสองเบอร์');
      return;
    }
    if (items.some(i => !i.name.trim() || !i.detail.trim())) {
      showAlert('error', 'กรุณาระบุชื่อสิ่งของและรายละเอียด/ทะเบียนให้ครบทุกรายการ');
      return;
    }
    navigate('/welfare_trade_preview', {
      state: { formData, items }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in fade-in slide-in-from-right-16 duration-700 ease-out relative">
      {/* Ambient Background Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none opacity-50 mix-blend-screen"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 rounded-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-900/40 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-inner relative backdrop-blur-md">
              <ArrowsLeftRight size={32} weight="duotone" className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ระบบเทรดสวัสดิการ</h2>
            <p className="text-violet-400/80 font-medium mt-1">บริการแลกเปลี่ยนและจัดการสวัสดิการขององค์กร</p>
          </div>
        </div>
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/home')} 
          className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-300 px-6 py-3 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-slate-600 backdrop-blur-sm self-start md:self-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/0 via-slate-800/50 to-slate-800/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="relative flex items-center gap-2 font-bold text-sm">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> {step > 1 ? 'ย้อนกลับ' : 'กลับไปศูนย์บัญชาการ'}
          </div>
        </button>
      </div>

      {step === 1 && (
        <div className="max-w-4xl mx-auto w-full pt-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-widest drop-shadow-sm">เลือกประเภทสังกัด</h1>
            <p className="text-violet-400/60 mt-3 font-medium text-lg">กรุณาเลือกประเภทสังกัดที่คุณต้องการดำเนินการ</p>
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
      )}

      {step === 2 && (
        <div className="max-w-4xl mx-auto w-full pt-4 relative z-10 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-widest drop-shadow-sm">เลือกประเภทการเทรด</h1>
            <p className="text-violet-400/60 mt-3 font-medium text-lg">กรุณาเลือกสิ่งที่คุณต้องการแลกเปลี่ยนสวัสดิการ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-12">
            <button
              type="button"
              onClick={() => { setFormData({...formData, tradeType: 'VEHICLE', pricingType: '300,000'}); setStep(3); }}
              className="relative overflow-hidden bg-slate-950/40 border border-slate-800 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-blue-500/50 transition-all duration-500 group backdrop-blur-xl shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative w-32 h-32 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-blue-500/30 group-hover:bg-blue-950/30 shadow-inner">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Car size={56} weight="duotone" className="text-blue-600 group-hover:text-blue-400 transition-colors duration-300 relative z-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-300 group-hover:text-blue-400 tracking-widest transition-colors duration-300 relative z-10 text-center">โอนย้ายรถ (VEHICLE)</h2>
            </button>
            
            <button
              type="button"
              onClick={() => { setFormData({...formData, tradeType: 'WEAPON', pricingType: 'ออกปกติ (1.5M / ชิ้น)'}); setStep(3); }}
              className="relative overflow-hidden bg-slate-950/40 border border-slate-800 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:border-red-500/50 transition-all duration-500 group backdrop-blur-xl shadow-2xl hover:shadow-red-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative w-32 h-32 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-red-500/30 group-hover:bg-red-950/30 shadow-inner">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Crosshair size={56} weight="duotone" className="text-red-600 group-hover:text-red-400 transition-colors duration-300 relative z-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-300 group-hover:text-red-400 tracking-widest transition-colors duration-300 relative z-10 text-center">โอนย้ายอาวุธ (WEAPON)</h2>
            </button>
          </div>
        </div>
      )}
      
      {step === 3 && (
      <div className="bg-slate-950/40 border border-slate-700/50 rounded-[32px] p-6 md:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden z-10 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-indigo-500 opacity-50"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          
          {formData.tradeType === 'WEAPON' && (
            <div className="space-y-3 relative z-40">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">1</span> รูปแบบการออก (PRICING TYPE) <span className="text-amber-500">*</span>
              </label>
              <select 
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 text-slate-200 font-bold focus:outline-none focus:border-red-500 focus:bg-slate-900 focus:ring-1 focus:ring-red-500/50 transition-all shadow-inner"
                value={formData.pricingType}
                onChange={e => setFormData({...formData, pricingType: e.target.value})}
              >
                <option value="ออกปกติ (1.5M / ชิ้น)">ออกปกติ (1.5M / ชิ้น)</option>
                <option value="ออกลอย (2.0M / ชิ้น)">ออกลอย (2.0M / ชิ้น)</option>
              </select>
              <p className="text-red-400/80 text-[11px] font-bold mt-1 uppercase tracking-wide flex items-center gap-1"><Crosshair size={14}/> * กรุณาเลือกประเภทให้ถูกต้องเพื่อการคำนวณราคา</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-30">
            <div className="space-y-3 relative z-30">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">{formData.tradeType === 'WEAPON' ? '2' : '1'}</span> ชื่อ GANG / FAMILY <span className="text-amber-500">*</span>
              </label>
              <GroupSelect 
                label={null}
                orgType={formData.orgType}
                value={formData.orgName}
                onChange={val => setFormData({...formData, orgName: val})}
                placeholder="ระบุชื่อสังกัด"
              />
            </div>
            <div className="space-y-3 relative z-20">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">{formData.tradeType === 'WEAPON' ? '3' : '2'}</span> สภาที่รับเรื่อง <span className="text-amber-500">*</span>
              </label>
              <select 
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 text-slate-200 font-bold focus:outline-none focus:border-violet-500 focus:bg-slate-900 focus:ring-1 focus:ring-violet-500/50 transition-all shadow-inner"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-20">
            
            {/* Old Owner Card */}
            <div className="bg-slate-950/40 border border-slate-700/50 rounded-[24px] p-6 shadow-inner relative z-20 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">{formData.tradeType === 'WEAPON' ? '4' : '3'}</span> {formData.tradeType === 'WEAPON' ? 'ผู้ส่งมอบ (คนเก่า)' : 'ผู้ถือรถ (คนเก่า)'} <span className="text-amber-500">*</span>
                  </label>
                  <AutocompleteInput 
                    placeholder={formData.tradeType === 'WEAPON' ? 'ชื่อผู้ถืออาวุธเดิม' : 'ชื่อเจ้าของรถเดิม'}
                    type="text"
                    value={formData.oldOwner}
                    onChange={val => setFormData({...formData, oldOwner: val})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    เบอร์โทรศัพท์ (6 หลัก)
                  </label>
                  <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3.5 transition-all focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 shadow-inner">
                    <Phone size={20} className="text-slate-500 mr-3 shrink-0" weight="duotone" />
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none font-medium"
                      value={formData.oldOwnerPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({...formData, oldOwnerPhone: val});
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* New Owner Card */}
            <div className="bg-slate-950/40 border border-slate-700/50 rounded-[24px] p-6 shadow-inner relative z-10 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">{formData.tradeType === 'WEAPON' ? '5' : '4'}</span> {formData.tradeType === 'WEAPON' ? 'ผู้รับมอบ (คนใหม่)' : 'ผู้รับรถ (คนใหม่)'} <span className="text-amber-500">*</span>
                  </label>
                  <AutocompleteInput 
                    placeholder={formData.tradeType === 'WEAPON' ? 'ชื่อผู้รับอาวุธ' : 'ชื่อผู้รับรถ'}
                    type="text"
                    value={formData.newOwner}
                    onChange={val => setFormData({...formData, newOwner: val})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    เบอร์โทรศัพท์ (6 หลัก)
                  </label>
                  <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3.5 transition-all focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 shadow-inner">
                    <Phone size={20} className="text-slate-500 mr-3 shrink-0" weight="duotone" />
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none font-medium"
                      value={formData.newOwnerPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({...formData, newOwnerPhone: val});
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-slate-950/40 border border-slate-700/50 rounded-[24px] p-6 md:p-8 shadow-inner relative z-10 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-bl-full pointer-events-none group-hover:bg-violet-500/10 transition-colors"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">{formData.tradeType === 'WEAPON' ? '6' : '5'}</span> {formData.tradeType === 'WEAPON' ? 'รายการอาวุธ (WEAPON LIST)' : 'ข้อมูลรถที่เทรด (300,000 ต่อคัน)'}
              </label>
              <button type="button" onClick={handleAddItem} className="text-sm font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-4 py-2 rounded-xl hover:bg-violet-500 hover:text-white transition-all shadow-sm hover:shadow-violet-500/20 whitespace-nowrap shrink-0">
                + {formData.tradeType === 'WEAPON' ? 'เพิ่มรายการ' : 'เพิ่มคัน'}
              </button>
            </div>
            
            <div className="space-y-4 relative z-10">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center group/item">
                  <div className="flex-1 flex gap-2 relative">
                    <input 
                      placeholder={formData.tradeType === 'VEHICLE' ? 'ชื่อรถ' : 'ชื่ออาวุธ (เช่น Pistol MK2)'}
                      className="w-1/2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-bold focus:outline-none focus:border-violet-500 focus:bg-slate-900 focus:ring-1 focus:ring-violet-500/50 placeholder:text-slate-500 shadow-inner transition-all" 
                      value={item.name} 
                      onChange={e => handleItemChange(item.id, 'name', e.target.value)} 
                      required 
                    />
                    <input 
                      placeholder={formData.tradeType === 'VEHICLE' ? 'ทะเบียน' : 'หมายเหตุ/Serial'}
                      className="w-1/2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-bold focus:outline-none focus:border-violet-500 focus:bg-slate-900 focus:ring-1 focus:ring-violet-500/50 placeholder:text-slate-500 shadow-inner transition-all uppercase" 
                      value={item.detail} 
                      onChange={e => handleItemChange(item.id, 'detail', e.target.value)} 
                    />
                  </div>
                  <button type="button" className={`w-10 h-10 shrink-0 flex items-center justify-center bg-slate-900/50 border border-slate-800 rounded-xl transition-all shadow-sm ${items.length > 1 ? 'text-slate-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10' : 'text-slate-700 cursor-not-allowed border-slate-800/50'}`} onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1}>
                    <Trash size={18} weight="duotone" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/60 relative z-10">
            <button 
              type="submit" 
              className="w-full h-16 text-lg font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white rounded-2xl flex items-center justify-center gap-3 transition-all duration-300"
            >
               ดำเนินการต่อ (ตรวจสอบข้อมูล) <ArrowRight size={24} weight="bold" />
            </button>
          </div>

        </form>
      </div>
      )}
    </div>
  );
}
