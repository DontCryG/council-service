import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react';

export default function WelfarePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  const captureRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const { formData, vehicles } = location.state || {};
  const [refNumber] = useState(() => `CS-WELFARE-${Math.floor(1000 + Math.random() * 9000)}`);

  if (!formData) {
    navigate('/welfare');
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        cacheBust: true
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'welfare.png');
      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "🧾 WELFARE REQUEST RECEIPT",
          color: 0x10b981,
          fields: [
            { name: "📋 ประเภท", value: formData.orgType, inline: true },
            { name: "🏢 ชื่อสังกัด", value: formData.orgName, inline: true },
            { name: "👤 ผู้เบิกสวัสดิการ", value: formData.requester, inline: false },
            { name: "⚔️ สวัสดิการอาวุธไม้พูล", value: formData.hasWeaponWelfare ? '✅ รับสวัสดิการอาวุธไม้พูล' : '❌ ไม่รับ', inline: true },
            { name: "🚗 ยานพาหนะ", value: vehicles.length > 0 ? vehicles.map(v => `${v.model} (${v.plate})`).join('\n') : 'ไม่มี', inline: false },
            { name: "📦 อื่นๆ", value: formData.otherWelfare || '-', inline: true },
          ],
          image: {
            url: "attachment://welfare.png"
          },
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('welfare', fd);
      await saveTransactionLog('welfare', {
        refNumber: refNumber,
        orgType: formData.orgType,
        orgName: formData.orgName,
        requester: formData.requester,
        vehicles: vehicles,
        hasWeaponWelfare: formData.hasWeaponWelfare,
        otherWelfare: formData.otherWelfare
      }, user);
      showAlert('success', 'ส่งคำขอเบิกสวัสดิการเรียบร้อยแล้ว !');
      navigate('/home');
      
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => navigate('/welfare', { state: { formData, vehicles } })} className="text-slate-400 hover:text-white px-0">
          <ArrowLeft size={20} className="mr-2" /> กลับไปแก้ไข
        </Button>
        <h2 className="text-xl font-bold text-white">ตรวจสอบความถูกต้องก่อนยืนยัน</h2>
        <div className="w-[100px]"></div> {/* spacer for centering */}
      </div>

      <div ref={captureRef} className="bg-white rounded-xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-slate-800 font-sans border-t-[6px] border-amber-500 min-h-[600px] mb-8">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src="/logo.png" alt="watermark" className="w-[80%] h-[80%] object-contain" />
        </div>

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div className="w-16 h-16">
            <img src="/logo.png" alt="Council Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">ฝ่ายจัดสรรสวัสดิการ</h2>
            <p className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">WELFARE ALLOCATION DEPARTMENT</p>
          </div>
        </div>

        <div className="text-center mb-10 relative z-10">
          <h1 className="text-2xl font-black text-slate-800 inline-block border-b-2 border-slate-800 pb-1 mb-2">สัญญารับสวัสดิการจากสภา</h1>
          <p className="text-xs text-slate-500 font-bold">เลขที่อ้างอิง: {refNumber}</p>
        </div>

        <div className="mb-8 leading-relaxed text-slate-800 text-sm font-medium relative z-10">
          <div className="flex items-end gap-2 mb-4">
            <span className="font-bold whitespace-nowrap text-base">ข้าพเจ้า</span>
            <span className="flex-1 border-b border-slate-300 pb-1 font-bold text-center text-lg">{formData.requester || '.......................................................'}</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-bold whitespace-nowrap text-base">อยู่ในสังกัด</span>
            <span className="w-1/3 border-b border-slate-300 pb-1 font-bold text-center text-lg">{formData.orgName || '..........................'}</span>
            <span className="font-bold whitespace-nowrap ml-2 text-base">ได้รับสวัสดิการดังรายการต่อไปนี้:</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8 relative z-10">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-wider mb-4 uppercase">รายการสวัสดิการที่ได้รับ (WELFARE ITEMS)</h3>
          <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
            {formData.hasWeaponWelfare && (
              <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                <span className="text-amber-500 text-lg leading-none">›</span> อาวุธ: ไม้พลู
              </div>
            )}
            {vehicles.map((v, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                 <span className="text-amber-500 text-lg leading-none">›</span> พาหนะ: {v.model || '...'} {v.plate ? `(${v.plate})` : ''}
              </div>
            ))}
            {formData.otherWelfare && (
              <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                 <span className="text-amber-500 text-lg leading-none">›</span> อื่นๆ: {formData.otherWelfare}
              </div>
            )}
            {!formData.hasWeaponWelfare && vehicles.length === 0 && !formData.otherWelfare && (
              <div className="text-slate-400 italic text-sm">- ยังไม่มีการระบุสวัสดิการ -</div>
            )}
          </div>
        </div>

        <div className="border-l-4 border-amber-500 pl-6 mb-8 text-slate-600 text-[13px] leading-relaxed space-y-4 relative z-10">
          <p><strong className="text-slate-800">ข้อตกลงและเงื่อนไข:</strong> ข้าพเจ้ายินยอมและตกลงว่าจะปฏิบัติตามกฎ ระเบียบ ข้อบังคับ ประกาศ และคำสั่งของสภาทุกประการ รวมถึงยอมรับเงื่อนไขในการรับสวัสดิการจากสภาตามที่สภากำหนด โดยไม่มีข้อโต้แย้งใด ๆ</p>
          <p>สัญญาฉบับนี้ให้มีผลบังคับใช้เป็นระยะเวลา <strong className="text-slate-800">ไม่น้อยกว่า 3 เดือน</strong> นับตั้งแต่วันที่ข้าพเจ้าได้ให้ความยินยอมผ่านระบบ หรือวันที่ลงนามในเอกสารนี้</p>
          <p>ในกรณีที่ข้าพเจ้าฝ่าฝืน หรือประสงค์จะยกเลิกสัญญาก่อนครบกำหนด ข้าพเจ้ายินยอมให้การพิจารณา การลงโทษ การระงับสิทธิ์ หรือมาตรการอื่นใด เป็นไปตามดุลยพินิจของสภา โดยถือว่าคำวินิจฉัยของสภาเป็นที่สิ้นสุด</p>
        </div>

        <label className="bg-[#fff9eb] border border-[#fde68a] rounded-lg p-4 mb-12 flex items-start gap-4 relative z-10 cursor-pointer hover:bg-[#fefce8] transition-colors">
          <input 
            type="checkbox" 
            className="w-5 h-5 mt-0.5 rounded border-slate-300 bg-white flex-shrink-0 cursor-pointer accent-amber-500"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
          />
          <p className="text-[#854d0e] text-[13px] font-bold leading-snug">
            ข้าพเจ้าได้อ่านและยอมรับข้อตกลง กฎของสภา และเงื่อนไขการรับสวัสดิการทั้งหมด สัญญามีอายุไม่น้อยกว่า&nbsp;3&nbsp;เดือน
          </p>
        </label>

        <div className="flex justify-between items-end relative z-10">
          <div>
            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1">สถานะสัญญา</div>
            <div className="inline-block bg-[#dcfce7] text-[#166534] text-[11px] font-bold px-3 py-1 rounded-full border border-[#bbf7d0]">CERTIFIED BY COUNCIL</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 italic mb-2">Digitally Signed</div>
            <div className="border-t border-slate-200 pt-2 px-8">
              <p className="font-bold text-slate-800 text-sm">ระบบสภาส่วนกลาง</p>
              <p className="text-[10px] text-slate-500 mt-1">{new Date().toLocaleString('th-TH')}</p>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!isAgreed}
        className={`w-full h-14 text-base shadow-lg rounded-xl transition-all ${isAgreed ? 'shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} 
        isLoading={isSubmitting}
      >
        <PaperPlaneTilt size={20} weight="bold" /> ยืนยันความถูกต้องและส่งสัญญาสวัสดิการ
      </Button>
    </div>
  );
}
