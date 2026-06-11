import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, ArrowLeft, CheckCircle } from '@phosphor-icons/react';

export default function EditOrgPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, user } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const captureRef = useRef(null);

  const { formData } = location.state || {};
  const [refNumber] = useState(() => `CS-ORG-${Math.floor(1000 + Math.random() * 9000)}`);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#0f172a',
        cacheBust: true 
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'receipt.png');
      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "🔄 ORGANIZATION EDIT REQUEST",
          color: 0xf59e0b, // Amber color
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
            url: "attachment://receipt.png"
          },
          footer: { text: `Ref: ${refNumber} | Council Secretary System` },
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
      navigate('/home');
      
    } catch (err) {
      console.error(err);
      showAlert('error', `เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถส่งข้อมูลได้'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white px-0">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับไปแก้ไข
        </Button>
        <h2 className="text-xl font-bold text-white">ตรวจสอบข้อมูลก่อนส่ง</h2>
        <div className="w-[100px]"></div>
      </div>

      <div ref={captureRef} className="bg-slate-900 rounded-xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">COUNCIL RECEIPT</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider">Official Service Record</p>
          <p className="text-xs text-slate-500 mt-2 tracking-widest">REF: {refNumber}</p>
        </div>

        <div className="space-y-4 relative z-10">
          
          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400">ชื่อกลุ่ม ({formData.orgType})</span>
            <span className="font-bold text-amber-400 flex items-center">
              <span className={`text-[10px] px-2 py-0.5 rounded mr-2 bg-amber-500/20 text-amber-400`}>
                {formData.orgType}
              </span>
              {formData.orgName || '-'}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400">ผู้ทำรายการ</span>
            <span className="font-medium text-white">{formData.requester || '-'}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400">Theme Color (New)</span>
            <div className="flex items-center gap-2 font-mono font-bold text-white">
              <div className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: formData.hexColor }}></div>
              {formData.hexColor || '#000000'}
            </div>
          </div>

          <div className="py-3 border-b border-slate-800/50">
            <span className="text-slate-400 block mb-2">รายการที่ต้องการแก้ไข</span>
            <div className="bg-slate-950 rounded-lg p-3">
              {formData.changeInfo && <div className="flex justify-between items-center text-sm text-slate-300 mb-2 last:mb-0"><span className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> เปลี่ยนข้อมูล Gang</span><span className="font-mono text-amber-400">500,000 $</span></div>}
              {formData.editTexture && <div className="flex justify-between items-center text-sm text-slate-300 mb-2 last:mb-0"><span className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> แก้ไข Texture เสื้อผ้า ({formData.textureCount} ชุด)</span><span className="font-mono text-amber-400">{(500000 * Math.max(1, formData.textureCount)).toLocaleString()} $</span></div>}
              {formData.addCloth && <div className="flex justify-between items-center text-sm text-slate-300 mb-2 last:mb-0"><span className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> ลงชุดเพิ่ม ({formData.textureCount} ชุด)</span><span className="font-mono text-amber-400">{(500000 * Math.max(1, formData.textureCount)).toLocaleString()} $</span></div>}
              {formData.bulkChange && <div className="flex justify-between items-center text-sm text-slate-300 mb-2 last:mb-0"><span className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> เหมาเปลี่ยนข้อมูล Gang</span><span className="font-mono text-amber-400">1,500,000 $</span></div>}
              {formData.addAccessory && <div className="flex justify-between items-center text-sm text-slate-300 mb-2 last:mb-0"><span className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> ลง Accessories Adons เสริม</span><span className="font-mono text-amber-400">1,000,000 $</span></div>}
            </div>
          </div>

          {formData.extraDetails && (
            <div className="py-3 border-b border-slate-800/50">
              <span className="text-slate-400 block mb-2">รายละเอียดเพิ่มเติม</span>
              <div className="text-sm text-slate-300 whitespace-pre-wrap">{formData.extraDetails}</div>
            </div>
          )}

          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400 whitespace-nowrap">เจ้าหน้าที่ผู้รับเรื่อง (สภา)</span>
            <span className="font-medium text-amber-500 whitespace-nowrap text-right pl-4">
              {councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-'}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-700 flex justify-between items-end">
            <span className="text-slate-400 uppercase tracking-wider text-sm font-bold whitespace-nowrap">Total Amount</span>
            <span className="text-4xl font-black text-emerald-400 tracking-tight whitespace-nowrap">
              ${calculateTotal().toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
            <input 
              type="checkbox" 
              className="peer sr-only"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
            />
            <div className="w-6 h-6 border-2 border-slate-600 rounded bg-slate-800 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors"></div>
            <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-bold text-white mb-1 block">ข้าพเจ้าขอยืนยันว่าข้อมูลการทำธุรกรรมทั้งหมดถูกต้องและเป็นความจริง</span>
            หากตรวจพบว่าข้อมูลเป็นเท็จ ทางสภาขอสงวนสิทธิ์ในการยกเลิกและไม่อนุมัติการให้บริการทุกกรณี
          </div>
        </label>
      </div>

      <Button 
        type="button" 
        className="w-full text-lg py-4 shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-500 text-white" 
        size="lg" 
        isLoading={isSubmitting}
        disabled={!isAgreed || isSubmitting}
        onClick={handleSubmit}
      >
        <PaperPlaneTilt size={24} weight="fill" className="mr-2" />
        ยืนยันการทำธุรกรรมและส่งข้อมูล
      </Button>
    </div>
  );
}
