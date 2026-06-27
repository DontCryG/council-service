import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { saveTransactionLog, saveTransactionImage, ensureCitizenExists } from '../../core/api';
import { buildWelfareTradeWebhook } from '../../services/discordFormatters';
import { toJpeg } from 'html-to-image';

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
  const [refNumber] = useState(() => `CS-TRADE-${Math.floor(1000 + Math.random() * 9000)}`);

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
      const dataUrl = await toJpeg(captureRef.current, { 
        quality: 1.0,
        pixelRatio: 2.5, 
        backgroundColor: '#020617',
        cacheBust: true
      });
      if (!dataUrl) throw new Error("Failed to generate image");
      
      const councilName = councilMembers.find(c => c.id === formData.councilStaffId)?.name;
      const payload = buildWelfareTradeWebhook(formData, items, getTotalPrice(), councilName, refNumber);

      payload.embeds[0].image = { url: "attachment://receipt.jpg" };

      // Auto-save citizen if they don't exist
      await Promise.all([
        ensureCitizenExists(formData.requester)
      ]);

      const logId = await saveTransactionLog('welfare_trade', {
        refNumber: refNumber,
        orgName: formData.orgName,
        orgType: formData.orgType,
        tradeType: formData.tradeType,
        oldOwner: formData.oldOwner,
        newOwner: formData.newOwner,
        items: items,
        totalPrice: getTotalPrice(),
        councilStaffId: formData.councilStaffId,
        councilStaffName: councilName || '-',
        webhookPayload: payload
      }, user);
      
      await saveTransactionImage(logId, dataUrl);
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

  const renderReceipt = (isCapture = false) => (
    <div 
      ref={isCapture ? captureRef : null} 
      style={isCapture ? { width: '800px', height: '100%', minHeight: '600px' } : {}}
      className={`bg-slate-900 rounded-[32px] p-6 sm:p-8 md:p-12 border-2 border-slate-800 shadow-2xl relative overflow-hidden font-sans text-slate-200 ${isCapture ? 'w-[800px] mb-0 mx-auto' : 'w-full max-w-2xl mx-auto mb-8'}`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
        <img src="/logo.png" alt="watermark" className="w-[80%] h-[80%] object-contain grayscale" />
      </div>

      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-950 text-violet-400 mb-6 border-2 border-slate-800 shadow-xl shadow-violet-900/20">
          {formData.tradeType === 'VEHICLE' ? <Car size={40} weight="fill" /> : <Crosshair size={40} weight="fill" />}
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-widest uppercase whitespace-nowrap">WELFARE TRANSFER</h2>
        <p className="text-violet-400 font-bold mt-3 uppercase tracking-[0.3em] whitespace-nowrap">{formData.orgType} - {formData.tradeType}</p>
      </div>

      <div className="flex flex-col gap-6 relative z-10 bg-slate-950/80 p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-inner">
        <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-800 border-dashed">
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 whitespace-nowrap">Organization (ชื่อองค์กร)</span>
            <span className="font-black text-white text-2xl sm:text-3xl tracking-wide truncate">{formData.orgName || '...'}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 whitespace-nowrap">Phone (เบอร์โทรศัพท์)</span>
            <span className="font-black text-emerald-400 text-2xl sm:text-3xl tracking-wide truncate">{formData.phoneNumber || '...'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 sm:gap-8 pb-6 border-b border-slate-800 border-dashed">
          <div>
            <span className="text-slate-500 text-[10px] sm:text-xs font-bold block mb-2 uppercase tracking-wider whitespace-nowrap">Transfer From (ผู้โอน)</span>
            <div className="inline-flex items-center gap-2 bg-red-500/10 px-3 sm:px-4 py-2 rounded-lg border border-red-500/20 max-w-full">
              <span className="font-bold text-red-400 text-sm sm:text-lg truncate">{formData.oldOwner || '...'}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] sm:text-xs font-bold block mb-2 uppercase tracking-wider whitespace-nowrap">Transfer To (ผู้รับ)</span>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-3 sm:px-4 py-2 rounded-lg border border-emerald-500/20 max-w-full justify-end">
              <span className="font-bold text-emerald-400 text-sm sm:text-lg truncate">{formData.newOwner || '...'}</span>
            </div>
          </div>
        </div>

        <div className="pb-6 border-b border-slate-800 border-dashed">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Items List (รายการ)
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded">
              {items.length} ITEMS
            </span>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-900 p-4 rounded-xl border border-slate-700/50 shadow-sm gap-2">
                <span className="text-slate-200 font-bold text-sm sm:text-base truncate">{item.name || '...'}</span>
                <span className="text-slate-400 font-mono text-xs sm:text-sm shrink-0 bg-slate-950 px-3 py-1 rounded border border-slate-800 w-fit">{item.detail || '-'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-2 gap-4">
          <div>
            <span className="text-slate-500 text-xs font-bold block mb-2 uppercase tracking-wider whitespace-nowrap">Certified By (สภาผู้ทำรายการ)</span>
            <span className="text-amber-500 font-black text-lg sm:text-xl tracking-wide whitespace-nowrap">
              {councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}
            </span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-slate-500 text-xs font-bold block mb-2 uppercase tracking-wider whitespace-nowrap">Total Fee (ค่าธรรมเนียมรวม)</span>
            <span className="text-white font-black text-2xl sm:text-3xl tracking-tight whitespace-nowrap">{getTotalPrice()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 md:px-0 animate-in fade-in slide-in-from-right-16 duration-700 ease-out">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">ตรวจสอบข้อมูลก่อนส่ง</h2>
          <p className="text-slate-400 text-sm">โปรดตรวจสอบรูปภาพนี้ให้แน่ใจก่อนทำการส่งข้อมูล</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/welfare_trade', { state: { formData, items, step: 2 } })} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
          <ArrowLeft size={20} className="mr-2" /> <span className="hidden sm:inline">ย้อนกลับเพื่อแก้ไข</span>
        </Button>
      </div>

      {/* Visible Receipt (Responsive for viewing) */}
      {renderReceipt(false)}

      {/* Hidden Receipt (Strict 800px width for html-to-image capture) */}
      <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
        {renderReceipt(true)}
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
