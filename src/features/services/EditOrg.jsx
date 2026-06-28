import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';

import Button from '../../components/ui/Button';
import GroupSelect from '../../components/ui/GroupSelect';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { Skull, House, User, PencilSimple, ArrowLeft, FileText, Check, Link as LinkIcon, ArrowRight, CaretDown, Buildings } from '@phosphor-icons/react';

export default function EditOrg() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [step, setStep] = useState(location.state?.step || 1);
  
  const [formData, setFormData] = useState(location.state?.formData || {
    orgType: 'GANG', // GANG | FAMILY
    orgName: '',
    requester: '',
    councilStaffId: '',
    
    // Transactions
    changeInfo: false,
    editTexture: false,
    addCloth: false,
    bulkChange: false,
    addAccessory: false,
    
    // Details
    textureCount: 1,
    clothCount: 1,
    accessoryCount: 1,
    hexColor: '#000000',
    logoUrl: '',
    extraDetails: ''
  });

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

  // Auto-switch to bulk change
  useEffect(() => {
    let baseCost = 0;
    if (formData.changeInfo) baseCost += 500000;
    if (formData.editTexture) baseCost += (500000 * Math.max(1, formData.textureCount));

    if (baseCost >= 1500000 && !formData.bulkChange) {
      setFormData(prev => ({
        ...prev,
        bulkChange: true,
        changeInfo: false,
        editTexture: false
      }));
      showAlert('info', 'ระบบเลือกเหมาเปลี่ยนข้อมูลให้อัตโนมัติ');
    } else if (formData.bulkChange && (formData.changeInfo || formData.editTexture)) {
      setFormData(prev => ({
        ...prev,
        changeInfo: false,
        editTexture: false
      }));
    }
  }, [formData.changeInfo, formData.editTexture, formData.textureCount, formData.bulkChange, showAlert]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.requester || !formData.councilStaffId) {
      showAlert('error', 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }

    const hasTransaction = formData.changeInfo || formData.editTexture || formData.addCloth || formData.bulkChange || formData.addAccessory;
    if (!hasTransaction) {
      showAlert('error', 'กรุณาเลือกรายการธุรกรรมอย่างน้อย 1 รายการ');
      return;
    }

    if (formData.logoUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(formData.logoUrl) && !formData.logoUrl.includes('discordapp.')) {
      showAlert('error', 'ช่อง Link โลโก้ กรุณาใส่ลิงก์รูปภาพที่ถูกต้อง');
      return;
    }

    navigate('/edit_org_preview', {
      state: { formData }
    });
  };

  const calculateTotal = () => {
    let total = 0;
    if (formData.changeInfo) total += 500000;
    if (formData.editTexture) total += (500000 * Math.max(1, formData.textureCount));
    if (formData.addCloth) total += (500000 * Math.max(1, formData.clothCount));
    if (formData.bulkChange) total += 1500000;
    if (formData.addAccessory) total += 1000000;
    return total;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out relative">
      
      {/* Ambient Background Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none opacity-50 mix-blend-screen"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner relative backdrop-blur-md">
              <PencilSimple size={32} weight="duotone" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ระบบแก้ไขข้อมูลองค์กร</h2>
            <p className="text-amber-400/80 font-medium mt-1">บริการยื่นเรื่องแก้ไขข้อมูลสวัสดิการสังกัด</p>
          </div>
        </div>
        <button 
          onClick={() => step === 2 ? setStep(1) : navigate('/home')} 
          className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-300 px-6 py-3 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-slate-600 backdrop-blur-sm self-start md:self-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/0 via-slate-800/50 to-slate-800/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="relative flex items-center gap-2 font-bold text-sm">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> {step === 2 ? 'ย้อนกลับ' : 'กลับไปศูนย์บัญชาการ'}
          </div>
        </button>
      </div>

      {step === 1 ? (
        <div className="max-w-4xl mx-auto w-full pt-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-widest drop-shadow-sm">เลือกประเภทสังกัด</h1>
            <p className="text-amber-400/60 mt-3 font-medium text-lg">กรุณาเลือกประเภทสังกัดที่คุณต้องการดำเนินการแก้ไข</p>
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
      <div className="bg-slate-950/40 border border-slate-700/50 rounded-[32px] p-6 md:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden z-10 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 opacity-50"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <FileText size={24} weight="duotone" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">บันทึกรายละเอียดการขอแก้ไขข้อมูล</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* 1 & 2. ชื่อสังกัด & ผู้ทำรายการ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-30">
              <div className="space-y-3 relative z-30">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">1</span> ชื่อสังกัด (GROUP NAME) <span className="text-amber-500">*</span>
                </label>
                <GroupSelect 
                  label={null}
                  orgType={formData.orgType}
                  value={formData.orgName}
                  onChange={val => setFormData({...formData, orgName: val})}
                  placeholder="ค้นหาชื่อสังกัด..."
                />
              </div>
              <div className="space-y-3 relative z-20">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">2</span> ชื่อผู้ทำรายการ (REQUESTER) <span className="text-amber-500">*</span>
                </label>
                <AutocompleteInput 
                  label={null}
                  placeholder="พิมพ์เพื่อค้นหาชื่อ-นามสกุล (IC)..."
                  type="text"
                  value={formData.requester}
                  onChange={val => setFormData({...formData, requester: val})}
                />
              </div>
            </div>

            {/* 3. เลือกรายการธุรกรรม */}
            <div className="space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">3</span> เลือกรายการที่ต้องการแก้ไข <span className="text-amber-500">*</span>
                </label>
                <span className="text-[11px] text-amber-500/80 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">*สามารถเลือกได้มากกว่า 1 รายการ</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <label className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${formData.changeInfo ? 'border-amber-500/50 bg-amber-950/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/80'}`}>
                  {formData.changeInfo && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none"></div>}
                  <div className="mt-0.5 relative z-10">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${formData.changeInfo ? 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border border-slate-600 bg-slate-950 group-hover:border-slate-500'}`}>
                       {formData.changeInfo && <Check size={16} weight="bold" />}
                     </div>
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className={`font-black tracking-wide ${formData.changeInfo ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>เปลี่ยนข้อมูล {formData.orgType === 'FAMILY' ? 'Family' : 'Gang'}</div>
                    <div className="text-amber-500 font-bold text-sm mt-1 flex items-center gap-1">500,000 $</div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.changeInfo} onChange={e => setFormData({...formData, changeInfo: e.target.checked})} />
                </label>

                <label className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${formData.editTexture ? 'border-amber-500/50 bg-amber-950/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/80'}`}>
                  {formData.editTexture && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none"></div>}
                  <div className="mt-0.5 relative z-10">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${formData.editTexture ? 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border border-slate-600 bg-slate-950 group-hover:border-slate-500'}`}>
                       {formData.editTexture && <Check size={16} weight="bold" />}
                     </div>
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className={`font-black tracking-wide ${formData.editTexture ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>แก้ไข Texture เสื้อผ้า</div>
                    <div className="text-amber-500 font-bold text-sm mt-1 flex items-center gap-1">500,000 $ <span className="text-slate-500 font-medium text-xs">/ ชุด</span></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.editTexture} onChange={e => setFormData({...formData, editTexture: e.target.checked})} />
                </label>

                <label className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${formData.addCloth ? 'border-amber-500/50 bg-amber-950/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/80'}`}>
                  {formData.addCloth && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none"></div>}
                  <div className="mt-0.5 relative z-10">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${formData.addCloth ? 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border border-slate-600 bg-slate-950 group-hover:border-slate-500'}`}>
                       {formData.addCloth && <Check size={16} weight="bold" />}
                     </div>
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className={`font-black tracking-wide ${formData.addCloth ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>ลงชุดเพิ่ม</div>
                    <div className="text-amber-500 font-bold text-sm mt-1 flex items-center gap-1">500,000 $ <span className="text-slate-500 font-medium text-xs">/ ชุด</span></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.addCloth} onChange={e => setFormData({...formData, addCloth: e.target.checked})} />
                </label>

                <label className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${formData.bulkChange ? 'border-amber-500/50 bg-amber-950/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/80'}`}>
                  {formData.bulkChange && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none"></div>}
                  <div className="mt-0.5 relative z-10">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${formData.bulkChange ? 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border border-slate-600 bg-slate-950 group-hover:border-slate-500'}`}>
                       {formData.bulkChange && <Check size={16} weight="bold" />}
                     </div>
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className={`font-black tracking-wide ${formData.bulkChange ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>เหมาเปลี่ยนข้อมูล {formData.orgType === 'FAMILY' ? 'Family' : 'Gang'}</div>
                    <div className="text-amber-500 font-bold text-sm mt-1 flex items-center gap-1">1,500,000 $</div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.bulkChange} onChange={e => setFormData({...formData, bulkChange: e.target.checked})} />
                </label>

                <label className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden md:col-span-2 ${formData.addAccessory ? 'border-amber-500/50 bg-amber-950/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/80'}`}>
                  {formData.addAccessory && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none"></div>}
                  <div className="mt-0.5 relative z-10">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${formData.addAccessory ? 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border border-slate-600 bg-slate-950 group-hover:border-slate-500'}`}>
                       {formData.addAccessory && <Check size={16} weight="bold" />}
                     </div>
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className={`font-black tracking-wide ${formData.addAccessory ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>ลง Accessories Addons เสริม</div>
                    <div className="text-amber-500 font-bold text-sm mt-1 flex items-center gap-1">1,000,000 $</div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.addAccessory} onChange={e => setFormData({...formData, addAccessory: e.target.checked})} />
                </label>
              </div>
            </div>

            {/* 4. ระบุรายละเอียดเพิ่มเติมการแก้ไข */}
            <div className="space-y-6 pt-8 border-t border-slate-800/60 relative z-10">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">4</span> ระบุรายละเอียดเพิ่มเติมการแก้ไข
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {/* Texture Count */}
                 {formData.editTexture && (
                   <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                     <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">จำนวนชุด (แก้ TEXTURE) <span className="text-amber-500 font-medium normal-case ml-1">*มีผลต่อราคา</span></div>
                     <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden h-14 shadow-inner">
                       <button type="button" onClick={() => setFormData(p => ({...p, textureCount: Math.max(1, p.textureCount - 1)}))} className="w-16 h-full flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 font-black text-lg transition-colors">-</button>
                       <div className="flex-1 text-center font-black text-white text-xl">{formData.textureCount}</div>
                       <button type="button" onClick={() => setFormData(p => ({...p, textureCount: p.textureCount + 1}))} className="w-16 h-full flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 font-black text-lg transition-colors">+</button>
                     </div>
                   </div>
                 )}

                 {/* Cloth Count */}
                 {formData.addCloth && (
                   <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                     <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">จำนวนชุด (ลงใหม่) <span className="text-amber-500 font-medium normal-case ml-1">*มีผลต่อราคา</span></div>
                     <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden h-14 shadow-inner">
                       <button type="button" onClick={() => setFormData(p => ({...p, clothCount: Math.max(1, p.clothCount - 1)}))} className="w-16 h-full flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 font-black text-lg transition-colors">-</button>
                       <div className="flex-1 text-center font-black text-white text-xl">{formData.clothCount}</div>
                       <button type="button" onClick={() => setFormData(p => ({...p, clothCount: p.clothCount + 1}))} className="w-16 h-full flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 font-black text-lg transition-colors">+</button>
                     </div>
                   </div>
                 )}

                 {/* HEX Color */}
                 <div className="space-y-3">
                   <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">รหัสสี (HEX COLOR) <span className="text-amber-500/80 font-medium normal-case ml-1">*ถ้าเปลี่ยนสี</span></div>
                   <div className="flex items-center gap-3">
                     <div className="w-14 h-14 rounded-xl border-2 border-slate-700 shadow-inner shrink-0 transition-colors duration-300" style={{ backgroundColor: formData.hexColor || '#000000', borderColor: formData.hexColor || '#334155' }}></div>
                     <input type="text" className="w-full h-14 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-all font-bold shadow-inner" value={formData.hexColor} onChange={e => setFormData({...formData, hexColor: e.target.value})} placeholder="#FFFFFF" />
                   </div>
                 </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-3">
                 <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">แนบลิงก์รูปภาพโลโก้ใหม่ (LOGO URL)</div>
                 <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 h-14 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all shadow-inner">
                   <LinkIcon size={20} className="text-slate-500 mr-3 shrink-0" weight="duotone" />
                   <input type="text" className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none font-bold" placeholder="https://imgur.com/... หรือ ลิงก์รูปจาก Discord" value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} />
                 </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                 <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">รายละเอียดสิ่งที่ต้องการแก้ (NOTES)</div>
                 <textarea className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl p-5 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none min-h-[140px] transition-all font-bold shadow-inner leading-relaxed" placeholder={`เช่น เพิ่มลายเสื้อด้านหลัง, เปลี่ยนโลโก้${formData.orgType === 'FAMILY' ? 'ครอบครัว' : 'แก๊ง'}...`} value={formData.extraDetails} onChange={e => setFormData({...formData, extraDetails: e.target.value})}></textarea>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-900/80 rounded-[24px] p-6 sm:p-8 flex items-center justify-between mt-10 shadow-inner border border-amber-500/20 relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-amber-500/10 to-transparent skew-x-12 translate-x-10 group-hover:-translate-x-10 transition-transform duration-1000"></div>
              <div className="relative z-10">
                <div className="font-black text-white text-lg sm:text-2xl tracking-wide drop-shadow-sm">ยอดรวมเบื้องต้น</div>
                <div className="text-[10px] sm:text-xs text-amber-500/80 tracking-widest uppercase mt-1 font-bold">Estimated Total</div>
              </div>
              <div className="relative z-10 text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tight flex items-baseline gap-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                {calculateTotal().toLocaleString()} <span className="text-2xl sm:text-3xl text-amber-500">$</span>
              </div>
            </div>

            {/* 5. เจ้าหน้าที่รับเรื่อง */}
            <div className="space-y-4 pt-8 border-t border-slate-800/60 relative z-10">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">5</span> เจ้าหน้าที่สภาผู้รับเรื่อง (COUNCIL MEMBER) <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-slate-500" weight="duotone" />
                </div>
                <select 
                  required
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-12 pr-10 py-4 text-white appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all cursor-pointer font-bold shadow-inner"
                  value={formData.councilStaffId}
                  onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
                >
                  <option value="" disabled>-- กำลังโหลดรายชื่อเจ้าหน้าที่สภา --</option>
                  {councilMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <CaretDown size={16} className="text-slate-500" />
                </div>
              </div>
            </div>

            <div className="pt-4 relative z-10">
              <button 
                type="submit" 
                className="w-full h-16 text-lg font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-2xl flex items-center justify-center gap-3 transition-all duration-300"
              >
                คำนวณยอดและตรวจสอบใบเสร็จ <ArrowRight size={24} weight="bold" />
              </button>
            </div>
            
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
