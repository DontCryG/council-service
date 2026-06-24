import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

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
    if (formData.addCloth) total += (500000 * Math.max(1, formData.textureCount));
    if (formData.bulkChange) total += 1500000;
    if (formData.addAccessory) total += 1000000;
    return total;
  };

  return (
    <div className="max-w-[800px] mx-auto py-4 px-2 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      
      {/* Top Header */}
      <div className="text-center mb-10 relative mt-4">
        <Button variant="ghost" onClick={() => step === 2 ? setStep(1) : navigate('/home')} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
          <ArrowLeft size={20} className="mr-2" /> <span className="hidden sm:inline">กลับไปศูนย์บัญชาการ</span>
        </Button>
      </div>

      {step === 1 ? (
        <div className="max-w-4xl mx-auto w-full pt-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-widest">เลือกประเภทสังกัด</h1>
            <p className="text-slate-400 mt-2">กรุณาเลือกประเภทสังกัดที่คุณต้องการดำเนินการแก้ไข</p>
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
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden text-white relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0"></div>
        
        <div className="p-6 sm:p-10">
          
          <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FileText size={24} weight="duotone" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">บันทึกรายละเอียดการขอแก้ไขข้อมูล</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* 1 & 2. ชื่อสังกัด & ผู้ทำรายการ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <GroupSelect 
                label="1. ชื่อสังกัด (GROUP NAME)"
                orgType={formData.orgType}
                value={formData.orgName}
                onChange={val => setFormData({...formData, orgName: val})}
                placeholder="ค้นหาชื่อสังกัด..."
              />
              <AutocompleteInput 
                label="2. ชื่อผู้ทำรายการ (REQUESTER)"
                placeholder="พิมพ์เพื่อค้นหาชื่อ-นามสกุล (IC)..."
                type="text"
                value={formData.requester}
                onChange={val => setFormData({...formData, requester: val})}
              />
            </div>

            {/* 4. เลือกรายการธุรกรรม */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <h3 className="font-bold text-lg">4. เลือกรายการที่ต้องการแก้ไข</h3>
                <span className="text-xs text-slate-500 font-medium">*เลือกได้มากกว่า 1 รายการ</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.changeInfo ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'}`}>
                  <div className="mt-1">
                     <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.changeInfo ? 'bg-amber-500 border-amber-500' : 'border border-slate-600'}`}>
                       {formData.changeInfo && <Check size={14} weight="bold" className="text-slate-900" />}
                     </div>
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-[15px] ${formData.changeInfo ? 'text-white' : 'text-slate-300'}`}>เปลี่ยนข้อมูล {formData.orgType === 'FAMILY' ? 'Family' : 'Gang'}</div>
                    <div className="text-amber-500 font-bold text-sm mt-0.5">500,000 $</div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.changeInfo} onChange={e => setFormData({...formData, changeInfo: e.target.checked})} />
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.editTexture ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'}`}>
                  <div className="mt-1">
                     <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.editTexture ? 'bg-amber-500 border-amber-500' : 'border border-slate-600'}`}>
                       {formData.editTexture && <Check size={14} weight="bold" className="text-slate-900" />}
                     </div>
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-[15px] ${formData.editTexture ? 'text-white' : 'text-slate-300'}`}>แก้ไข Texture เสื้อผ้า</div>
                    <div className="text-amber-500 font-bold text-sm mt-0.5">500,000 $ <span className="text-slate-500 font-medium text-xs">/ ชุด</span></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.editTexture} onChange={e => setFormData({...formData, editTexture: e.target.checked})} />
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.addCloth ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'}`}>
                  <div className="mt-1">
                     <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.addCloth ? 'bg-amber-500 border-amber-500' : 'border border-slate-600'}`}>
                       {formData.addCloth && <Check size={14} weight="bold" className="text-slate-900" />}
                     </div>
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-[15px] ${formData.addCloth ? 'text-white' : 'text-slate-300'}`}>ลงชุดเพิ่ม</div>
                    <div className="text-amber-500 font-bold text-sm mt-0.5">500,000 $ <span className="text-slate-500 font-medium text-xs">/ ชุด</span></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.addCloth} onChange={e => setFormData({...formData, addCloth: e.target.checked})} />
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.bulkChange ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'}`}>
                  <div className="mt-1">
                     <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.bulkChange ? 'bg-amber-500 border-amber-500' : 'border border-slate-600'}`}>
                       {formData.bulkChange && <Check size={14} weight="bold" className="text-slate-900" />}
                     </div>
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-[15px] ${formData.bulkChange ? 'text-white' : 'text-slate-300'}`}>เหมาเปลี่ยนข้อมูล {formData.orgType === 'FAMILY' ? 'Family' : 'Gang'}</div>
                    <div className="text-amber-500 font-bold text-sm mt-0.5">1,500,000 $</div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.bulkChange} onChange={e => setFormData({...formData, bulkChange: e.target.checked})} />
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all sm:col-span-2 ${formData.addAccessory ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'}`}>
                  <div className="mt-1">
                     <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.addAccessory ? 'bg-amber-500 border-amber-500' : 'border border-slate-600'}`}>
                       {formData.addAccessory && <Check size={14} weight="bold" className="text-slate-900" />}
                     </div>
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-[15px] ${formData.addAccessory ? 'text-white' : 'text-slate-300'}`}>ลง Accessories Adons เสริม</div>
                    <div className="text-amber-500 font-bold text-sm mt-0.5">1,000,000 $</div>
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.addAccessory} onChange={e => setFormData({...formData, addAccessory: e.target.checked})} />
                </label>
              </div>
            </div>

            {/* 5. ระบุรายละเอียดเพิ่มเติมการแก้ไข */}
            <div className="space-y-6 pt-8 border-t border-slate-800/80">
              <div className="flex items-center gap-3 mb-6">
                 <div className="text-amber-500"><PencilSimple size={20} weight="duotone" /></div>
                 <label className="text-sm font-black text-slate-300 uppercase tracking-wide">
                   5. ระบุรายละเอียดเพิ่มเติมการแก้ไข
                 </label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {/* Texture Count */}
                 <div className="space-y-3">
                   <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">จำนวนชุด (TEXTURE) <span className="text-slate-400 font-medium normal-case ml-1">*มีผลต่อราคา</span></div>
                   <div className="flex items-center bg-slate-950/50 border border-slate-700 rounded-xl overflow-hidden h-12 shadow-inner">
                     <button type="button" onClick={() => setFormData(p => ({...p, textureCount: Math.max(1, p.textureCount - 1)}))} className="w-14 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition-colors">-</button>
                     <div className="flex-1 text-center font-bold text-white text-lg">{formData.textureCount}</div>
                     <button type="button" onClick={() => setFormData(p => ({...p, textureCount: p.textureCount + 1}))} className="w-14 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition-colors">+</button>
                   </div>
                 </div>

                 {/* HEX Color */}
                 <div className="space-y-3">
                   <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">รหัสสี (HEX COLOR) <span className="text-slate-400 font-medium normal-case ml-1">*ถ้าเปลี่ยนสี</span></div>
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl border border-slate-700 shadow-inner shrink-0" style={{ backgroundColor: formData.hexColor || '#000000' }}></div>
                     <input type="text" className="w-full h-12 bg-slate-950 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all font-medium" value={formData.hexColor} onChange={e => setFormData({...formData, hexColor: e.target.value})} placeholder="#FFFFFF" />
                   </div>
                 </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-3">
                 <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">แนบลิงก์รูปภาพโลโก้ใหม่ (LOGO URL)</div>
                 <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-4 h-12 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                   <LinkIcon size={18} className="text-slate-500 mr-3 shrink-0" />
                   <input type="text" className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none font-medium" placeholder="https://imgur.com/... หรือ ลิงก์รูปจาก Discord" value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} />
                 </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                 <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">รายละเอียดสิ่งที่ต้องการแก้ (NOTES)</div>
                 <textarea className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none min-h-[120px] transition-all font-medium" placeholder={`เช่น เพิ่มลายเสื้อด้านหลัง, เปลี่ยนโลโก้${formData.orgType === 'FAMILY' ? 'ครอบครัว' : 'แก๊ง'}...`} value={formData.extraDetails} onChange={e => setFormData({...formData, extraDetails: e.target.value})}></textarea>
              </div>
            </div>

            {/* Total */}
            <div className="bg-[#0b0f19] rounded-2xl p-6 sm:p-8 flex items-center justify-between mt-8 shadow-inner border border-slate-800/50 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-32 bg-amber-500/5 skew-x-12 translate-x-10"></div>
              <div className="relative z-10">
                <div className="font-black text-white text-lg sm:text-xl tracking-wide">ยอดรวมเบื้องต้น</div>
                <div className="text-[10px] sm:text-xs text-slate-500 tracking-widest uppercase mt-1 font-bold">Estimated Total</div>
              </div>
              <div className="relative z-10 text-3xl sm:text-5xl font-black text-amber-500 tracking-tight flex items-baseline gap-2">
                {calculateTotal().toLocaleString()} <span className="text-xl sm:text-3xl text-amber-600">$</span>
              </div>
            </div>

            {/* 6. เจ้าหน้าที่รับเรื่อง */}
            <div className="space-y-4 pt-8 border-t border-slate-800/80">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                6. เจ้าหน้าที่สภาผู้รับเรื่อง (COUNCIL MEMBER)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-slate-500" />
                </div>
                <select 
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-10 py-4 text-white appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer font-medium"
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

            <Button type="submit" size="lg" className="w-full bg-[#0b0f19] hover:bg-black border border-slate-800 hover:border-slate-700 text-white rounded-2xl py-5 text-base sm:text-lg font-bold flex items-center justify-center gap-3 shadow-xl transition-all mt-4 group">
              คำนวณยอดและตรวจสอบใบเสร็จ <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1.5 transition-transform text-amber-500" />
            </Button>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
