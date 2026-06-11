import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { buildWelfareTradeWebhook } from '../../services/discordFormatters';
import { toBlob } from 'html-to-image';

import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { PaperPlaneTilt, Car, Crosshair, ArrowLeft } from '@phosphor-icons/react';

export default function WelfareTradePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, user } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const captureRef = useRef(null);

  const { formData, items } = location.state || {};

  useEffect(() => {
    if (!formData || !items) {
      navigate('/welfare_trade');
      return;
    }

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
  }, [formData, items, navigate]);

  if (!formData || !items) return null;

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
      navigate('/home');
      
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">ตรวจสอบข้อมูลก่อนส่ง</h2>
          <p className="text-slate-400">โปรดตรวจสอบรูปภาพนี้ให้แน่ใจก่อนทำการส่งข้อมูล</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/welfare_trade', { state: { formData, items, step: 2 } })} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับเพื่อแก้ไข
        </Button>
      </div>

      <div ref={captureRef} className="p-6 bg-[#0f172a]">
        <div className="bg-slate-900 rounded-[32px] p-8 md:p-12 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 text-violet-400 mb-6 border border-slate-700 shadow-lg shadow-violet-500/10">
            {formData.tradeType === 'VEHICLE' ? <Car size={40} /> : <Crosshair size={40} />}
          </div>
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">WELFARE TRANSFER</h2>
          <p className="text-violet-400 font-bold mt-2 uppercase tracking-[0.2em]">{formData.orgType} - {formData.tradeType}</p>
        </div>

        <div className="flex flex-col gap-6 relative z-10 bg-slate-950/50 p-8 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-col pb-6 border-b border-slate-800 border-dashed">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">ชื่อองค์กร</span>
            <span className="font-black text-white text-3xl tracking-wide">{formData.orgName || '...'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pb-6 border-b border-slate-800 border-dashed">
            <div>
              <span className="text-slate-500 text-xs font-bold block mb-2 uppercase tracking-wider">ผู้โอน (เก่า)</span>
              <span className="font-bold text-red-400 text-lg">{formData.oldOwner || '...'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-xs font-bold block mb-2 uppercase tracking-wider">ผู้รับ (ใหม่)</span>
              <span className="font-bold text-emerald-400 text-lg">{formData.newOwner || '...'}</span>
            </div>
          </div>

          <div className="pb-6 border-b border-slate-800 border-dashed">
            <span className="text-slate-500 text-xs font-bold block mb-4 uppercase tracking-wider">
              รายการ ({items.length})
            </span>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800/50">
                  <span className="text-slate-200 font-bold">{item.name || '...'}</span>
                  <span className="text-slate-400 font-mono text-sm">{item.detail || '-'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-end pt-2">
            <div>
              <span className="text-slate-500 text-xs font-bold block mb-2 uppercase tracking-wider">สภาผู้ทำรายการ</span>
              <span className="text-amber-500 font-black text-lg tracking-wide">
                {councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-xs font-bold block mb-2 uppercase tracking-wider">ค่าธรรมเนียมรวม</span>
              <span className="text-white font-black text-2xl tracking-tight">{getTotalPrice()}</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button type="button" size="lg" onClick={() => setShowConfirm(true)} className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 rounded-xl py-4 text-lg">
          <PaperPlaneTilt size={20} weight="bold" className="mr-2 inline" /> ยืนยันการส่งข้อมูล
        </Button>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="ยืนยันส่งข้อมูลแลกเปลี่ยนสวัสดิการ?"
        message={`คุณต้องการยืนยันการส่งข้อมูลของแก๊ง ${formData.orgName} ใช่หรือไม่?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
