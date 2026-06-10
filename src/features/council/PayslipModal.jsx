import { useState, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { DownloadSimple } from '@phosphor-icons/react';
import { toPng } from 'html-to-image';

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 นาที';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} นาที`;
  return `${h} ชม. ${m > 0 ? m + ' นาที' : ''}`;
}

export default function PayslipModal({ isOpen, onClose, member, period, icRate }) {
  const [storyViews, setStoryViews] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const printRef = useRef(null);

  if (!isOpen || !member) return null;

  const handleDownload = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    try {
      const dataUrl = await toPng(printContent, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true
      });
      const link = document.createElement('a');
      link.download = `Payslip_${member.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const hours = member.totalMinutes / 60;
  const baseSalary = hours * icRate;
  const storyBonus = storyViews * 200000;
  const netPay = baseSalary + storyBonus + Number(bonus) - Number(deductions);

  const formatMoney = (val) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ใบสลิปเงินเดือน (Payslip)" className="max-w-6xl w-[98%]">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Controls */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-white border-b border-slate-700 pb-2">ตั้งค่าสลิป</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">ค่าตรวจดูสตอรี่ (ครั้งละ 200,000)</label>
              <input 
                type="number" 
                min="0"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                value={storyViews}
                onChange={e => setStoryViews(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">เงินเพิ่ม / โบนัสพิเศษ</label>
              <input 
                type="number" 
                min="0"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                value={bonus}
                onChange={e => setBonus(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">รายการหักเงิน</label>
              <input 
                type="number" 
                min="0"
                className="w-full bg-slate-800 border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                value={deductions}
                onChange={e => setDeductions(parseInt(e.target.value) || 0)}
              />
            </div>

            <Button onClick={handleDownload} className="w-full mt-4 flex items-center justify-center gap-2">
              <DownloadSimple size={18} weight="bold" /> ดาวน์โหลดสลิป (Save)
            </Button>
          </div>
        </div>

        {/* Payslip Preview */}
        <div className="flex-1 overflow-x-auto rounded-xl shadow-inner">
          <div ref={printRef} className="bg-white text-slate-900 p-8 min-w-[750px]">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-slate-800 pb-3 mb-4">
              <div className="bg-[#1e2433] text-white px-6 py-3 rounded">
                <h1 className="text-lg font-bold">สำนักงานเลขานุการสภา</h1>
                <p className="text-xs text-slate-300">The Council Secretary Office</p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-[#d4a373] leading-none mb-1">PAYSLIP</h2>
                <p className="text-sm text-slate-500 whitespace-nowrap">วันที่ออก: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between mb-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-y-2">
                <div className="text-slate-500">รหัสพนักงาน:</div>
                <div className="font-bold text-slate-900">{member.username || '-'}</div>
                
                <div className="text-slate-500">ชื่อ-สกุล:</div>
                <div className="font-bold text-slate-900">{member.name}</div>
                
                <div className="text-slate-500">ตำแหน่ง:</div>
                <div className="font-bold text-slate-900">{member.rank || 'สภาฝึกหัด'}</div>
              </div>
              
              <div className="grid grid-cols-[120px_1fr] gap-y-2 whitespace-nowrap">
                <div className="text-slate-500">งวดการจ่าย:</div>
                <div className="font-bold text-slate-900">{period}</div>
                
                <div className="text-slate-500">ชั่วโมงงานสุทธิ:</div>
                <div className="font-bold text-slate-900">{formatDuration(member.totalMinutes)}</div>
                
                <div className="text-slate-500">อัตรา/ชั่วโมง:</div>
                <div className="font-bold text-slate-900">{formatMoney(icRate)} บาท/ชม.</div>
              </div>
            </div>

            {/* Earnings Table */}
            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border border-slate-300 bg-slate-100 p-2.5 text-left text-slate-700 w-2/3">รายละเอียดรายได้ (EARNINGS)</th>
                  <th className="border border-slate-300 bg-slate-100 p-2.5 text-right text-slate-700 w-1/3">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-3">
                    <div className="font-bold">ค่าตอบแทนพื้นฐาน (Base Salary)</div>
                    <div className="text-xs text-slate-500 mt-0.5">({formatDuration(member.totalMinutes)} x {formatMoney(icRate)} บ./ชม.)</div>
                  </td>
                  <td className="border border-slate-300 p-3 text-right font-bold text-slate-900">
                    {formatMoney(baseSalary)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-3">
                    <div className="font-bold">ค่าตรวจดูสตอรี่ (Story Views)</div>
                    <div className="text-xs text-slate-500 mt-0.5">({storyViews} ครั้ง x 200,000 บ.)</div>
                  </td>
                  <td className="border border-slate-300 p-3 text-right font-bold text-blue-600">
                    {storyViews > 0 ? formatMoney(storyBonus) : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-3 font-bold">
                    เงินเพิ่ม / โบนัส (Allowance/Bonus)
                  </td>
                  <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">
                    {bonus > 0 ? formatMoney(bonus) : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-3 font-bold">
                    รายการหัก (Deductions)
                  </td>
                  <td className="border border-slate-300 p-3 text-right font-bold text-red-500">
                    {deductions > 0 ? `-${formatMoney(deductions)}` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Net Pay */}
            <div className="flex justify-end mb-10">
              <div className="bg-[#f0f9ff] border border-[#bae6fd] p-3 flex items-center gap-8 w-1/2 justify-between whitespace-nowrap">
                <div className="font-bold text-slate-900">รายรับสุทธิ (Net Pay)</div>
                <div className="font-black text-xl text-[#0284c7]">฿{formatMoney(netPay)}</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between px-10 text-center whitespace-nowrap">
              <div>
                <div className="w-48 border-b border-dashed border-slate-400 mb-2"></div>
                <div className="font-bold text-sm text-slate-800">ผู้อนุมัติ (Authorized Signatory)</div>
              </div>
              <div>
                <div className="w-48 border-b border-dashed border-slate-400 mb-2"></div>
                <div className="font-bold text-sm text-slate-800">ผู้รับเงิน (Employee Signature)</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Modal>
  );
}
