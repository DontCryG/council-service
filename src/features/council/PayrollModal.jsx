import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FileText, Calculator } from '@phosphor-icons/react';
import PayslipModal from './PayslipModal';

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 นาที';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} นาที`;
  return `${h} ชม. ${m > 0 ? m + ' นาที' : ''}`;
}

export default function PayrollModal({ isOpen, onClose, leaderboard, period }) {
  const [selectedMember, setSelectedMember] = useState(null);

  if (!isOpen) return null;

  const formatMoney = (val) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));

  return (
    <>
      <Modal isOpen={isOpen && !selectedMember} onClose={onClose} title="สรุปเงินเดือน (Payroll Summary)" className="max-w-5xl w-[95%]">
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4 items-center">
            <Calculator size={32} className="text-blue-400" />
            <div>
              <div className="font-bold text-white text-lg">รอบการคำนวณ: {period}</div>
              <div className="text-sm text-slate-400">สรุปยอดรวมชั่วโมงและคำนวณเงินเดือนตามเรทของแต่ละยศ</div>
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-slate-900/50 border-b border-slate-800 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">ชื่อ / ยศ</th>
                    <th className="px-5 py-3 text-right">เรทเงิน (IC/ชม.)</th>
                    <th className="px-5 py-3 text-right">ชั่วโมงงาน</th>
                    <th className="px-5 py-3 text-right">รวมเงิน (IC)</th>
                    <th className="px-5 py-3 text-center">สลิป</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaderboard.length === 0 ? (
                    <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">ไม่มีข้อมูลในรอบบิลนี้</td></tr>
                  ) : (
                    leaderboard.map(m => {
                      const hours = m.totalMinutes / 60;
                      const icTotal = hours * m.icRate;
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30">
                          <td className="px-5 py-4">
                            <div className="font-bold text-white text-sm">{m.name}</div>
                            <div className="text-slate-400 text-xs mt-0.5">{m.rank}</div>
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-slate-400">
                            {formatMoney(m.icRate)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-amber-400">
                            {formatDuration(m.totalMinutes)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-emerald-400">
                            {formatMoney(icTotal)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Button size="sm" variant="outline" onClick={() => setSelectedMember(m)}>
                              <FileText size={16} /> ดูสลิป
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Modal>

      {selectedMember && (
        <PayslipModal
          isOpen={true}
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
          period={period}
          icRate={selectedMember.icRate}
        />
      )}
    </>
  );
}
