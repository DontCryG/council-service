import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';

import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, Plus, Trash, Gift, Car, Shield, Buildings, Users, House, Sword } from '@phosphor-icons/react';

export default function Welfare() {
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  
  const [formData, setFormData] = useState({
    orgType: 'GANG',
    orgName: '',
    requester: '',
    hasWeaponWelfare: false,
    otherWelfare: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captureRef = useRef(null);

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { id: Date.now(), model: '', plate: '' }]);
  };

  const handleRemoveVehicle = (id) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleVehicleChange = (id, field, val) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.requester) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3">
        <Gift size={32} weight="duotone" className="text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">ระบบเบิกสวัสดิการ Gang / Family</h1>
          <p className="text-slate-400">ยื่นแบบฟอร์มขอเบิกสวัสดิการสำหรับ GANG / FAMILY</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Section */}
        <div className="bg-white rounded-[24px] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-400 tracking-wide">1. ประเภทสังกัดของคุณ</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`py-4 rounded-xl font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all border-2 ${formData.orgType === 'GANG' ? 'bg-[#fffbeb] border-[#fde68a] text-slate-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => setFormData({...formData, orgType: 'GANG'})}
                >
                  <Users size={20} className={formData.orgType === 'GANG' ? 'text-amber-500' : 'text-slate-400'} /> GANG
                </button>
                <button
                  type="button"
                  className={`py-4 rounded-xl font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all border-2 ${formData.orgType === 'FAMILY' ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
                >
                  <House size={20} className={formData.orgType === 'FAMILY' ? 'text-slate-700' : 'text-slate-400'} /> FAMILY
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[13px] font-bold text-slate-400 tracking-wide">2. ชื่อ GANG / FAMILY</label>
                <input 
                  className="w-full bg-[#f8fafc] border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-bold focus:outline-none focus:border-amber-300 focus:bg-white transition-colors"
                  placeholder="ระบุชื่อ..."
                  value={formData.orgName}
                  onChange={e => {
                    const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                    setFormData({...formData, orgName: val});
                  }}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[13px] font-bold text-slate-400 tracking-wide">3. ชื่อผู้กรอกข้อมูล</label>
                <input 
                  className="w-full bg-[#f8fafc] border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-bold focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
                  placeholder="ชื่อในเกม..."
                  value={formData.requester}
                  onChange={e => setFormData({...formData, requester: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-400 tracking-wide">4. เลือกสวัสดิการที่ได้รับ</label>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Vehicles Card */}
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col min-h-[240px]">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                        <Car size={20} weight="fill" className="text-blue-500" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">สวัสดิการรถ</h3>
                    </div>
                    <button type="button" onClick={handleAddVehicle} className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors">
                      + เพิ่มรายการ
                    </button>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                      <p className="text-slate-400 italic text-sm">ยังไม่มีการเพิ่มข้อมูลรถ</p>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1">
                      {vehicles.map((v) => (
                        <div key={v.id} className="flex gap-2">
                          <input 
                            className="w-1/2 bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-blue-300 focus:bg-white"
                            placeholder="รุ่นรถ"
                            value={v.model}
                            onChange={(e) => handleVehicleChange(v.id, 'model', e.target.value)}
                          />
                          <input 
                            className="w-1/2 bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-blue-300 focus:bg-white"
                            placeholder="ป้ายทะเบียน"
                            value={v.plate}
                            onChange={(e) => handleVehicleChange(v.id, 'plate', e.target.value)}
                          />
                          <button type="button" onClick={() => handleRemoveVehicle(v.id)} className="text-slate-400 hover:text-red-500 px-2 transition-colors">
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weapons Card */}
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col min-h-[240px]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#fef2f2] flex items-center justify-center">
                      <Sword size={20} weight="fill" className="text-red-500" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">สวัสดิการอาวุธ</h3>
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-100 rounded-xl hover:border-red-300 transition-colors mb-4">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-red-500 focus:ring-red-500"
                      checked={formData.hasWeaponWelfare}
                      onChange={e => setFormData({...formData, hasWeaponWelfare: e.target.checked})}
                    />
                    <span className="font-bold text-slate-700 text-sm">สวัสดิการอาวุธไม้พูล</span>
                  </label>

                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 mb-2">สวัสดิการอื่นๆ</label>
                    <textarea 
                      className="w-full flex-1 min-h-[80px] bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-bold focus:outline-none focus:border-red-300 focus:bg-white resize-none"
                      placeholder="ระบุเพิ่มเติม..."
                      value={formData.otherWelfare}
                      onChange={e => setFormData({...formData, otherWelfare: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-base shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white rounded-xl" isLoading={isSubmitting}>
              <PaperPlaneTilt size={20} weight="bold" /> ยืนยันการเบิกสวัสดิการ
            </Button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Preview</h3>
          <div ref={captureRef} className="bg-white rounded-xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-slate-800 font-sans border-t-[6px] border-amber-500 min-h-[600px]">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <img src="/logo.png" alt="watermark" className="w-[80%] h-[80%] object-contain" />
            </div>

            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="w-16 h-16">
                <img src="/logo.png" alt="Council Logo" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">สภาสูงสุด</h2>
                <p className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">SUPREME COUNCIL OFFICE</p>
              </div>
            </div>

            <div className="text-center mb-10 relative z-10">
              <h1 className="text-2xl font-black text-slate-800 inline-block border-b-2 border-slate-800 pb-1 mb-2">สัญญารับสวัสดิการจากสภา</h1>
              <p className="text-xs text-slate-500 font-bold">เลขที่อ้างอิง: CS-WELFARE-0512</p>
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

            <div className="bg-[#fff9eb] border border-[#fde68a] rounded-lg p-4 mb-12 flex items-start gap-4 relative z-10">
              <div className="w-5 h-5 mt-0.5 rounded border border-slate-300 bg-white flex-shrink-0"></div>
              <p className="text-[#854d0e] text-[13px] font-bold leading-snug">
                ข้าพเจ้าได้อ่านและยอมรับข้อตกลง กฎของสภา และเงื่อนไขการรับสวัสดิการทั้งหมด สัญญามีอายุไม่น้อยกว่า 3 เดือน
              </p>
            </div>

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
        </div>
      </div>
    </div>
  );
}
