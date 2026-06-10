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
import { PaperPlaneTilt, Buildings, PencilSimple, Palette, TShirt, CheckCircle } from '@phosphor-icons/react';

export default function EditOrg() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  
  const [formData, setFormData] = useState({
    orgType: 'GANG',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.requester || !formData.councilStaffId) {
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
      fd.append('file', blob, 'edit_org.png');
      fd.append('payload_json', JSON.stringify({
        content: `**[แจ้งแก้ไขข้อมูลองค์กร]** ชื่อ: ${formData.orgName} | โดย: ${formData.requester}`,
        embeds: [{
          title: "✏️ ORGANIZATION EDIT REQUEST",
          color: 0xec4899, // Pink
          fields: [
            { name: "🏰 แก๊ง/แฟมิลี่", value: `${formData.orgName} (${formData.orgType})`, inline: true },
            { name: "👤 ผู้แจ้ง", value: formData.requester, inline: true },
            { name: "รายการที่แก้ไข", value: [
                formData.changeInfo ? "✅ เปลี่ยนชื่อ/ข้อมูล" : "",
                formData.editTexture ? `✅ แก้ไขเทกเจอร์ (${formData.textureCount} ชิ้น)` : "",
                formData.addCloth ? `✅ เพิ่มชุด (${formData.clothCount} ชิ้น)` : "",
                formData.bulkChange ? "✅ แก้ไขเหมาๆ" : "",
                formData.addAccessory ? `✅ เพิ่มประดับ (${formData.accessoryCount} ชิ้น)` : ""
            ].filter(Boolean).join('\n') || "ไม่มี", inline: false },
            { name: "รายละเอียดเพิ่มเติม", value: formData.extraDetails || "-", inline: false },
            { name: "สภาที่รับเรื่อง", value: councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-', inline: true },
          ],
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('edit_org', fd);
      showAlert('success', 'ส่งข้อมูลแจ้งแก้ไขเรียบร้อยแล้ว!');
      navigate('/');
      
    } catch (err) {
      console.error(err);
      showAlert('error', `เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถส่งข้อมูลได้'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    if (formData.changeInfo) total += 50000;
    if (formData.editTexture) total += (10000 * Math.max(1, formData.textureCount));
    if (formData.addCloth) total += (50000 * Math.max(1, formData.clothCount));
    if (formData.bulkChange) total += 150000;
    if (formData.addAccessory) total += (30000 * Math.max(1, formData.accessoryCount));
    return total;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <PencilSimple size={32} weight="duotone" className="text-pink-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">แจ้งแก้ไขข้อมูลองค์กร</h1>
          <p className="text-slate-400">แบบฟอร์มแจ้งเปลี่ยนชื่อ สี โลโก้ หรือชุดประจำ Gang/Family</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex gap-4 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-1.5 text-sm rounded-md font-bold transition-colors ${formData.orgType === 'GANG' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'GANG'})}
              >
                GANG
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-sm rounded-md font-bold transition-colors ${formData.orgType === 'FAMILY' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
              >
                FAMILY
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="ชื่อแก๊ง / แฟมิลี่" 
                required
                value={formData.orgName}
                onChange={e => {
                  const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                  setFormData({...formData, orgName: val});
                }}
              />
              <Input 
                label="ผู้แจ้ง (ชื่อในเกม)" 
                required
                value={formData.requester}
                onChange={e => setFormData({...formData, requester: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <label className="text-sm font-medium text-slate-300 ml-1">เลือกรายการที่ต้องการทำ (สามารถเลือกได้หลายข้อ)</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.changeInfo ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.changeInfo} onChange={e => setFormData({...formData, changeInfo: e.target.checked})} />
                  <Buildings size={20} className={formData.changeInfo ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.changeInfo ? 'text-white' : 'text-slate-300'}`}>เปลี่ยนชื่อแก๊ง ($50,000)</span>
                  {formData.changeInfo && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.editTexture ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.editTexture} onChange={e => setFormData({...formData, editTexture: e.target.checked})} />
                  <Palette size={20} className={formData.editTexture ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.editTexture ? 'text-white' : 'text-slate-300'}`}>แก้เทกเจอร์ ($10,000/ชิ้น)</span>
                  {formData.editTexture && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.addCloth ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.addCloth} onChange={e => setFormData({...formData, addCloth: e.target.checked})} />
                  <TShirt size={20} className={formData.addCloth ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.addCloth ? 'text-white' : 'text-slate-300'}`}>เพิ่มชุดใหม่ ($50,000)</span>
                  {formData.addCloth && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.addAccessory ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.addAccessory} onChange={e => setFormData({...formData, addAccessory: e.target.checked})} />
                  <TShirt size={20} className={formData.addAccessory ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.addAccessory ? 'text-white' : 'text-slate-300'}`}>เพิ่มประดับ ($30,000)</span>
                  {formData.addAccessory && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all sm:col-span-2 ${formData.bulkChange ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.bulkChange} onChange={e => setFormData({...formData, bulkChange: e.target.checked})} />
                  <Buildings size={20} className={formData.bulkChange ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.bulkChange ? 'text-white' : 'text-slate-300'}`}>โปรเหมา (เปลี่ยนชื่อ+โลโก้+ชุด) ($150,000)</span>
                  {formData.bulkChange && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>
              </div>
            </div>

            {/* Conditional Inputs */}
            {(formData.changeInfo || formData.bulkChange || formData.editTexture || formData.addCloth || formData.addAccessory) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 bg-slate-900/50 p-4 rounded-xl">
                {formData.editTexture && (
                  <Input 
                    type="number" 
                    min="1" 
                    label="จำนวนเทกเจอร์ที่แก้" 
                    value={formData.textureCount}
                    onChange={e => setFormData({...formData, textureCount: parseInt(e.target.value) || 1})}
                  />
                )}
                {formData.addCloth && (
                  <Input 
                    type="number" 
                    min="1" 
                    label="จำนวนชุดที่เพิ่ม" 
                    value={formData.clothCount}
                    onChange={e => setFormData({...formData, clothCount: parseInt(e.target.value) || 1})}
                  />
                )}
                {formData.addAccessory && (
                  <Input 
                    type="number" 
                    min="1" 
                    label="จำนวนประดับที่เพิ่ม" 
                    value={formData.accessoryCount}
                    onChange={e => setFormData({...formData, accessoryCount: parseInt(e.target.value) || 1})}
                  />
                )}
                {(formData.changeInfo || formData.bulkChange) && (
                  <>
                    <Input 
                      label="Logo Link ใหม่" 
                      placeholder="ใส่ URL รูปโลโก้"
                      value={formData.logoUrl}
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                    />
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-slate-300 ml-1 block mb-1">สีประจำแก๊ง (ใหม่)</label>
                      <div className="flex gap-2 h-11">
                        <div 
                          className="h-full w-12 border border-slate-700 rounded shadow-inner"
                          style={{ backgroundColor: formData.hexColor || '#000000' }}
                        />
                        <Input 
                          className="flex-1"
                          placeholder="#000000"
                          value={formData.hexColor}
                          onChange={e => {
                            const val = e.target.value.replace(/[^A-Za-z0-9#]/g, '');
                            setFormData({...formData, hexColor: val});
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <Input 
                label="รายละเอียดเพิ่มเติม (ช่องทางติดต่อ / หมายเหตุ)" 
                value={formData.extraDetails}
                onChange={e => setFormData({...formData, extraDetails: e.target.value})}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">สภาผู้รับเรื่อง</label>
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
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              <PaperPlaneTilt size={20} weight="bold" /> ยืนยันการส่งคำร้อง
            </Button>
          </form>
        </Card>

        {/* Preview */}
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Document</h3>
          
          <div ref={captureRef} className="bg-slate-100 rounded-xl p-8 border border-slate-300 shadow-2xl relative overflow-hidden" style={{ color: '#1e293b' }}>
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ color: '#000' }}>
                  {formData.orgName || 'ORGANIZATION'}
                </h2>
                <p className="text-slate-500 font-bold tracking-widest">{formData.orgType} MODIFICATION</p>
              </div>
              {(formData.changeInfo || formData.bulkChange) && formData.logoUrl && (
                <img src={formData.logoUrl} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md rounded" crossOrigin="anonymous"/>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Requester</div>
                <div className="font-bold text-lg">{formData.requester || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Theme Color (New)</div>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <div className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: formData.hexColor }}></div>
                  {formData.hexColor}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">Requested Changes</div>
              <ul className="text-sm space-y-2 list-none pl-0 text-slate-700 font-medium">
                {formData.changeInfo && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span>✅ เปลี่ยนชื่อ/ข้อมูล</span> <span>$50,000</span></li>}
                {formData.editTexture && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span>✅ แก้ไขเทกเจอร์ ({formData.textureCount} ชิ้น)</span> <span>${(10000 * Math.max(1, formData.textureCount)).toLocaleString()}</span></li>}
                {formData.addCloth && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span>✅ เพิ่มชุดใหม่ ({formData.clothCount} ชิ้น)</span> <span>${(50000 * Math.max(1, formData.clothCount)).toLocaleString()}</span></li>}
                {formData.addAccessory && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span>✅ เพิ่มประดับ ({formData.accessoryCount} ชิ้น)</span> <span>${(30000 * Math.max(1, formData.accessoryCount)).toLocaleString()}</span></li>}
                {formData.bulkChange && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span>✅ โปรเหมา</span> <span>$150,000</span></li>}
                {!formData.changeInfo && !formData.editTexture && !formData.addCloth && !formData.bulkChange && !formData.addAccessory && (
                  <li className="text-slate-400 italic">No changes selected</li>
                )}
              </ul>
            </div>

            {formData.extraDetails && (
              <div className="mb-8 p-4 bg-slate-200/50 rounded-lg border border-slate-300">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Extra Details / Remarks</div>
                <div className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {formData.extraDetails}
                </div>
              </div>
            )}

            <div className="flex justify-between items-end pt-4 mt-4 border-t-2 border-slate-300">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Total Fees</div>
                <div className="text-3xl font-black text-emerald-600">${calculateTotal().toLocaleString()}</div>
              </div>
              
              <div className="text-center w-40">
                <div className="border-b border-slate-800 pb-1 font-medium">{councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}</div>
                <div className="text-xs mt-1">Council Inspector</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
