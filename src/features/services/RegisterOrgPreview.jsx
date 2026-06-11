import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react';
import { Buildings } from '@phosphor-icons/react';

export default function RegisterOrgPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  const captureRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const { formData, councilMembers, coLeaders, members } = location.state || {};
  const [refNumber] = useState(() => `REG-ORG-${Math.floor(1000 + Math.random() * 9000)}`);

  if (!formData) {
    navigate('/register_org');
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
      
      const fd = new FormData();
      fd.append('file', blob, 'register.png');
      const typeDisplay = formData.orgType === 'GANG' ? 'แก๊ง' : 'ครอบครัว';
      const councilName = councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-';

      const coLeaderText = coLeaders.length > 0 ? `**รองหัวหน้า:** ${coLeaders.map(c => c.name).join(', ')}` : '';
      const memberText = members.length > 0 ? `**สมาชิกเริ่มต้น:**\n${members.map(m => m.name).join('\n')}` : '';
      const membersFullText = [
        `**หัวหน้า:** ${formData.leader}`,
        coLeaderText,
        memberText
      ].filter(Boolean).join('\n');

      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "Council Service Log",
          description: "Organization registration submitted",
          color: 0xf59e0b,
          thumbnail: formData.logo ? { url: formData.logo } : undefined,
          fields: [
            { name: "Type", value: typeDisplay, inline: true },
            { name: "Group", value: formData.alias ? `[${formData.alias}] ${formData.name || '-'}` : (formData.name || '-'), inline: true },
            { name: "Theme Color", value: formData.color || '-', inline: true },
            { name: "Transaction", value: "ขึ้นทะเบียนสังกัดใหม่", inline: false },
            { name: "Members", value: membersFullText || '-', inline: false },
            { name: "Council", value: councilName, inline: false }
          ],
          image: {
            url: "attachment://register.png"
          },
          footer: { text: `Ref: ${refNumber} | Server System` },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('register_org', fd);
      await saveTransactionLog('register_org', {
        orgType: formData.orgType,
        name: formData.name,
        alias: formData.alias,
        color: formData.color,
        coLeaders: coLeaders.map(c => c.name),
        members: members.map(m => m.name),
        councilStaffId: formData.councilStaffId
      }, user);

      showAlert('success', 'ขึ้นทะเบียนสังกัดใหม่สำเร็จ !');
      navigate('/home');
      
    } catch (err) {
      console.error(err);
      showAlert('error', `ไม่สามารถส่งข้อมูลได้: ${err.message || 'โปรดลองอีกครั้ง'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => navigate('/register_org', { state: { formData, coLeaders, members, step: 2 } })} className="text-slate-400 hover:text-white px-0">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับไปแก้ไข
        </Button>
        <h2 className="text-xl font-bold text-white">ตรวจสอบข้อมูลลงทะเบียนองค์กรใหม่</h2>
        <div className="w-[100px]"></div>
      </div>

      <div ref={captureRef} className="bg-slate-900 rounded-xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 mb-8 relative z-10 border-b border-slate-800 pb-8">
          <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative">
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }} />
            ) : null}
            <div className={`absolute inset-0 flex items-center justify-center ${formData.logo ? 'hidden' : 'flex'}`}>
              <Buildings size={40} className="text-slate-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-white tracking-wider flex items-center gap-3">
              {formData.alias ? (
                <span className="text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg text-xl border border-amber-500/20">
                  {formData.alias}
                </span>
              ) : null}
              {formData.name || 'UNNAMED ORGANIZATION'}
            </h2>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-slate-400 text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color || '#333' }}></span>
                HEX: <span className="font-mono text-slate-300">{formData.color || '#000000'}</span>
              </span>
              <span className="text-slate-600 text-sm">|</span>
              <span className="text-slate-400 text-sm">REF: {refNumber}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-2 block">Leader (หัวหน้า)</span>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-medium flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">L</div>
                {formData.leader || '-'}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-2 block flex justify-between">
                <span>Co-Leaders (รองหัวหน้า)</span>
                <span>{coLeaders.length} คน</span>
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 min-h-[80px]">
                {coLeaders.length > 0 ? coLeaders.map((c, i) => (
                  <div key={i} className="text-slate-300 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    {c.name || '-'}
                  </div>
                )) : <div className="text-slate-600 text-sm italic">ไม่มีรองหัวหน้า</div>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-2 block flex justify-between">
                <span>Founding Members (สมาชิกเริ่มต้น)</span>
                <span>{members.length} คน</span>
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 min-h-[168px]">
                {members.length > 0 ? members.map((m, i) => (
                  <div key={i} className="text-slate-300 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    {m.name || '-'}
                  </div>
                )) : <div className="text-slate-600 text-sm italic">ไม่มีสมาชิกเริ่มต้น</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center relative z-10">
          <span className="text-slate-400 text-sm">เจ้าหน้าที่ผู้รับเรื่อง (สภา)</span>
          <span className="font-bold text-amber-500">
            {councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-'}
          </span>
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
            <span className="font-bold text-white mb-1 block">ข้าพเจ้าขอยืนยันว่าข้อมูลทั้งหมดถูกต้องและเป็นความจริง</span>
            หากตรวจพบว่ามีการนำสัญลักษณ์ โลโก้ หรือชื่อที่ละเมิดลิขสิทธิ์มาใช้ ทางสภาขอสงวนสิทธิ์ในการยกเลิกและไม่อนุมัติการจดทะเบียน
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
        ยืนยันการขึ้นทะเบียนและส่งข้อมูล
      </Button>
    </div>
  );
}
