import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

import Button from '../../components/ui/Button';
import { Skull, House, Calculator, User, PencilSimple, ArrowLeft } from '@phosphor-icons/react';

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
    <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <PencilSimple size={32} weight="duotone" className="text-pink-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">แจ้งแก้ไขข้อมูลองค์กร</h1>
            <p className="text-slate-400">แบบฟอร์มแจ้งเปลี่ยนชื่อ สี โลโก้ หรือชุดประจำ Gang/Family</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate('/home')} className="text-slate-400 hover:text-white px-0 self-start sm:self-auto">
          <ArrowLeft size={18} className="mr-2" /> ย้อนกลับ
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white">
        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. ประเภทสังกัด */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                1. ประเภทสังกัด (GROUP TYPE)
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, orgType: 'GANG'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-bold text-lg
                    ${formData.orgType === 'GANG' 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}
                >
                  <Skull size={24} weight={formData.orgType === 'GANG' ? 'fill' : 'regular'} /> GANG (แก๊ง)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-bold text-lg
                    ${formData.orgType === 'FAMILY' 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}
                >
                  <House size={24} weight={formData.orgType === 'FAMILY' ? 'fill' : 'regular'} /> FAMILY (ครอบครัว)
                </button>
              </div>
            </div>

            {/* 2 & 3. ชื่อสังกัด & ผู้ทำรายการ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                  2. ชื่อสังกัด (GROUP NAME)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="ระบุชื่อแก๊ง หรือ ครอบครัว"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  value={formData.orgName}
                  onChange={e => {
                    const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                    setFormData({...formData, orgName: val});
                  }}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                  3. ผู้ทำรายการ (REQUESTER)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="ชื่อ-นามสกุล (IC)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  value={formData.requester}
                  onChange={e => setFormData({...formData, requester: e.target.value})}
                />
              </div>
            </div>

            {/* 4. เลือกรายการธุรกรรม */}
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                  4. เลือกรายการธุรกรรม (TRANSACTIONS)
                </label>
                <span className="text-xs text-slate-500 mb-[2px]">*สามารถเลือกได้มากกว่า 1 รายการ</span>
              </div>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-4 cursor-pointer p-4 border rounded-xl transition-all ${formData.changeInfo ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'}`}>
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500" checked={formData.changeInfo} onChange={e => setFormData({...formData, changeInfo: e.target.checked})} />
                  <span className={`font-bold flex-1 text-lg ${formData.changeInfo ? 'text-white' : 'text-slate-300'}`}>เปลี่ยนข้อมูล Gang</span>
                  <span className="bg-amber-500/20 text-amber-400 font-black px-3 py-1 rounded-full text-sm">500,000 $</span>
                </label>

                <label className={`flex items-center gap-4 cursor-pointer p-4 border rounded-xl transition-all ${formData.editTexture ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'}`}>
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500" checked={formData.editTexture} onChange={e => setFormData({...formData, editTexture: e.target.checked})} />
                  <span className={`font-bold flex-1 text-lg ${formData.editTexture ? 'text-white' : 'text-slate-300'}`}>แก้ไข Texture เสื้อผ้า</span>
                  <span className="bg-amber-500/20 text-amber-400 font-black px-3 py-1 rounded-full text-sm">500,000 $ / ชุด</span>
                </label>

                <label className={`flex items-center gap-4 cursor-pointer p-4 border rounded-xl transition-all ${formData.addCloth ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'}`}>
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500" checked={formData.addCloth} onChange={e => setFormData({...formData, addCloth: e.target.checked})} />
                  <span className={`font-bold flex-1 text-lg ${formData.addCloth ? 'text-white' : 'text-slate-300'}`}>ลงชุดเพิ่ม</span>
                  <span className="bg-amber-500/20 text-amber-400 font-black px-3 py-1 rounded-full text-sm">500,000 $ / ชุด</span>
                </label>

                <label className={`flex items-center gap-4 cursor-pointer p-4 border rounded-xl transition-all ${formData.bulkChange ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'}`}>
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500" checked={formData.bulkChange} onChange={e => setFormData({...formData, bulkChange: e.target.checked})} />
                  <span className={`font-bold flex-1 text-lg ${formData.bulkChange ? 'text-white' : 'text-slate-300'}`}>เหมาเปลี่ยนข้อมูล Gang</span>
                  <span className="bg-amber-500/20 text-amber-400 font-black px-3 py-1 rounded-full text-sm">1,500,000 $</span>
                </label>

                <label className={`flex items-center gap-4 cursor-pointer p-4 border rounded-xl transition-all ${formData.addAccessory ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'}`}>
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500" checked={formData.addAccessory} onChange={e => setFormData({...formData, addAccessory: e.target.checked})} />
                  <span className={`font-bold flex-1 text-lg ${formData.addAccessory ? 'text-white' : 'text-slate-300'}`}>ลง Accessories Adons เสริม</span>
                  <span className="bg-amber-500/20 text-amber-400 font-black px-3 py-1 rounded-full text-sm">1,000,000 $</span>
                </label>
              </div>
            </div>

            {/* 5. รายละเอียดเพิ่มเติม */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 space-y-6">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Calculator size={18} /> 5. ระบุรายละเอียดการแก้ไข (ถ้ามี)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-300">จำนวนชุด (Texture)</span>
                    <span className="text-[10px] text-slate-500">*มีผลกับราคาเมื่อเลือกแก้ Texture</span>
                  </div>
                  <div className="flex border border-slate-700 rounded-lg overflow-hidden bg-slate-950 w-32 h-10">
                    <button type="button" className="px-3 hover:bg-slate-800 font-bold border-r border-slate-700 text-slate-400" onClick={() => setFormData(prev => ({...prev, textureCount: Math.max(1, prev.textureCount - 1)}))}>-</button>
                    <input type="number" className="flex-1 text-center font-bold focus:outline-none appearance-none bg-transparent text-white" min="1" value={formData.textureCount} onChange={e => setFormData({...formData, textureCount: parseInt(e.target.value) || 1})} />
                    <button type="button" className="px-3 hover:bg-slate-800 font-bold border-l border-slate-700 text-slate-400" onClick={() => setFormData(prev => ({...prev, textureCount: prev.textureCount + 1}))}>+</button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-300">รหัสสี (HEX Color)</span>
                    <span className="text-[10px] text-slate-500">*ถ้ามีการเปลี่ยนสี</span>
                  </div>
                  <div className="flex gap-2 h-10">
                    <div className="h-full w-12 border border-slate-700 rounded overflow-hidden">
                      <input 
                        type="color" 
                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                        value={formData.hexColor}
                        onChange={e => setFormData({...formData, hexColor: e.target.value})}
                      />
                    </div>
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
