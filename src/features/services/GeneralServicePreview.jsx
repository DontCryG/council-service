import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { saveTransactionLog, uploadReceiptImage } from '../../core/api';
import { toBlob } from 'html-to-image';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, ArrowLeft, Receipt, SealCheck, CircleDashed, User, UserCircle } from '@phosphor-icons/react';
import { transactions } from '../../data/models';

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
      
      const imageUrl = await uploadReceiptImage(blob, 'general_service', refNumber);

      const typeDisplay = formData.groupType === 'GANG' ? 'แก๊ง' : 'ครอบครัว';
      const councilName = councilMembers.find(c => c.id === formData.councilMemberId)?.name || '-';
      const membersText = members.map(m => m.value).join('\n');

      const webhookPayload = {
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
            url: imageUrl
          },
          footer: { text: `Ref: ${refNumber} | Server System` },
          timestamp: new Date().toISOString()
        }]
      };

      await saveTransactionLog('general_service', {
        refNumber: refNumber,
        orgType: formData.groupType,
        groupName: formData.groupName,
        requester: formData.requester,
        transactionId: formData.transactionId,
        transactionName: selectedTransaction?.name || '-',
        councilMemberId: formData.councilMemberId,
        councilMemberName: councilName,
        members: members.map(m => m.value),
        webhookPayload: webhookPayload
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">ตรวจสอบข้อมูลก่อนส่ง</h2>
          <p className="text-slate-400">โปรดตรวจสอบรายละเอียดในบิลให้แน่ใจก่อนทำการส่งข้อมูล</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/ps1', { state: { formData, councilMembers, members } })} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} className="mr-2" /> ย้อนกลับเพื่อแก้ไข
        </Button>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 backdrop-blur-sm shadow-2xl mb-8">
        <div ref={captureRef} className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden text-slate-200">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          
          <div className="absolute top-8 right-8 text-slate-800 opacity-20 pointer-events-none">
            <Receipt size={120} weight="duotone" />
          </div>

          {/* Header */}
          <div className="flex flex-row items-start justify-between border-b border-dashed border-slate-700 pb-6 mb-6 relative z-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <SealCheck size={24} weight="fill" className="text-blue-500" />
                <span className="text-blue-500 font-bold tracking-widest text-xs uppercase whitespace-nowrap">Official Receipt</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
                {formData.groupName || 'ORGANIZATION'}
              </h2>
              <div className="text-slate-400 font-medium tracking-wider text-sm mt-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {formData.groupType?.trim()} SERVICE
              </div>
            </div>
            
            <div className="ml-4 shrink-0 text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Receipt No.</div>
              <div className="font-mono text-sm font-bold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                {refNumber}
              </div>
            </div>
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
                <Receipt size={14} /> Transaction Type
              </div>
              <div className="font-bold text-lg text-blue-400">{selectedTransaction?.name || '-'}</div>
            </div>
          </div>

          {/* Members List */}
          <div className="mb-8 relative z-10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CircleDashed size={16} /> Related Members ({members.length})
            </div>
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-200 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <UserCircle size={18} className="text-blue-500 shrink-0" weight="fill" />
                    <span className="truncate">{m.value || '...'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end pt-6 mt-2 border-t border-dashed border-slate-700 relative z-10">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Amount Due</div>
              <div className="text-4xl font-black text-white">
                <span className="text-emerald-500 mr-1">$</span>{totalAmount.toLocaleString()}
              </div>
            </div>
            
            <div className="text-center w-48">
              <div className="border-b border-slate-600 pb-2 font-bold text-white truncate px-2">{councilMembers.find(c => c.id === formData.councilMemberId)?.name || '...'}</div>
              <div className="text-[10px] mt-1.5 text-slate-400 uppercase tracking-widest font-bold">Authorized Inspector</div>
            </div>
          </div>
          
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-lg">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
            <input 
              type="checkbox" 
              className="peer sr-only"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
            />
            <div className="w-6 h-6 border-2 border-slate-600 rounded-md bg-slate-800 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors"></div>
            <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-bold text-white mb-1 block text-base">ข้าพเจ้าขอยืนยันว่าข้อมูลทั้งหมดถูกต้องและเป็นความจริง</span>
            หากตรวจพบว่าข้อมูลเป็นเท็จ ทางสภาขอสงวนสิทธิ์ในการยกเลิกและไม่อนุมัติการให้บริการทุกกรณี
          </div>
        </label>
      </div>

      <Button 
        type="button" 
        className="w-full text-lg py-4 shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl border-none" 
        size="lg" 
        isLoading={isSubmitting}
        disabled={!isAgreed || isSubmitting}
        onClick={handleSubmit}
      >
        <PaperPlaneTilt size={24} weight="fill" className="mr-2" />
        ยืนยันการทำธุรกรรมและส่งสลิป
      </Button>
    </div>
  );
}
