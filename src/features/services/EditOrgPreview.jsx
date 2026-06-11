import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react';

export default function EditOrgPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, user } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const captureRef = useRef(null);

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
        backgroundColor: '#f1f5f9',
        cacheBust: true 
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'edit_org.png');
      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "🔄 ORGANIZATION EDIT REQUEST",
          color: 0xec4899,
          thumbnail: formData.logoUrl ? { url: formData.logoUrl } : undefined,
          fields: [
            { name: "🏰 แก๊ง/แฟมิลี่", value: `${formData.orgName} (${formData.orgType})`, inline: true },
            { name: "👤 ผู้แจ้ง", value: formData.requester, inline: true },
            { name: "รายการที่แก้ไข", value: [
                formData.changeInfo ? "✅ เปลี่ยนข้อมูล Gang" : "",
                formData.editTexture ? `✅ แก้ไข Texture เสื้อผ้า (${formData.textureCount} ชุด)` : "",
                formData.addCloth ? `✅ ลงชุดเพิ่ม (${formData.textureCount} ชุด)` : "",
                formData.bulkChange ? "✅ เหมาเปลี่ยนข้อมูล Gang" : "",
                formData.addAccessory ? `✅ ลง Accessories Adons เสริม` : ""
            ].filter(Boolean).join('\n') || "ไม่มี", inline: false },
            { name: "รายละเอียดเพิ่มเติมที่ต้องการแก้", value: formData.extraDetails || "-", inline: false },
            { name: "เจ้าหน้าที่สภาผู้รับเรื่อง", value: councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-', inline: true },
          ],
          image: {
            url: "attachment://edit_org.png"
          },
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('edit_org', fd);
      await saveTransactionLog('edit_org', {
        orgName: formData.orgName,
        orgType: formData.orgType,
        requester: formData.requester,
        councilStaffId: formData.councilStaffId,
        changeInfo: formData.changeInfo,
        editTexture: formData.editTexture,
        addCloth: formData.addCloth,
        bulkChange: formData.bulkChange,
        addAccessory: formData.addAccessory
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
          <p className="text-slate-400">โปรดตรวจสอบรายละเอียดให้แน่ใจก่อนทำการส่งข้อมูล</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/edit_org', { state: { formData, step: 2 } })} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับเพื่อแก้ไข
        </Button>
      </div>

      <div className="bg-[#f1f5f9] p-6 rounded-[24px]">
        <div ref={captureRef} className="bg-white rounded-xl p-8 border border-slate-300 shadow-xl relative overflow-hidden" style={{ color: '#1e293b' }}>
          <div className="flex flex-row items-end justify-between border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex flex-col justify-end">
              <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ color: '#000', lineHeight: '1.1' }}>
                {formData.orgName || 'ORGANIZATION'}
              </h2>
              <div className="text-slate-500 font-bold tracking-wider text-sm mt-1 whitespace-nowrap w-max">
                <span>{formData.orgType} MODIFICATION</span>
              </div>
            </div>
            {(formData.changeInfo || formData.bulkChange) && formData.logoUrl && (
              <div className="ml-4 shrink-0">
                <img src={formData.logoUrl} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md rounded" crossOrigin="anonymous"/>
              </div>
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
            <ul className="text-sm flex flex-col gap-2 list-none pl-0 text-slate-700 font-medium">
              {formData.changeInfo && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">✅ เปลี่ยนข้อมูล Gang</span> <span>$500,000</span></li>}
              {formData.editTexture && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">✅ แก้ไข Texture เสื้อผ้า ({formData.textureCount} ชุด)</span> <span>${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}</span></li>}
              {formData.addCloth && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">✅ ลงชุดเพิ่ม ({formData.textureCount} ชุด)</span> <span>${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}</span></li>}
              {formData.bulkChange && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">✅ เหมาเปลี่ยนข้อมูล Gang</span> <span>$1,500,000</span></li>}
              {formData.addAccessory && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">✅ ลง Accessories Adons เสริม</span> <span>$1,000,000</span></li>}
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

      <div className="pt-6">
        <Button type="button" size="lg" onClick={() => setShowConfirm(true)} className="w-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20 rounded-xl py-4 text-lg">
          <PaperPlaneTilt size={20} weight="bold" className="mr-2 inline" /> ยืนยันการส่งข้อมูล
        </Button>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="ยืนยันส่งข้อมูลแก้ไของค์กร?"
        message={`คุณต้องการยืนยันการส่งข้อมูลของแก๊ง ${formData.orgName} ใช่หรือไม่? โปรดตรวจสอบรายละเอียดให้แน่ใจ`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
