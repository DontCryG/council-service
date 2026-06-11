import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CurrencyDollar, 
  WarningCircle, 
  Plus, 
  UploadSimple, 
  PencilSimple, 
  Trash, 
  ArrowLeft 
} from '@phosphor-icons/react';

export default function CouncilLoanHub() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 ml-2"
      >
        <ArrowLeft size={20} />
        <span>กลับหน้าหลัก</span>
      </button>

      <div className="bg-slate-50 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden font-sans text-slate-800">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              แดชบอร์ดจัดการสัญญา
            </h1>
            <p className="text-slate-500 mt-1">
              ระบบจัดการข้อมูลและติดตามหนี้
            </p>
          </div>
          <button className="bg-[#d4af37] hover:bg-[#c5a028] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20">
            <Plus size={20} weight="bold" />
            สร้างสัญญาใหม่
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-slate-50 rounded-full blur-2xl opacity-50 group-hover:bg-slate-100 transition-colors"></div>
            <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center shrink-0 z-10">
              <FileText size={28} weight="fill" />
            </div>
            <div className="z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">จำนวนสัญญาทั้งหมด</p>
              <p className="text-2xl font-black text-slate-800">1 <span className="text-lg font-bold">ฉบับ</span></p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-50 rounded-full blur-2xl opacity-50 group-hover:bg-amber-100 transition-colors"></div>
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 z-10">
              <CurrencyDollar size={28} weight="bold" />
            </div>
            <div className="z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">ยอดเงินกู้รวม (เงินต้น)</p>
              <p className="text-2xl font-black text-slate-800">5,000,000 ฿</p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-50 rounded-full blur-2xl opacity-50 group-hover:bg-red-100 transition-colors"></div>
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0 z-10">
              <WarningCircle size={28} weight="fill" />
            </div>
            <div className="z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">ยอดคงค้างรอรับชำระ</p>
              <p className="text-2xl font-black text-red-600">2,000,000 ฿</p>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Contracts Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50">
              <h2 className="flex items-center gap-2 text-amber-600 font-bold text-lg">
                <FileText size={24} weight="duotone" />
                รายการสัญญาล่าสุด
              </h2>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="pb-4 text-xs font-bold text-slate-400 tracking-wider">เลขที่สัญญา</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 tracking-wider">ผู้กู้ยืม</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 tracking-wider">ยอดคงค้าง</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 tracking-wider">สถานะ</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-amber-600">CNCL-82224</td>
                    <td className="py-4 font-bold text-slate-700">[CC] COUNCIL</td>
                    <td className="py-4 font-black text-slate-900">2,000,000 ฿</td>
                    <td className="py-4">
                      <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap">
                        กำลังผ่อนชำระ
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors shadow-sm shadow-emerald-500/20 whitespace-nowrap">
                          <UploadSimple size={14} weight="bold" />
                          อัพเดทยอด
                        </button>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors">
                          <FileText size={20} weight="fill" />
                        </button>
                        <button className="text-slate-300 hover:text-amber-500 transition-colors">
                          <PencilSimple size={20} weight="fill" />
                        </button>
                        <button className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash size={20} weight="fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-red-50 p-5 border-b border-red-100 flex items-center gap-2 text-red-600 font-bold text-lg">
              <WarningCircle size={24} weight="duotone" />
              แจ้งเตือนถึงกำหนดชำระ
            </div>
            <div className="p-6">
              <div className="border border-slate-100 rounded-xl p-5 hover:border-red-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-slate-900">CNCL-82224</span>
                  <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-md font-bold">
                    ใกล้ถึงกำหนด
                  </span>
                </div>
                <p className="text-slate-500 font-medium text-sm mb-5">
                  [CC] COUNCIL
                </p>
                <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3 mt-2">
                  <span className="text-red-600 font-black">ค้างชำระ: 2,000,000 ฿</span>
                  <span className="text-slate-400 font-medium text-xs">ดิว: 15/6/2569</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
