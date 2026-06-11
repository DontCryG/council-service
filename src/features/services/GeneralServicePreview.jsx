import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react';
import { transactions } from '../../data/models';
import { UserCircle } from '@phosphor-icons/react';

export default function GeneralServicePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  const captureRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const { formData, councilMembers, members } = location.state || {};
  const [refNumber] = useState(() => `CS-SVC-${Math.floor(1000 + Math.random() * 9000)}`);

  if (!formData) {
    navigate('/ps1');
    return null;
  }

  const selectedTransaction = transactions.find(t => t.id === parseInt(formData.transactionId));
  const totalAmount = selectedTransaction 
    ? (selectedTransaction.type === 'per_head' ? selectedTransaction.price * members.length : selectedTransaction.price)
    : 0;

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
      const typeDisplay = formData.groupType === 'GANG' ? 'แก๊ง' : 'ครอบครัว';
      const councilName = councilMembers.find(c => c.id === formData.councilMemberId)?.name || '-';
      const membersText = members.map(m => m.value).join('\n');

      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "Council Service Log",
          description: "Service request submitted",
          color: 0xf59e0b,
          fields: [
            { name: "Type", value: typeDisplay, inline: true },
            { name: "Group", value: formData.groupName || '-', inline: true },
            { name: "Requester", value: formData.requester || '-', inline: false },
            { name: "Transaction", value: selectedTransaction?.name || '-', inline: false },
            { name: "Members", value: `\`\`\`\n${membersText || '-'}\n\`\`\``, inline: false },
            { name: "Council", value: councilName, inline: false }
          ],
          image: {
            url: "attachment://receipt.png"
          },
          footer: { text: `Ref: ${refNumber} | Server System` },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('general', fd);
      await saveTransactionLog('general_service', {
        orgType: formData.groupType,
        groupName: formData.groupName,
        requester: formData.requester,
        transactionId: formData.transactionId,
        councilMemberId: formData.councilMemberId,
        members: members.map(m => m.value)
      }, user);

      showAlert('success', 'บันทึกข้อมูลและออกใบเสร็จสำเร็จ !');
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
        <h2 className="text-xl font-bold text-white">ตรวจสอบเอกสารให้บริการทั่วไป</h2>
        <div className="w-[100px]"></div>
      </div>

      <div ref={captureRef} className="bg-slate-900 rounded-xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">COUNCIL RECEIPT</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider">Official Service Record</p>
          <p className="text-xs text-slate-500 mt-2 tracking-widest">REF: {refNumber}</p>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400">รายการธุรกรรม</span>
            <span className="font-bold text-white text-right max-w-[200px]">{selectedTransaction?.name || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400">ชื่อกลุ่ม ({formData.groupType?.trim()})</span>
            <span className="font-bold text-blue-400 flex items-center">
              <span className={`text-[10px] px-2 py-0.5 rounded mr-2 ${formData.groupType === 'FAMILY' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {formData.groupType?.trim()}
              </span>
              {formData.groupName || '-'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400">ผู้ทำรายการ</span>
            <span className="font-medium text-white">{formData.requester || '-'}</span>
          </div>
          
          <div className="py-3 border-b border-slate-800/50">
            <span className="text-slate-400 block mb-2">รายชื่อผู้เกี่ยวข้อง ({members.length} คน)</span>
            <div className="bg-slate-950 rounded-lg p-3 max-h-[120px] overflow-y-auto custom-scrollbar">
              {members.map((m, i) => (
                <div key={i} className="text-sm text-slate-300 flex items-center gap-2 mb-1">
                  <UserCircle size={16} className="text-slate-500" /> {m.value || '...'}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-slate-400 whitespace-nowrap">เจ้าหน้าที่ผู้รับเรื่อง (สภา)</span>
            <span className="font-medium text-amber-500 whitespace-nowrap text-right pl-4">
              {councilMembers.find(c => c.id === formData.councilMemberId)?.name || '-'}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-700 flex justify-between items-end">
            <span className="text-slate-400 uppercase tracking-wider text-sm font-bold whitespace-nowrap">Total Amount</span>
            <span className="text-4xl font-black text-emerald-400 tracking-tight whitespace-nowrap">
              ${totalAmount.toLocaleString()}
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
            <div className="w-6 h-6 border-2 border-slate-600 rounded bg-slate-800 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors"></div>
            <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-bold text-white mb-1 block">ข้าพเจ้าขอยืนยันว่าข้อมูลทั้งหมดถูกต้องและเป็นความจริง</span>
            หากตรวจพบว่าข้อมูลเป็นเท็จ ทางสภาขอสงวนสิทธิ์ในการยกเลิกและไม่อนุมัติการให้บริการทุกกรณี
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
        ยืนยันการทำธุรกรรมและส่งข้อมูล
      </Button>
    </div>
  );
}
