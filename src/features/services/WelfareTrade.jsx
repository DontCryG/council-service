import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { buildWelfareTradeWebhook } from '../../services/discordFormatters';
import { toBlob } from 'html-to-image';

import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { PaperPlaneTilt, Plus, Trash, ArrowsLeftRight, Car, Crosshair } from '@phosphor-icons/react';

export default function WelfareTrade() {
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  
  const [formData, setFormData] = useState({
    tradeType: 'VEHICLE', // VEHICLE | WEAPON
    orgType: 'GANG', // GANG | FAMILY
    orgName: '',
    oldOwner: '',
    newOwner: '',
    councilStaffId: '',
    pricingType: '300,000'
  });
  
  const [items, setItems] = useState([{ id: 1, name: '', detail: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captureRef = useRef(null);

  // Load Council Members
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

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: '', detail: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleItemChange = (id, field, val) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const getTotalPrice = () => {
    const count = items.length;
    if (formData.tradeType === 'VEHICLE') {
      return (300000 * count).toLocaleString();
    } else {
      if (formData.pricingType.includes('1.5M')) {
        return `${(1.5 * count).toFixed(1).replace('.0', '')}M`;
      } else if (formData.pricingType.includes('2.0M')) {
        return `${(2.0 * count).toFixed(1).replace('.0', '')}M`;
      }
    }
    return formData.pricingType;
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.oldOwner || !formData.newOwner || !formData.councilStaffId) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (items.some(i => !i.name.trim())) {
      showAlert('error', 'กรุณาระบุข้อมูลสิ่งของที่จะแลกเปลี่ยนให้ครบ');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#0f172a',
        cacheBust: true
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'trade.png');
      const councilName = councilMembers.find(c => c.id === formData.councilStaffId)?.name;
      const payload = buildWelfareTradeWebhook(formData, items, getTotalPrice(), councilName);
      fd.append('payload_json', JSON.stringify(payload));

      await sendWebhook('welfare_trade', fd);
      await saveTransactionLog('welfare_trade', {
        orgName: formData.orgName,
        orgType: formData.orgType,
        tradeType: formData.tradeType,
        oldOwner: formData.oldOwner,
        newOwner: formData.newOwner,
        items: items,
        totalPrice: getTotalPrice(),
        councilStaffId: formData.councilStaffId
      }, user);
      showAlert('success', 'ส่งข้อมูลแลกเปลี่ยนสวัสดิการเรียบร้อยแล้ว!');
      setShowConfirm(false);
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
        <ArrowsLeftRight size={32} weight="duotone" className="text-violet-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">ระบบเทรดสวัสดิการ</h1>
          <p className="text-slate-400">แบบฟอร์มบันทึกการโอนสิทธิ์ยานพาหนะ / อาวุธ ขององค์กร</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-4 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.tradeType === 'VEHICLE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, tradeType: 'VEHICLE', pricingType: '300,000'})}
              >
                โอนย้ายรถ (VEHICLE)
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.tradeType === 'WEAPON' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, tradeType: 'WEAPON', pricingType: 'ออกปกติ (1.5M / ชิ้น)'})}
              >
                โอนย้ายอาวุธ (WEAPON)
              </button>
            </div>

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

            <Input 
              label="ชื่อแก๊ง / แฟมิลี่" 
              placeholder="ระบุชื่อ..." 
              required
              value={formData.orgName}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                setFormData({...formData, orgName: val});
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="ชื่อเจ้าของเดิม" 
                placeholder="ชื่อในเกม..." 
                required
                value={formData.oldOwner}
                onChange={e => setFormData({...formData, oldOwner: e.target.value})}
              />
              <Input 
                label="ชื่อผู้รับโอน" 
                placeholder="ชื่อในเกม..." 
                required
                value={formData.newOwner}
                onChange={e => setFormData({...formData, newOwner: e.target.value})}
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300 ml-1">
                  รายการ {formData.tradeType === 'VEHICLE' ? 'รถที่โอนย้าย' : 'อาวุธที่โอนย้าย'}
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-violet-400 hover:text-violet-300">
                  <Plus size={16} /> เพิ่มรายการ
                </Button>
              </div>
              
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input 
                      placeholder={formData.tradeType === 'VEHICLE' ? 'ชื่อรถ / รุ่นรถ' : 'ชื่ออาวุธ'}
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      required
                    />
                    <Input 
                      placeholder={formData.tradeType === 'VEHICLE' ? 'ทะเบียน' : 'ซีเรียลนัมเบอร์ (ถ้ามี)'}
                      value={item.detail}
                      onChange={(e) => handleItemChange(item.id, 'detail', e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="danger" 
                      size="icon" 
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">สภาผู้ทำรายการ</label>
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">ค่าธรรมเนียม</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={formData.pricingType}
                  onChange={e => setFormData({...formData, pricingType: e.target.value})}
                >
                  {formData.tradeType === 'VEHICLE' ? (
                    <option value="300,000">300,000</option>
                  ) : (
                    <>
                      <option value="ออกปกติ (1.5M / ชิ้น)">ออกปกติ (1.5M / ชิ้น)</option>
                      <option value="ออกลอย (2.0M / ชิ้น)">ออกลอย (2.0M / ชิ้น)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              <PaperPlaneTilt size={20} weight="bold" /> ส่งข้อมูลการแลกไปยังระบบส่วนกลาง
            </Button>
          </form>
        </Card>

        {/* Preview Side */}
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Preview</h3>
          <div ref={captureRef} className="bg-slate-900 rounded-xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="text-center mb-6 relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-violet-400 mb-4 border border-slate-700">
                {formData.tradeType === 'VEHICLE' ? <Car size={32} /> : <Crosshair size={32} />}
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">WELFARE TRANSFER</h2>
              <p className="text-violet-400 font-bold mt-1 uppercase tracking-wider">{formData.orgType} - {formData.tradeType}</p>
            </div>

            <div className="space-y-4 relative z-10 bg-slate-950/50 p-6 rounded-xl border border-slate-800">
              <div className="flex flex-col mb-4 pb-4 border-b border-slate-800 border-dashed">
                <span className="text-slate-400 text-sm">ชื่อองค์กร</span>
                <span className="font-bold text-white text-xl">{formData.orgName || '...'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800 border-dashed">
                <div>
                  <span className="text-slate-500 text-xs block mb-1 uppercase tracking-wider">ผู้โอน (เก่า)</span>
                  <span className="font-bold text-red-400">{formData.oldOwner || '...'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-xs block mb-1 uppercase tracking-wider">ผู้รับ (ใหม่)</span>
                  <span className="font-bold text-emerald-400">{formData.newOwner || '...'}</span>
                </div>
              </div>

              <div className="pb-4 border-b border-slate-800 border-dashed">
                <span className="text-slate-500 text-xs block mb-2 uppercase tracking-wider">
                  รายการ ({items.length})
                </span>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-slate-900 p-2 rounded mb-1 border border-slate-800/50">
                    <span className="text-slate-200 font-medium">{item.name || '...'}</span>
                    <span className="text-slate-400 font-mono">{item.detail || '-'}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="text-slate-500 text-xs block mb-1 uppercase tracking-wider">สภาผู้ทำรายการ</span>
                  <span className="text-amber-500 font-bold text-sm">
                    {councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-xs block mb-1 uppercase tracking-wider">ค่าธรรมเนียม</span>
                  <span className="text-white font-black">{getTotalPrice()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="ยืนยันส่งข้อมูลแลกเปลี่ยนสวัสดิการ?"
        message={`คุณต้องการยืนยันการส่งข้อมูลของแก๊ง ${formData.orgName} ใช่หรือไม่? โปรดตรวจสอบรูปภาพตัวอย่างให้แน่ใจ`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
