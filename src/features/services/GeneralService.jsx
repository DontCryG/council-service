import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook } from '../../core/api';
import { transactions } from '../../data/models';
import { toBlob } from 'html-to-image';

import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, Plus, Trash, FileText, UserCircle } from '@phosphor-icons/react';

export default function GeneralService() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  const [formData, setFormData] = useState({
    transactionId: '',
    groupType: 'GANG',
    groupName: '',
    requester: '',
    councilMemberId: ''
  });
  const [members, setMembers] = useState([{ id: 1, value: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captureRef = useRef(null);

  // Load Council Members
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'app_state'), (snapshot) => {
      let loaded = false;
      snapshot.forEach(doc => {
        if (doc.id === 'council_members') {
          setCouncilMembers(doc.data().members || []);
          loaded = true;
        }
      });
      // Fallback
      if (!loaded) {
         setCouncilMembers([]);
      }
    });
    return () => unsub();
  }, []);

  const selectedTransaction = transactions.find(t => t.id === parseInt(formData.transactionId));
  const totalAmount = selectedTransaction 
    ? (selectedTransaction.type === 'per_head' ? selectedTransaction.price * members.length : selectedTransaction.price)
    : 0;

  const handleAddMember = () => {
    setMembers([...members, { id: Date.now(), value: '' }]);
  };

  const handleRemoveMember = (id) => {
    if (members.length > 1) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleMemberChange = (id, val) => {
    setMembers(members.map(m => m.id === id ? { ...m, value: val } : m));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transactionId || !formData.groupName || !formData.requester || !formData.councilMemberId) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (members.some(m => !m.value.trim())) {
      showAlert('error', 'กรุณากรอกชื่อสมาชิกให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0f172a',
        cacheBust: true
      });
      
      if (!blob) throw new Error("Failed to generate image");
      
      // 2. Prepare FormData
      const fd = new FormData();
      fd.append('file', blob, 'receipt.png');
      
      const groupDisplay = `[${formData.groupType}] ${formData.groupName}`;
      
      fd.append('payload_json', JSON.stringify({
        content: `**[ใบเสร็จรับเงิน]** รายการ: ${selectedTransaction.name} | แก๊ง: ${groupDisplay} | โดย: ${formData.requester}`,
        embeds: [{
          title: "🧾 COUNCIL SERVICE RECEIPT",
          color: 0x3b82f6,
          fields: [
            { name: "📋 รายการ", value: selectedTransaction.name, inline: false },
            { name: "👥 กลุ่ม", value: groupDisplay, inline: true },
            { name: "👤 ผู้ติดต่อ", value: formData.requester, inline: true },
            { name: "💰 จำนวนเงินสุทธิ", value: `$${totalAmount.toLocaleString()}`, inline: false },
            { name: "🛡️ ผู้ทำรายการ (สภา)", value: councilMembers.find(c => c.id === formData.councilMemberId)?.name || '-', inline: false }
          ],
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      // 3. Send Webhook
      await sendWebhook('general', fd);
      showAlert('success', 'ส่งใบเสร็จไปยัง Discord เรียบร้อยแล้ว!');
      navigate('/');
      
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการส่ง Discord');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3">
        <FileText size={32} weight="duotone" className="text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">แบบฟอร์มเบิกจ่าย / ธุรกรรมทั่วไป</h1>
          <p className="text-slate-400">กรอกข้อมูลเพื่อสร้างใบเสร็จและส่งเข้าสู่ Discord สภา</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form Input Side */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">ประเภทธุรกรรม</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.transactionId}
                onChange={e => setFormData({...formData, transactionId: e.target.value})}
                required
              >
                <option value="" disabled>-- เลือกประเภทธุรกรรม --</option>
                {transactions.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.groupType === 'GANG' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, groupType: 'GANG'})}
              >
                GANG
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.groupType === 'FAMILY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, groupType: 'FAMILY'})}
              >
                FAMILY
              </button>
            </div>

            <Input 
              label={`ชื่อ ${formData.groupType}`} 
              placeholder="ระบุชื่อ..." 
              required
              value={formData.groupName}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                setFormData({...formData, groupName: val});
              }}
            />

            <Input 
              label="ผู้ติดต่อ (ชื่อในเกม)" 
              placeholder="ระบุชื่อผู้ติดต่อ..." 
              required
              value={formData.requester}
              onChange={e => setFormData({...formData, requester: e.target.value})}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300 ml-1">รายชื่อสมาชิกที่ทำธุรกรรม</label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddMember} className="text-blue-400 hover:text-blue-300">
                  <Plus size={16} /> เพิ่มสมาชิก
                </Button>
              </div>
              
              <div className="space-y-2">
                {members.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Input 
                      placeholder={`ชื่อสมาชิกคนที่ ${idx + 1}`}
                      value={m.value}
                      onChange={(e) => handleMemberChange(m.id, e.target.value)}
                      required
                    />
                    <Button 
                      type="button" 
                      variant="danger" 
                      size="icon" 
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={members.length === 1}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-800">
              <label className="text-sm font-medium text-slate-300 ml-1">สภาผู้ทำรายการ</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.councilMemberId}
                onChange={e => setFormData({...formData, councilMemberId: e.target.value})}
                required
              >
                <option value="" disabled>-- เลือกชื่อสภา --</option>
                {councilMembers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              <PaperPlaneTilt size={20} weight="bold" /> ส่งใบเสร็จไปยัง Discord
            </Button>
          </form>
        </Card>

        {/* Receipt Preview Side */}
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Preview (ภาพที่จะถูกส่ง)</h3>
          
          <div ref={captureRef} className="bg-slate-900 rounded-xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">COUNCIL RECEIPT</h2>
              <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider">Official Service Record</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">รายการธุรกรรม</span>
                <span className="font-bold text-white text-right max-w-[200px]">{selectedTransaction?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">กลุ่ม ({formData.groupType?.trim()})</span>
                <span className="font-bold text-blue-400 flex items-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded mr-2 ${formData.groupType === 'FAMILY' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {formData.groupType?.trim()}
                  </span>
                  {formData.groupName || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">ผู้ติดต่อ</span>
                <span className="font-medium text-white">{formData.requester || '-'}</span>
              </div>
              
              <div className="py-3 border-b border-slate-800/50">
                <span className="text-slate-400 block mb-2">รายชื่อสมาชิก ({members.length} คน)</span>
                <div className="bg-slate-950 rounded-lg p-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {members.map((m, i) => (
                    <div key={i} className="text-sm text-slate-300 flex items-center gap-2 mb-1">
                      <UserCircle size={16} className="text-slate-500" /> {m.value || '...'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400 whitespace-nowrap">ผู้ทำรายการ (สภา)</span>
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
        </div>
      </div>
    </div>
  );
}
