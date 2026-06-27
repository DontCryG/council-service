import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';

import Button from '../../components/ui/Button';
import GroupSelect from '../../components/ui/GroupSelect';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { Trash, ArrowRight, ArrowsLeftRight, Car, Crosshair, ArrowLeft, Users, House, Skull, Buildings } from '@phosphor-icons/react';

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
    if (items.some(i => !i.name.trim())) {
      showAlert('error', 'กรุณาระบุข้อมูลสิ่งของที่จะแลกเปลี่ยนให้ครบ');
      return;
    }
    navigate('/welfare_trade_preview', {
      state: { formData, items }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 md:px-0 animate-in fade-in slide-in-from-right-16 duration-700 ease-out">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <ArrowsLeftRight size={28} weight="duotone" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">ระบบเทรดสวัสดิการ</h2>
            <p className="text-slate-400 text-sm">บริการแลกเปลี่ยนและจัดการสวัสดิการขององค์กร</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : navigate('/home')} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
          <ArrowLeft size={20} /> <span className="hidden sm:inline">กลับไปศูนย์บัญชาการ</span>
        </Button>
      </div>

      {step === 1 && (
        <div className="max-w-4xl mx-auto w-full mt-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-widest">เลือกประเภทสังกัด</h1>
            <p className="text-slate-400 mt-2">กรุณาเลือกประเภทสังกัดที่คุณต้องการดำเนินการ</p>
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
      )}

      {step === 2 && (
        <div className="max-w-4xl mx-auto w-full mt-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-widest">เลือกประเภทการเทรด</h1>
            <p className="text-slate-400 mt-2">กรุณาเลือกสิ่งที่คุณต้องการแลกเปลี่ยนสวัสดิการ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => { setFormData({...formData, tradeType: 'VEHICLE', pricingType: '300,000'}); setStep(3); }}
              className="bg-slate-900 border border-slate-800 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-24 h-24 rounded-full bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/20">
                <Car size={40} weight="fill" className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest">โอนย้ายรถ (VEHICLE)</h2>
            </button>
            
            <button
              type="button"
              onClick={() => { setFormData({...formData, tradeType: 'WEAPON', pricingType: 'ออกปกติ (1.5M / ชิ้น)'}); setStep(3); }}
              className="bg-slate-900 border border-slate-800 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-red-500/50 hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-24 h-24 rounded-full bg-red-900/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/20">
                <Crosshair size={40} weight="fill" className="text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest">โอนย้ายอาวุธ (WEAPON)</h2>
            </button>
          </div>
        </div>
      )}
      
      {step === 3 && (
      <div className="max-w-4xl mx-auto w-full bg-slate-900 rounded-[24px] p-8 md:p-10 shadow-2xl border border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-8">
          

          {formData.tradeType === 'WEAPON' && (
            <div className="space-y-3">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                1. รูปแบบการออก (PRICING TYPE)
              </label>
              <select 
                className="w-full bg-slate-950 border border-red-500/30 rounded-xl px-4 py-3.5 text-slate-200 font-bold focus:outline-none focus:border-red-500 focus:bg-slate-900 transition-colors"
                value={formData.pricingType}
                onChange={e => setFormData({...formData, pricingType: e.target.value})}
              >
                <option value="ออกปกติ (1.5M / ชิ้น)">ออกปกติ (1.5M / ชิ้น)</option>
                <option value="ออกลอย (2.0M / ชิ้น)">ออกลอย (2.0M / ชิ้น)</option>
              </select>
              <p className="text-red-400 text-xs font-medium mt-1">* กรุณาเลือกประเภทให้ถูกต้องเพื่อการคำนวณราคา</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <GroupSelect 
                label={`${formData.tradeType === 'WEAPON' ? '2' : '1'}. ชื่อ GANG / FAMILY`}
                orgType={formData.orgType}
                value={formData.orgName}
                onChange={val => setFormData({...formData, orgName: val})}
                placeholder="ระบุชื่อสังกัด"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                {formData.tradeType === 'WEAPON' ? '3' : '2'}. สภาที่รับเรื่อง
              </label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 font-medium focus:outline-none focus:border-violet-500 focus:bg-slate-900 focus:ring-1 focus:ring-violet-500 transition-colors appearance-none"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
              <div className="space-y-3">
                <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                  {formData.tradeType === 'WEAPON' ? '4' : '3'}. {formData.tradeType === 'WEAPON' ? 'ผู้ส่งมอบ (คนเก่า)' : 'ผู้ถือรถ (คนเก่า)'}
                </label>
                <AutocompleteInput 
                  placeholder={formData.tradeType === 'WEAPON' ? 'ชื่อผู้ถืออาวุธเดิม' : 'ชื่อเจ้าของรถเดิม'}
                  type="text"
                  value={formData.oldOwner}
                  onChange={val => setFormData({...formData, oldOwner: val})}
                />
              </div>
              <div className="space-y-3 pt-2">
                <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                  เบอร์โทรศัพท์คนเก่า (6 หลัก)
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 transition-all focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
                  <Phone size={20} className="text-slate-500 mr-3 shrink-0" />
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none font-medium"
                    value={formData.oldOwnerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, oldOwnerPhone: val});
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
              <div className="space-y-3">
                <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                  {formData.tradeType === 'WEAPON' ? '5' : '4'}. {formData.tradeType === 'WEAPON' ? 'ผู้รับมอบ (คนใหม่)' : 'ผู้รับรถ (คนใหม่)'}
                </label>
                <AutocompleteInput 
                  placeholder={formData.tradeType === 'WEAPON' ? 'ชื่อผู้รับอาวุธ' : 'ชื่อผู้รับรถ'}
                  type="text"
                  value={formData.newOwner}
                  onChange={val => setFormData({...formData, newOwner: val})}
                />
              </div>
              <div className="space-y-3 pt-2">
                <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                  เบอร์โทรศัพท์คนใหม่ (6 หลัก)
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 transition-all focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
                  <Phone size={20} className="text-slate-500 mr-3 shrink-0" />
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none font-medium"
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

          <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[14px] font-bold text-slate-300 tracking-wide">
                {formData.tradeType === 'WEAPON' ? '6' : '5'}. {formData.tradeType === 'WEAPON' ? 'รายการอาวุธ (WEAPON LIST)' : 'ข้อมูลรถที่เทรด (300,000 ต่อคัน)'}
              </label>
              <button type="button" onClick={handleAddItem} className="px-4 py-2 text-sm font-bold text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-2">
                + {formData.tradeType === 'WEAPON' ? 'เพิ่มรายการ' : 'เพิ่มคัน'}
              </button>
            </div>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <input 
                    placeholder={formData.tradeType === 'VEHICLE' ? 'ชื่อรถ' : 'ชื่ออาวุธ (เช่น Pistol MK2)'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 focus:bg-slate-900 transition-colors placeholder:text-slate-600" 
                    value={item.name} 
                    onChange={e => handleItemChange(item.id, 'name', e.target.value)} 
                    required 
                  />
                  <input 
                    placeholder={formData.tradeType === 'VEHICLE' ? 'ทะเบียน' : 'หมายเหตุ/Serial'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 focus:bg-slate-900 transition-colors placeholder:text-slate-600" 
                    value={item.detail} 
                    onChange={e => handleItemChange(item.id, 'detail', e.target.value)} 
                  />
                  <button type="button" className={`px-4 rounded-lg transition-colors bg-slate-950 ${items.length > 1 ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-600 cursor-not-allowed'}`} onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1}>
                    <Trash size={20}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 rounded-xl py-4 text-lg">
              ดำเนินการต่อ (ตรวจสอบข้อมูล) <ArrowRight size={20} className="ml-2 inline" />
            </Button>
          </div>

        </form>
      </div>
      )}
    </div>
  );
}
