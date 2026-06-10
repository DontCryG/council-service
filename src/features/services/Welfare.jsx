import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { sendWebhook } from '../../core/api';
import { toBlob } from 'html-to-image';

import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, Plus, Trash, Gift, Car, Shield } from '@phosphor-icons/react';

export default function Welfare() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  
  const [formData, setFormData] = useState({
    orgType: 'GANG',
    orgName: '',
    requester: '',
    hasWeapon: false,
    otherWelfare: ''
  });
  const [vehicles, setVehicles] = useState([{ id: 1, model: '', plate: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captureRef = useRef(null);

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { id: Date.now(), model: '', plate: '' }]);
  };

  const handleRemoveVehicle = (id) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleVehicleChange = (id, field, val) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.requester) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#0f172a',
        cacheBust: true
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'welfare.png');
      fd.append('payload_json', JSON.stringify({
        content: `**[เบิกสวัสดิการ]** แก๊ง: ${formData.orgName} | ประเภท: ${formData.orgType}`,
        embeds: [{
          title: "🎁 WELFARE REQUEST RECEIPT",
          color: 0x10b981,
          fields: [
            { name: "👥 ประเภท", value: formData.orgType, inline: true },
            { name: "🏰 ชื่อ", value: formData.orgName, inline: true },
            { name: "👤 ผู้เบิก", value: formData.requester, inline: false },
            { name: "🚗 ยานพาหนะ", value: vehicles.length > 0 ? vehicles.map(v => `${v.model} (${v.plate})`).join('\n') : 'ไม่มี', inline: false },
            { name: "⚔️ อาวุธ", value: formData.hasWeapon ? 'มีอาวุธ' : 'ไม่มี', inline: true },
            { name: "📝 หมายเหตุ", value: formData.otherWelfare || '-', inline: true },
          ],
          image: {
            url: "attachment://welfare.png"
          },
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('welfare', fd);
      showAlert('success', 'ส่งแบบฟอร์มสวัสดิการเรียบร้อยแล้ว!');
      navigate('/');
      
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Gift size={32} weight="duotone" className="text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">เบิกสวัสดิการรายสัปดาห์</h1>
          <p className="text-slate-400">แบบฟอร์มบันทึกการเบิกสวัสดิการ Gang / Family</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-4 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.orgType === 'GANG' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'GANG'})}
              >
                GANG
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.orgType === 'FAMILY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
              >
                FAMILY
              </button>
            </div>

            <Input 
              label={`ชื่อ ${formData.orgType}`} 
              placeholder="ระบุชื่อ..." 
              required
              value={formData.orgName}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                setFormData({...formData, orgName: val});
              }}
            />

            <Input 
              label="ผู้เบิกสวัสดิการ" 
              placeholder="ชื่อในเกม..." 
              required
              value={formData.requester}
              onChange={e => setFormData({...formData, requester: e.target.value})}
            />

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300 ml-1">สวัสดิการพาหนะ</label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddVehicle} className="text-emerald-400 hover:text-emerald-300">
                  <Plus size={16} /> เพิ่มรถ
                </Button>
              </div>
              
              {vehicles.map((v, idx) => (
                <div key={v.id} className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="ชื่อรถ / รุ่นรถ"
                      value={v.model}
                      onChange={(e) => handleVehicleChange(v.id, 'model', e.target.value)}
                    />
                    <Input 
                      placeholder="ป้ายทะเบียน"
                      value={v.plate}
                      onChange={(e) => handleVehicleChange(v.id, 'plate', e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="danger" size="icon" onClick={() => handleRemoveVehicle(v.id)}>
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  checked={formData.hasWeapon}
                  onChange={e => setFormData({...formData, hasWeapon: e.target.checked})}
                />
                <span className="font-medium text-white flex items-center gap-2"><Shield className="text-amber-500"/> รับสวัสดิการอาวุธ</span>
              </label>

              <Input 
                label="สวัสดิการอื่นๆ (ถ้ามี)" 
                placeholder="เช่น กล่องต่างๆ..." 
                value={formData.otherWelfare}
                onChange={e => setFormData({...formData, otherWelfare: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              <PaperPlaneTilt size={20} weight="bold" /> ยืนยันการเบิกสวัสดิการ
            </Button>
          </form>
        </Card>

        {/* Preview */}
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Preview</h3>
          <div ref={captureRef} className="bg-slate-900 rounded-xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">WELFARE RECEIPT</h2>
              <p className="text-emerald-400 font-bold mt-1 uppercase tracking-wider">{formData.orgType}</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">ชื่อ</span>
                <span className="font-bold text-white text-xl">{formData.orgName || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">ผู้เบิก</span>
                <span className="font-medium text-white">{formData.requester || '-'}</span>
              </div>
              
              <div className="py-3 border-b border-slate-800/50">
                <span className="text-slate-400 block mb-2">ยานพาหนะ ({vehicles.length})</span>
                <div className="space-y-1">
                  {vehicles.map((v, i) => (
                    <div key={i} className="text-sm text-slate-300 flex justify-between bg-slate-950 p-2 rounded">
                      <span className="flex items-center gap-2"><Car className="text-blue-400"/> {v.model || '...'}</span>
                      <span className="font-mono text-amber-400">{v.plate || '...'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">อาวุธ</span>
                <span className={`font-bold ${formData.hasWeapon ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formData.hasWeapon ? '✅ รับสวัสดิการอาวุธ' : '❌ ไม่รับอาวุธ'}
                </span>
              </div>

              {formData.otherWelfare && (
                <div className="py-3 border-b border-slate-800/50">
                  <span className="text-slate-400 block mb-1">อื่นๆ</span>
                  <span className="text-white">{formData.otherWelfare}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
