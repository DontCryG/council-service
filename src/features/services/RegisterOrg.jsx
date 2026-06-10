import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook } from '../../core/api';
import { toBlob } from 'html-to-image';

import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, Plus, Trash, Buildings } from '@phosphor-icons/react';

export default function RegisterOrg() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [step, setStep] = useState(1);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captureRef = useRef(null);

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
  const handleArrayChange = (setter, state, id, field, val) => {
    setter(state.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.leader || !formData.councilStaffId) {
      showAlert('error', 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#f1f5f9',
        cacheBust: true 
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'register.png');
      fd.append('payload_json', JSON.stringify({
        content: `**[ลงทะเบียนแก๊งใหม่]** ชื่อ: ${formData.name} | ประเภท: ${formData.orgType}`,
        embeds: [{
          title: "🏢 NEW ORGANIZATION REGISTRATION",
          color: 0xf59e0b, // Amber
          fields: [
            { name: "👑 ประเภท", value: formData.orgType, inline: true },
            { name: "ชื่อองค์กร", value: formData.name, inline: true },
            { name: "ตัวย่อ", value: formData.alias?.trim() || '-', inline: true },
            { name: "หัวหน้าแก๊ง (Leader)", value: formData.leader, inline: false },
            { name: "รองหัวหน้า (Co-Leader)", value: coLeaders.map(c => c.name?.trim()).filter(Boolean).join(', ') || '-', inline: false },
            { name: "จำนวนสมาชิกปัจจุบัน", value: `${members.length + coLeaders.length + 1} คน`, inline: true },
            { name: "สภาผู้ตรวจสอบ", value: councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-', inline: true },
          ],
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('register_org', fd);
      showAlert('success', 'ลงทะเบียนองค์กรเรียบร้อยแล้ว!');
      navigate('/');
      
    } catch (err) {
      console.error(err);
      showAlert('error', `เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถส่งข้อมูลได้'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Buildings size={32} weight="duotone" className="text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">รับรององค์กร / ลงทะเบียน</h1>
          <p className="text-slate-400">ระบบบันทึกการจัดตั้ง Gang หรือ Family อย่างเป็นทางการ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Card className="order-2 xl:order-1">
          {step === 1 ? (
            <div className="space-y-8 py-4">
              <h3 className="text-xl font-bold text-center">เลือกประเภทองค์กรที่ต้องการจัดตั้ง</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setFormData({...formData, orgType: 'GANG'}); setStep(2); }}
                  className="flex flex-col items-center gap-4 p-8 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-slate-800 rounded-2xl transition-all group"
                >
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Buildings size={32} weight="fill" />
                  </div>
                  <span className="text-xl font-black">GANG</span>
                </button>
                <button 
                  onClick={() => { setFormData({...formData, orgType: 'FAMILY'}); setStep(2); }}
                  className="flex flex-col items-center gap-4 p-8 bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 rounded-2xl transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Buildings size={32} weight="fill" />
                  </div>
                  <span className="text-xl font-black">FAMILY</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Buildings size={18} weight="bold" />
                  </span>
                  ข้อมูล {formData.orgType}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>ย้อนกลับ</Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="ชื่อแก๊ง / แฟมิลี่เต็ม" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <Input 
                  label="ตัวย่อ (Alias)" 
                  value={formData.alias}
                  onChange={e => setFormData({...formData, alias: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 ml-1 block mb-1">สีประจำแก๊ง</label>
                  <div className="flex gap-2 h-11">
                    <div 
                      className="h-full w-12 border border-slate-700 rounded shadow-inner"
                      style={{ backgroundColor: formData.color || '#000000' }}
                    />
                    <Input 
                      className="flex-1"
                      placeholder="#000000"
                      value={formData.color}
                      onChange={e => {
                        const val = e.target.value.replace(/[^A-Za-z0-9#]/g, '');
                        setFormData({...formData, color: val});
                      }}
                    />
                  </div>
                </div>
                <Input 
                  label="Link โลโก้ (ถ้ามี)" 
                  value={formData.logo}
                  onChange={e => setFormData({...formData, logo: e.target.value})}
                />
              </div>

              <Input 
                label="ชื่อ Leader (หัวหน้า)" 
                required
                value={formData.leader}
                onChange={e => setFormData({...formData, leader: e.target.value})}
              />

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300 ml-1">รองหัวหน้า (Co-Leader)</label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleArrayAdd(setCoLeaders, coLeaders)} className="text-amber-400">
                    <Plus size={16} /> เพิ่ม
                  </Button>
                </div>
                {coLeaders.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <Input placeholder="ชื่อ" className="flex-[1.5]" value={item.name} onChange={e => handleArrayChange(setCoLeaders, coLeaders, item.id, 'name', e.target.value)} />
                    <Input type="number" placeholder="เบอร์โทรศัพท์" className="flex-1" value={item.phone} onChange={e => handleArrayChange(setCoLeaders, coLeaders, item.id, 'phone', e.target.value)} />
                    <Button type="button" variant="danger" size="icon" onClick={() => handleArrayRemove(setCoLeaders, coLeaders, item.id)}><Trash size={16}/></Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300 ml-1">สมาชิกทั่วไป (Member)</label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleArrayAdd(setMembers, members)} className="text-amber-400">
                    <Plus size={16} /> เพิ่ม
                  </Button>
                </div>
                {members.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <Input placeholder="ชื่อ" className="flex-[1.5]" value={item.name} onChange={e => handleArrayChange(setMembers, members, item.id, 'name', e.target.value)} />
                    <Input type="number" placeholder="เบอร์โทรศัพท์" className="flex-1" value={item.phone} onChange={e => handleArrayChange(setMembers, members, item.id, 'phone', e.target.value)} />
                    <Button type="button" variant="danger" size="icon" onClick={() => handleArrayRemove(setMembers, members, item.id)}><Trash size={16}/></Button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">สภาผู้ตรวจสอบ</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={formData.councilStaffId}
                  onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
                  required
                >
                  <option value="" disabled>-- เลือกชื่อสภา --</option>
                  {councilMembers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                <PaperPlaneTilt size={20} weight="bold" /> ยืนยันข้อมูลเข้าสู่ระบบ
              </Button>
            </form>
          )}
        </Card>

        {/* Preview Side */}
        {step === 2 && (
          <div className="sticky top-24 order-1 xl:order-2 mb-6 xl:mb-0">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Document</h3>
            
            <div ref={captureRef} className="bg-slate-100 rounded-xl p-8 border border-slate-300 shadow-2xl relative overflow-hidden" style={{ color: '#1e293b' }}>
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ color: '#000' }}>
                    {formData.name || 'ORGANIZATION'}
                  </h2>
                  <p className="text-slate-500 font-bold tracking-widest">{formData.orgType} REGISTRATION</p>
                </div>
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md rounded" crossOrigin="anonymous"/>
                ) : (
                  <div className="w-20 h-20 bg-slate-200 border-2 border-dashed border-slate-400 rounded flex items-center justify-center">
                    <span className="text-slate-400 text-xs">NO LOGO</span>
                  </div>
                )}
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Alias</div>
                  <div className="font-bold text-lg">{formData.alias || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Theme Color</div>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <div className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: formData.color }}></div>
                    {formData.color}
                  </div>
                </div>
                <div className="col-span-2 p-3 bg-blue-50 border-l-4 border-blue-500">
                  <div className="text-xs text-blue-800 uppercase font-bold mb-1">Leader (หัวหน้า)</div>
                  <div className="font-black text-xl text-blue-900">{formData.leader || '...'}</div>
                </div>
              </div>

              {/* Lists */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">Co-Leaders ({coLeaders.length})</div>
                  {coLeaders.length === 0 && <div className="text-slate-400 text-sm">-</div>}
                  <ul className="text-sm space-y-1 list-disc pl-4 text-slate-700 font-medium">
                    {coLeaders.map(c => <li key={c.id}>{c.name} {c.phone && <span className="text-xs text-slate-500">({c.phone})</span>}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">Members ({members.length})</div>
                  {members.length === 0 && <div className="text-slate-400 text-sm">-</div>}
                  <ul className="text-sm space-y-1 list-disc pl-4 text-slate-700 font-medium">
                    {members.map(m => <li key={m.id}>{m.name} {m.phone && <span className="text-xs text-slate-500">({m.phone})</span>}</li>)}
                  </ul>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-8 mt-4 border-t-2 border-slate-300">
                <div className="text-center w-40">
                  <div className="border-b border-slate-800 pb-1 font-signature text-2xl">{formData.leader || '...'}</div>
                  <div className="text-xs mt-1">Leader Signature</div>
                </div>
                
                {/* Stamp */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 rotate-[-15deg] pointer-events-none">
                  <div className="w-32 h-32 border-8 border-red-600 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-black text-2xl uppercase text-center leading-tight">APPROVED<br/>COUNCIL</span>
                  </div>
                </div>

                <div className="text-center w-40">
                  <div className="border-b border-slate-800 pb-1 font-medium">{councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}</div>
                  <div className="text-xs mt-1">Council Inspector</div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
