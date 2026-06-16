import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { PaperPlaneTilt, ArrowLeft, Receipt, CheckCircle, SealCheck, User, PaintBucket, CircleDashed } from '@phosphor-icons/react';

export default function EditOrgPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, user } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const captureRef = useRef(null);
  const [refNumber] = useState(() => `CS-EDIT-${Math.floor(1000 + Math.random() * 9000)}`);

  const { formData } = location.state || {};

  useEffect(() => {
    if (!formData) {
      navigate('/edit_org');
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
  }, [formData, navigate]);

  if (!formData) return null;

  const calculateTotal = () => {
    let total = 0;
    if (formData.changeInfo) total += 500000;
    if (formData.editTexture) total += (500000 * Math.max(1, formData.textureCount));
    if (formData.addCloth) total += (500000 * Math.max(1, formData.textureCount));
    if (formData.bulkChange) total += 1500000;
    if (formData.addAccessory) total += 1000000;
    return total;
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#020617', // Match dark background
        cacheBust: true 
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'edit_org.png');
      let transactionItems = [];
      if (formData.changeInfo) transactionItems.push("- เปลี่ยนข้อมูล Gang (500,000$)");
      if (formData.editTexture) transactionItems.push(`- แก้ไข Texture เสื้อผ้า (${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}$)`);
      if (formData.addCloth) transactionItems.push(`- ลงชุดเพิ่ม (${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}$)`);
      if (formData.bulkChange) transactionItems.push("- เหมาเปลี่ยนข้อมูล Gang (1,500,000$)");
      if (formData.addAccessory) transactionItems.push("- ลง Accessories Adons เสริม (1,000,000$)");

      const transactionText = transactionItems.length > 0 ? `\`\`\`\n${transactionItems.join('\n')}\n\`\`\`` : "```\nไม่มี\n```";

      let additionalInfo = `**สี (HEX):** ${formData.hexColor || '-'}`;
      if (formData.extraDetails) {
        additionalInfo += `\n\n**รายละเอียด:**\n${formData.extraDetails}`;
      }

      const orgTypeDisplay = formData.orgType === 'GANG' ? 'แก๊ง' : (formData.orgType === 'FAMILY' ? 'ครอบครัว' : formData.orgType);

      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "📜 Council Service Log",
          description: "**ได้รับคำร้องขออัปเดตข้อมูลสังกัดใหม่**",
          color: 0xf59e0b,
          thumbnail: formData.logoUrl ? { url: formData.logoUrl } : undefined,
          fields: [
            { name: "ประเภท", value: orgTypeDisplay, inline: true },
            { name: "ชื่อสังกัด", value: formData.orgName, inline: true },
            { name: "ผู้ทำรายการ", value: formData.requester, inline: false },
            { name: "รายการธุรกรรมที่ทำ", value: transactionText, inline: false },
            { name: "ยอดรวมสุทธิ", value: `**${calculateTotal().toLocaleString()} $**`, inline: true },
            { name: "เจ้าหน้าที่รับเรื่อง", value: councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-', inline: true },
            { name: "ข้อมูลเพิ่มเติมที่แจ้ง", value: additionalInfo, inline: false },
          ],
          image: {
            url: "attachment://edit_org.png"
          },
          footer: { text: `Ref: ${refNumber} | Server System` },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('edit_org', fd);
      await saveTransactionLog('edit_org', {
        refNumber: refNumber,
        orgName: formData.orgName,
        orgType: formData.orgType,
        requester: formData.requester,
        councilStaffId: formData.councilStaffId,
        councilStaffName: councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-',
        changeInfo: formData.changeInfo,
        editTexture: formData.editTexture,
        addCloth: formData.addCloth,
        bulkChange: formData.bulkChange,
        addAccessory: formData.addAccessory,
        textureCount: formData.textureCount,
        hexColor: formData.hexColor,
        logoUrl: formData.logoUrl,
        extraDetails: formData.extraDetails,
        totalAmount: calculateTotal()
      }, user);
      showAlert('success', 'ส่งข้อมูลแจ้งแก้ไขเรียบร้อยแล้ว!');
      setShowConfirm(false);
      navigate('/home');
      
    } catch (err) {
      console.error(err);
      showAlert('error', `เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถส่งข้อมูลได้'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">ตรวจสอบข้อมูลก่อนส่ง</h2>
          <p className="text-slate-400">โปรดตรวจสอบรายละเอียดในบิลให้แน่ใจก่อนทำการส่งข้อมูล</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/edit_org', { state: { formData, step: 2 } })} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับเพื่อแก้ไข
        </Button>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 backdrop-blur-sm shadow-2xl">
        <div ref={captureRef} className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden text-slate-200">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          
          <div className="absolute top-8 right-8 text-slate-800 opacity-20 pointer-events-none">
            <Receipt size={120} weight="duotone" />
          </div>

          {/* Header */}
          <div className="flex flex-row items-start justify-between border-b border-dashed border-slate-700 pb-6 mb-6 relative z-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2 w-max">
                <SealCheck size={24} weight="fill" className="text-amber-500 shrink-0" />
                <span className="text-amber-500 font-bold tracking-widest text-xs uppercase whitespace-nowrap shrink-0">Official Receipt</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
                {formData.orgName || 'ORGANIZATION'}
              </h2>
              <div className="text-slate-400 font-medium tracking-wider text-sm mt-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                {formData.orgType} MODIFICATION
              </div>
            </div>
            {formData.logoUrl && (
              <div className="ml-4 shrink-0 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                <img src={formData.logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded" crossOrigin="anonymous"/>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8 relative z-10">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                <User size={14} /> Requester
              </div>
              <div className="font-bold text-lg text-white">{formData.requester || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                <PaintBucket size={14} /> Theme Color (New)
              </div>
              <div className="flex items-center gap-3 font-mono font-bold text-white bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 w-max">
                <div className="w-4 h-4 rounded-full border border-slate-600 shadow-inner" style={{ backgroundColor: formData.hexColor }}></div>
                {formData.hexColor}
              </div>
            </div>
          </div>

          {/* Changes List */}
          <div className="mb-8 relative z-10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CircleDashed size={16} /> Requested Changes
            </div>
            <ul className="text-sm flex flex-col gap-2.5 list-none pl-0 font-medium">
              {formData.changeInfo && <li className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700"><span className="flex items-center gap-2 text-white"><CheckCircle size={18} weight="fill" className="text-amber-500" /> เปลี่ยนข้อมูล Gang</span> <span className="font-mono text-amber-400">$500,000</span></li>}
              {formData.editTexture && <li className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700"><span className="flex items-center gap-2 text-white"><CheckCircle size={18} weight="fill" className="text-amber-500" /> แก้ไข Texture เสื้อผ้า <span className="text-slate-400 text-xs ml-1">x{formData.textureCount}</span></span> <span className="font-mono text-amber-400">${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}</span></li>}
              {formData.addCloth && <li className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700"><span className="flex items-center gap-2 text-white"><CheckCircle size={18} weight="fill" className="text-amber-500" /> ลงชุดเพิ่ม <span className="text-slate-400 text-xs ml-1">x{formData.textureCount}</span></span> <span className="font-mono text-amber-400">${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}</span></li>}
              {formData.bulkChange && <li className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700"><span className="flex items-center gap-2 text-white"><CheckCircle size={18} weight="fill" className="text-amber-500" /> เหมาเปลี่ยนข้อมูล Gang</span> <span className="font-mono text-amber-400">$1,500,000</span></li>}
              {formData.addAccessory && <li className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700"><span className="flex items-center gap-2 text-white"><CheckCircle size={18} weight="fill" className="text-amber-500" /> ลง Accessories Adons เสริม</span> <span className="font-mono text-amber-400">$1,000,000</span></li>}
            </ul>
          </div>

          {/* Extra Details */}
          {formData.extraDetails && (
            <div className="mb-8 p-4 bg-slate-950/50 rounded-xl border border-slate-800 relative z-10">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Extra Details / Remarks</div>
              <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed italic">
                "{formData.extraDetails}"
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-end pt-6 mt-2 border-t border-dashed border-slate-700 relative z-10">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Amount Due</div>
              <div className="text-4xl font-black text-white">
                <span className="text-amber-500 mr-1">$</span>{calculateTotal().toLocaleString()}
              </div>
            </div>
            
            <div className="text-center w-48">
              <div className="border-b border-slate-600 pb-2 font-bold text-white truncate px-2">{councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}</div>
              <div className="text-[10px] mt-1.5 text-slate-400 uppercase tracking-widest font-bold">Authorized Inspector</div>
            </div>
          </div>
          
        </div>
      </div>

      <div className="pt-4">
        <Button type="button" size="lg" onClick={() => setShowConfirm(true)} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-500/20 rounded-xl py-4 text-lg border-none">
          <PaperPlaneTilt size={20} weight="bold" className="mr-2 inline" /> ยืนยันและส่งสลิปคำขอ
        </Button>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="ยืนยันส่งข้อมูลแก้ไของค์กร?"
        message={`คุณต้องการยืนยันการส่งข้อมูลของ ${formData.orgName} ใช่หรือไม่? โปรดตรวจสอบรายละเอียดให้แน่ใจ`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
