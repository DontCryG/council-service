import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

import Button from '../../components/ui/Button';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { Skull, House, User, PencilSimple, ArrowLeft, FileText, Check, Link as LinkIcon, ArrowRight, CaretDown } from '@phosphor-icons/react';

export default function EditOrg() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  
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
        <Button variant="ghost" onClick={() => navigate('/home')} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl hidden sm:flex">
          <ArrowLeft size={20} /> <span className="hidden md:inline">กลับ</span>
        </Button>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase">
          MODIFICATION <span className="text-amber-500">SERVICE</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-3 font-medium tracking-wide">ระบบแจ้งแก้ไขข้อมูลสังกัดและออกใบเสร็จรับเงินอย่างเป็นทางการ</p>
      </div>

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
            
            {/* 1. ประเภทสังกัด */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                1. ประเภทสังกัด (GROUP TYPE)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, orgType: 'GANG'})}
                  className={`flex flex-col items-center justify-center gap-4 py-8 rounded-2xl border-2 transition-all group relative overflow-hidden
                    ${formData.orgType === 'GANG' 
                      ? 'border-amber-500 bg-amber-500/5' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${formData.orgType === 'GANG' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                    <Skull size={32} weight={formData.orgType === 'GANG' ? 'fill' : 'regular'} />
                  </div>
                  <div className="text-center relative z-10">
                    <div className={`text-lg font-black tracking-wide ${formData.orgType === 'GANG' ? 'text-white' : 'text-slate-300'}`}>GANG (แก๊ง)</div>
                    <div className="text-xs text-slate-500 mt-1 font-medium px-4">สำหรับแจ้งแก้ไขข้อมูลและจัดการธุรกรรมของแก๊ง</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
                  className={`flex flex-col items-center justify-center gap-4 py-8 rounded-2xl border-2 transition-all group relative overflow-hidden
                    ${formData.orgType === 'FAMILY' 
                      ? 'border-amber-500 bg-amber-500/5' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${formData.orgType === 'FAMILY' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                    <House size={32} weight={formData.orgType === 'FAMILY' ? 'fill' : 'regular'} />
                  </div>
                  <div className="text-center relative z-10">
                    <div className={`text-lg font-black tracking-wide ${formData.orgType === 'FAMILY' ? 'text-white' : 'text-slate-300'}`}>FAMILY (ครอบครัว)</div>
                    <div className="text-xs text-slate-500 mt-1 font-medium px-4">สำหรับแจ้งแก้ไขข้อมูลและจัดการธุรกรรมของครอบครัว</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2 & 3. ชื่อสังกัด & ผู้ทำรายการ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <GroupSelect 
                label="2. ชื่อสังกัด (GROUP NAME)"
                orgType={formData.orgType}
                value={formData.orgName}
                onChange={val => setFormData({...formData, orgName: val})}
              />
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  3. ผู้ทำรายการ (REQUESTER)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="ชื่อ-นามสกุล (IC)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                  value={formData.requester}
                  onChange={e => setFormData({...formData, requester: e.target.value})}
                />
              </div>
            </div>

            {/* 4. เลือกรายการธุรกรรม */}
                    <span className="text-[10px] text-slate-500">*ถ้ามีการเปลี่ยนสี</span>
                  </div>
                  <div className="flex gap-2 h-10">
                    <div 
                      className="h-full w-12 border border-slate-700 rounded shadow-inner"
                      style={{ backgroundColor: formData.hexColor || '#000000' }}
                    />
                    <input 
                      type="text"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      placeholder="#FFFFFF"
                      value={formData.hexColor}
                      onChange={e => {
                        const val = e.target.value.replace(/[^A-Za-z0-9#]/g, '');
                        setFormData({...formData, hexColor: val});
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-xs font-bold text-slate-300">แนบลิงก์รูปภาพโลโก้ (Logo URL)</span>
                  <span className="text-[10px] text-slate-500">*สำหรับอัปเดตแก๊งหรือครอบครัว</span>
                </div>
                <input 
                  type="text"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all text-sm"
                  placeholder="เช่น https://imgur.com/... หรือ Discord Image Link"
                  value={formData.logoUrl}
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-300 mb-2">รายละเอียดเพิ่มเติม / สิ่งที่ต้องการแก้</div>
                <textarea 
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all resize-none text-sm"
                  placeholder="เช่น ขอเปลี่ยนโลโก้แก๊ง, เพิ่มลายเสื้อ, เปลี่ยนสีสัญลักษณ์..."
                  value={formData.extraDetails}
                  onChange={e => setFormData({...formData, extraDetails: e.target.value})}
                />
              </div>
            </div>

            {/* ยอดรวมเบื้องต้น */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl flex items-center justify-between p-6">
              <div className="flex items-center gap-3 text-white font-bold text-lg">
                <Calculator size={24} className="text-slate-400" /> ยอดรวมเบื้องต้น
              </div>
              <div className="text-4xl font-black text-amber-400">
                {calculateTotal().toLocaleString()} <span className="text-2xl">$</span>
              </div>
            </div>

            {/* 6. เจ้าหน้าที่สภา */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                6. เจ้าหน้าที่สภาผู้รับเรื่อง (COUNCIL MEMBER)
              </label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3.5 text-white font-medium appearance-none focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                  value={formData.councilStaffId}
                  onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
                  required
                >
                  <option value="" disabled className="text-slate-500">-- เลือกเจ้าหน้าที่สภา --</option>
                  {councilMembers.map(c => (
                    <option key={c.id} value={c.id} className="text-white bg-slate-900">{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                  <User size={20} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full py-4 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 border-none">
              ดำเนินการต่อ
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
