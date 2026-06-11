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
        backgroundColor: '#0f172a',
        cacheBust: true
      });
      if (!blob) throw new Error("Failed to generate image");
      
      let welfareItems = [];
      if (formData.hasWeaponWelfare) welfareItems.push("รถ: อาวุธไม้พูล");
      if (vehicles && vehicles.length > 0) {
        vehicles.forEach(v => welfareItems.push(`รถ: ${v.plate || '-'} (${v.model || '-'})`));
      }
      if (formData.otherWelfare) welfareItems.push(`อื่นๆ: ${formData.otherWelfare}`);
      
      const welfareListText = welfareItems.length > 0 ? "```\n" + welfareItems.join("\n") + "\n```" : "```\n- ไม่มีรายการ -\n```";

      const fd = new FormData();
      fd.append('file', blob, 'welfare.png');
      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "📜 ตรวจพบการลงนามรับสวัสดิการใหม่",
          description: `**เลขที่อ้างอิง:** ${refNumber}`,
          color: 0xfacc15,
          fields: [
            { name: "🏢 สังกัด", value: formData.orgName || '-', inline: true },
            { name: "✍️ ผู้ลงนาม", value: formData.requester || '-', inline: true },
            { name: "🎁 รายการสวัสดิการ", value: welfareListText, inline: false },
          ],
          image: {
            url: "attachment://welfare.png"
          },
          footer: { text: `Ref: ${refNumber} | Server System` },
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

      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div ref={captureRef} className="w-[800px] shrink-0 bg-slate-900 rounded-xl p-8 sm:p-12 border-2 border-slate-800 shadow-2xl relative overflow-hidden text-slate-200 min-h-[600px] mb-8">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
          
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
            <img src="/logo.png" alt="watermark" className="w-[80%] h-[80%] object-contain grayscale" />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-10 relative z-10 border-b border-slate-800 pb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-950 rounded-2xl border border-slate-800 p-3 shadow-lg shrink-0">
                <img src="/logo.png" alt="Council Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-wider whitespace-nowrap">WELFARE <span className="text-amber-500">AGREEMENT</span></h2>
                <p className="text-sm font-bold text-slate-500 tracking-widest mt-1 whitespace-nowrap">COUNCIL ALLOCATION DEPARTMENT</p>
              </div>
            </div>
          <div className="text-right">
            <div className="inline-block bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
              <p className="text-[10px] text-amber-500/70 font-bold tracking-widest uppercase mb-1">Agreement Reference</p>
              <p className="text-sm font-mono font-bold text-amber-500">{refNumber}</p>
            </div>
          </div>
        </div>

        {/* Parties Info */}
        <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Representative (ผู้ลงนาม)</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                {formData.requester ? formData.requester.charAt(0).toUpperCase() : '?'}
              </div>
              <p className="text-lg font-bold text-white">{formData.requester || 'UNSPECIFIED'}</p>
            </div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Organization (สังกัด)</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                {formData.orgType === 'FAMILY' ? 'F' : 'G'}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formData.orgName || 'UNSPECIFIED'}</p>
                <p className="text-[10px] text-amber-500 font-bold tracking-wider">{formData.orgType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Welfare Items */}
        <div className="mb-10 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-slate-800"></div>
            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase px-4">Allocated Welfare Items</h3>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {formData.hasWeaponWelfare && (
              <div className="flex items-center gap-4 bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-lg">⚔️</div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Weapon Welfare</p>
                  <p className="text-base font-bold text-white">อาวุธ: ไม้พูล</p>
                </div>
              </div>
            )}
            
            {vehicles.map((v, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">🚗</div>
                <div className="flex-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vehicle Welfare</p>
                  <p className="text-base font-bold text-white">{v.model || 'Unknown Model'}</p>
                </div>
                {v.plate && (
                  <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1">
                    <p className="text-[10px] text-slate-500 font-bold mb-0.5">PLATE</p>
                    <p className="text-sm font-mono font-bold text-slate-300">{v.plate}</p>
                  </div>
                )}
              </div>
            ))}

            {formData.otherWelfare && (
              <div className="flex items-center gap-4 bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg">🎁</div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Other Welfare</p>
                  <p className="text-base font-bold text-white">{formData.otherWelfare}</p>
                </div>
              </div>
            )}

            {!formData.hasWeaponWelfare && vehicles.length === 0 && !formData.otherWelfare && (
              <div className="text-center py-8 bg-slate-900/50 border border-slate-800 rounded-lg border-dashed">
                <p className="text-slate-500 italic font-medium">No welfare items specified</p>
              </div>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-amber-500/5 border-l-4 border-amber-500 rounded-r-lg p-6 mb-10 relative z-10">
          <h4 className="text-amber-500 font-bold text-sm tracking-wider uppercase mb-3">Terms & Conditions</h4>
          <div className="space-y-3 text-[13px] text-slate-300 leading-relaxed font-medium">
            <p>1. ข้าพเจ้ายินยอมและตกลงว่าจะปฏิบัติตามกฎ ระเบียบ ข้อบังคับ ประกาศ และคำสั่งของสภาทุกประการ รวมถึงยอมรับเงื่อนไขในการรับสวัสดิการจากสภาตามที่สภากำหนด โดยไม่มีข้อโต้แย้งใด ๆ</p>
            <p>2. สัญญาฉบับนี้ให้มีผลบังคับใช้เป็นระยะเวลา <strong className="text-white">ไม่น้อยกว่า 3 เดือน</strong> นับตั้งแต่วันที่ข้าพเจ้าได้ให้ความยินยอมผ่านระบบ</p>
            <p>3. ในกรณีที่ข้าพเจ้าฝ่าฝืน หรือประสงค์จะยกเลิกสัญญาก่อนครบกำหนด ข้าพเจ้ายินยอมให้การพิจารณา การลงโทษ การระงับสิทธิ์ หรือมาตรการอื่นใด เป็นไปตามดุลยพินิจของสภา โดยถือว่าคำวินิจฉัยของสภาเป็นที่สิ้นสุด</p>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="flex justify-between items-end relative z-10 pt-6 border-t border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">System Status</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-[12px] font-bold px-4 py-2 rounded-lg border border-emerald-500/20">
              ✓ CERTIFIED BY COUNCIL
            </div>
          </div>
          
          <div className="text-right">
            <div className="inline-block">
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-2 text-center">Digital Signature</p>
              <div className="border-b border-slate-700 pb-2 mb-2 px-8">
                <p className="font-black text-white text-lg tracking-wider font-mono opacity-80">{formData.requester}</p>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleString('th-TH')}</p>
            </div>
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
            <div className="w-6 h-6 border-2 border-slate-600 rounded bg-slate-800 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
            <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-bold text-white mb-1 block">ข้าพเจ้าได้อ่านและยอมรับข้อตกลง กฎของสภา และเงื่อนไขการรับสวัสดิการทั้งหมด</span>
            สัญญามีอายุไม่น้อยกว่า 3 เดือน นับตั้งแต่วันที่ให้ความยินยอมผ่านระบบ
          </div>
        </label>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!isAgreed}
        className={`w-full h-14 text-base shadow-lg rounded-xl transition-all ${isAgreed ? 'shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`} 
        isLoading={isSubmitting}
      >
        <PaperPlaneTilt size={20} weight="bold" /> ยืนยันความถูกต้องและส่งสัญญาสวัสดิการ
      </Button>
    </div>
  );
}
