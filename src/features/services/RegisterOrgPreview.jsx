import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react';

export default function RegisterOrgPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  const captureRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const { formData, councilMembers, coLeaders, members } = location.state || {};
  const [refNumber] = useState(() => `CS-REG-${Math.floor(1000 + Math.random() * 9000)}`);

  if (!formData) {
    navigate('/register_org');
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#f1f5f9',
        cacheBust: true 
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'register.png');
      const typeDisplay = formData.orgType === 'GANG' ? 'แก๊ง' : 'ครอบครัว';
      const councilName = councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-';

      const coLeaderText = coLeaders.length > 0 ? `**รองหัวหน้า:** ${coLeaders.map(c => c.name).join(', ')}` : '';
      const memberText = members.length > 0 ? `**สมาชิก:**\n${members.map(m => m.name).join('\n')}` : '';
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
            { name: "Transaction", value: "รับรององค์กรอย่างเป็นทางการ", inline: false },
            { name: "Roster", value: membersFullText.substring(0, 1024) || '-', inline: false },
            { name: "Council Inspector", value: councilName, inline: false },
          ],
          image: {
            url: "attachment://register.png"
          },
          footer: { text: `Ref: ${refNumber} | Server System` },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('register', fd);
      await saveTransactionLog('register_org', {
        orgType: formData.orgType,
        orgName: formData.name,
        alias: formData.alias,
        leader: formData.leader,
        councilInspector: councilName,
        membersCount: members.length,
        coLeadersCount: coLeaders.length
      }, user);

      showAlert('success', 'บันทึกข้อมูลและออกเอกสารรับรองสำเร็จ !');
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
        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white px-0">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับไปแก้ไข
        </Button>
        <h2 className="text-xl font-bold text-white">ตรวจสอบเอกสารรับรององค์กร</h2>
        <div className="w-[100px]"></div>
      </div>

      <div ref={captureRef} className="bg-slate-100 rounded-xl p-8 border border-slate-300 shadow-2xl relative overflow-hidden text-slate-800 mb-8" style={{ color: '#1e293b' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">REF NO: {refNumber}</div>
            <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ color: '#000' }}>
              {formData.name || 'ORGANIZATION'}
            </h2>
            <p className="text-slate-500 font-bold tracking-widest">{formData.orgType} REGISTRATION</p>
          </div>
          {formData.logo ? (
            <img src={formData.logo} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md rounded" crossOrigin="anonymous"/>
          ) : (
            <div className="w-20 h-20 bg-slate-200 border-2 border-dashed border-slate-400 rounded flex items-center justify-center">
              <span className="text-slate-400 text-xs">NO LOGO</span>
            </div>
          )}
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold">Alias</div>
            <div className="font-bold text-lg">{formData.alias || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold">Theme Color</div>
            <div className="flex items-center gap-2 font-mono font-bold">
              <div className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: formData.color }}></div>
              {formData.color}
            </div>
          </div>
          <div className="col-span-2 p-3 bg-blue-50 border-l-4 border-blue-500">
            <div className="text-xs text-blue-800 uppercase font-bold mb-1">Leader (ผู้นำ / หัวหน้า)</div>
            <div className="font-black text-xl text-blue-900">{formData.leader || '...'}</div>
          </div>
        </div>

        {/* Lists */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">Co-Leaders ({coLeaders.length})</div>
            {coLeaders.length === 0 && <div className="text-slate-400 text-sm">-</div>}
            <ul className="text-sm space-y-1 list-disc pl-4 text-slate-700 font-medium">
              {coLeaders.map(c => <li key={c.id}>{c.name} {c.phone && <span className="text-xs text-slate-500">({c.phone})</span>}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">Members ({members.length})</div>
            {members.length === 0 && <div className="text-slate-400 text-sm">-</div>}
            <ul className="text-sm space-y-1 list-disc pl-4 text-slate-700 font-medium">
              {members.map(m => <li key={m.id}>{m.name} {m.phone && <span className="text-xs text-slate-500">({m.phone})</span>}</li>)}
            </ul>
          </div>
        </div>

        {/* Fee Section */}
        <div className="mt-2 mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex justify-between items-center">
          <span className="font-bold text-amber-800 uppercase tracking-wider whitespace-nowrap text-lg">Registration Fee</span>
          <span className="text-3xl font-black text-amber-600 tracking-tighter whitespace-nowrap">$200,000</span>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end pt-8 mt-4 border-t-2 border-slate-300">
          <div className="text-center w-40">
            <div className="border-b border-slate-800 pb-1 font-signature text-2xl">{formData.leader || '...'}</div>
            <div className="text-xs mt-1">Leader Signature</div>
          </div>
          
          {/* Stamp */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 rotate-[-15deg] pointer-events-none">
            <div className="w-32 h-32 border-8 border-red-600 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-black text-2xl uppercase text-center leading-tight">APPROVED<br/>COUNCIL</span>
            </div>
          </div>

          <div className="text-center w-40">
            <div className="border-b border-slate-800 pb-1 font-medium">{councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}</div>
            <div className="text-xs mt-1">Council Inspector</div>
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
            <div className="w-6 h-6 border-2 border-slate-600 rounded bg-slate-800 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors"></div>
            <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-bold text-white mb-1 block">ข้าพเจ้าขอยืนยันว่าข้อมูลทั้งหมดถูกต้องและเป็นความจริง</span>
            หากตรวจพบว่าข้อมูลเป็นเท็จ ทางสภาขอสงวนสิทธิ์ในการยกเลิกและไม่อนุมัติการจดทะเบียนทุกกรณี
          </div>
        </label>
      </div>

      <Button 
        type="button" 
        className="w-full text-lg py-4 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white" 
        size="lg" 
        isLoading={isSubmitting}
        disabled={!isAgreed || isSubmitting}
        onClick={handleSubmit}
      >
        <PaperPlaneTilt size={24} weight="fill" className="mr-2" />
        ยืนยันการจัดตั้งและส่งข้อมูล
      </Button>
    </div>
  );
}
