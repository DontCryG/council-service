import { useState, useEffect } from 'react';
import { getTransactionLogs, deleteTransactionLog } from '../../core/api';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Clock, Database, Buildings, UserCircle, Receipt, Trash, Eye } from '@phosphor-icons/react';

export default function TransactionHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getTransactionLogs();
    setLogs(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransactionLog(logToDelete);
      setLogs(logs.filter(l => l.id !== logToDelete));
      setLogToDelete(null);
    } catch (err) {
      alert('Failed to delete log');
    }
    setIsDeleting(false);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'edit_org': return { label: 'แก้ไขข้อมูลองค์กร', color: 'text-pink-400', bg: 'bg-pink-500/10' };
      case 'welfare': return { label: 'เบิกสวัสดิการ', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'welfare_trade': return { label: 'แลกเปลี่ยนสวัสดิการ', color: 'text-violet-400', bg: 'bg-violet-500/10' };
      case 'general_service': return { label: 'บริการทั่วไป', color: 'text-amber-400', bg: 'bg-amber-500/10' };
      case 'register_org': return { label: 'ลงทะเบียนแก๊งใหม่', color: 'text-blue-400', bg: 'bg-blue-500/10' };
      default: return { label: type, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    }
  };

  const getSummaryText = (log) => {
    switch (log.type) {
      case 'edit_org': return `${log.data.orgType || ''} ${log.data.orgName || ''} (ผู้แจ้ง: ${log.data.requester || '-'})`;
      case 'welfare': return `${log.data.orgType || ''} ${log.data.orgName || ''} (ผู้เบิก: ${log.data.requester || '-'})`;
      case 'welfare_trade': return `${log.data.orgType || ''} ${log.data.orgName || ''} (${log.data.tradeType || '-'})`;
      case 'general_service': return `${log.data.groupName || '-'} (ผู้แจ้ง: ${log.data.requester || '-'})`;
      case 'register_org': return `[${log.data.alias || '-'}] ${log.data.name || ''} (${log.data.orgType || ''})`;
      default: return 'Custom Action';
    }
  };

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Database size={32} weight="duotone" className="text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">ประวัติการทำรายการ</h1>
          <p className="text-slate-400">Transaction History Logs (Data Retention)</p>
        </div>
      </div>

      <Card>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {['ALL', 'register_org', 'edit_org', 'welfare', 'welfare_trade', 'general_service'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'ทั้งหมด' : getTypeLabel(t).label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-500">
            <Clock className="animate-spin mr-2" size={24} /> กำลังโหลดข้อมูล...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
            ไม่มีประวัติการทำรายการในหมวดหมู่นี้
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => {
              const typeInfo = getTypeLabel(log.type);
              return (
                <div key={log.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 justify-between md:items-center hover:bg-slate-800 transition-colors group">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock size={14} /> {log.createdAt.toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="text-white font-medium flex items-center gap-2">
                      <Receipt size={18} className="text-slate-400" />
                      {getSummaryText(log)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {log.createdBy && (
                      <div className="text-sm text-slate-400 flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-lg hidden md:flex">
                        <UserCircle size={16} className="text-amber-500" />
                        <span>{log.createdBy.email}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDetailsModalOpen(true);
                      }}
                      className="p-2 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                      title="ดูรายละเอียด"
                    >
                      <Eye size={18} />
                      <span className="md:hidden">ดูรายละเอียด</span>
                    </button>
                    
                    <button
                      onClick={() => setLogToDelete(log.id)}
                      className="p-2 bg-slate-700 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                      title="ลบประวัติ"
                    >
                      <Trash size={18} />
                      <span className="md:hidden">ลบ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      
      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="รายละเอียดการทำรายการ"
      >
      {selectedLog && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`px-3 py-1 rounded-md text-sm font-bold ${getTypeLabel(selectedLog.type).bg} ${getTypeLabel(selectedLog.type).color} w-max`}>
                {getTypeLabel(selectedLog.type).label}
              </div>
              <div className="text-slate-400 text-sm">
                {selectedLog.createdAt.toLocaleString('th-TH')}
              </div>
            </div>
            
            {/* Welfare: formatted card */}
            {selectedLog.type === 'welfare' ? (
              <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-emerald-900/30 border-b border-emerald-700/40 px-5 py-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base mb-1">
                    <span>📋</span> ตรวจพบการลงนามรับสวัสดิการใหม่
                  </div>
                  <div className="text-slate-400 text-xs">
                    เลขที่อ้างอิง: <span className="text-slate-200 font-mono font-bold">{selectedLog.data.refNumber || `CS-${selectedLog.id?.slice(0,8).toUpperCase() || 'N/A'}`}</span>
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate-700/60">
                  <div>
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">🏢 สังกัด</div>
                    <div className="text-white font-bold">{selectedLog.data.orgName || '-'}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{selectedLog.data.orgType || ''}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">✍️ ผู้ลงนาม</div>
                    <div className="text-white font-bold">{selectedLog.data.requester || '-'}</div>
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                    🎁 รายการสวัสดิการ
                  </div>
                  <div className="space-y-1.5">
                    {selectedLog.data.hasWeaponWelfare && (
                      <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">รถ: อาวุธไม้พูล</div>
                    )}
                    {(selectedLog.data.vehicles || []).map((v, i) => (
                      <div key={i} className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">รถ: {v.model || '-'} {v.plate ? `(${v.plate})` : ''}</div>
                    ))}
                    {selectedLog.data.otherWelfare && (
                      <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">อื่นๆ: {selectedLog.data.otherWelfare}</div>
                    )}
                    {!selectedLog.data.hasWeaponWelfare && !(selectedLog.data.vehicles?.length) && !selectedLog.data.otherWelfare && (
                      <div className="text-slate-500 italic text-sm">- ไม่มีรายการ -</div>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 text-slate-500 text-xs">ระบบตรวจสอบสวัสดิการสภาส่วนกลาง • {selectedLog.createdAt.toLocaleString('th-TH')}</div>
              </div>
            ) : selectedLog.type === 'register_org' ? (
              <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-blue-900/30 border-b border-blue-700/40 px-5 py-4">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-base mb-1">
                    <span>📝</span> ลงทะเบียนองค์กรใหม่
                  </div>
                  <div className="text-slate-400 text-xs">
                    เลขที่อ้างอิง: <span className="text-slate-200 font-mono font-bold">{selectedLog.data.refNumber || `CS-${selectedLog.id?.slice(0,8).toUpperCase() || 'N/A'}`}</span>
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate-700/60">
                  <div>
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">🏢 ชื่อองค์กร</div>
                    <div className="text-white font-bold">{selectedLog.data.alias ? `[${selectedLog.data.alias}] ` : ''}{selectedLog.data.name || '-'}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{selectedLog.data.orgType || ''}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">👨‍💼 เจ้าหน้าที่สภา</div>
                    <div className="text-amber-500 font-bold">{selectedLog.data.councilStaffName || '-'}</div>
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1">👥 สมาชิก</div>
                  <div className="space-y-3">
                    {selectedLog.data.coLeaders && selectedLog.data.coLeaders.length > 0 && (
                      <div>
                        <div className="text-slate-400 text-xs mb-1">รองหัวหน้า:</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedLog.data.coLeaders.map((c, i) => <span key={i} className="bg-slate-800 px-2.5 py-1 rounded text-slate-200 text-xs">{c}</span>)}
                        </div>
                      </div>
                    )}
                    {selectedLog.data.members && selectedLog.data.members.length > 0 && (
                      <div>
                        <div className="text-slate-400 text-xs mb-1">สมาชิก ({selectedLog.data.members.length}):</div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                          {selectedLog.data.members.map((m, i) => <span key={i} className="bg-slate-800/60 px-2.5 py-1 rounded border border-slate-700 text-slate-300 text-xs">{m}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 text-slate-500 text-xs">ระบบทะเบียนสภาส่วนกลาง • {selectedLog.createdAt.toLocaleString('th-TH')}</div>
              </div>
            ) : selectedLog.type === 'general_service' ? (
              <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-amber-900/30 border-b border-amber-700/40 px-5 py-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-1">
                    <span>🧾</span> บริการทั่วไป
                  </div>
                  <div className="text-slate-400 text-xs">
                    เลขที่อ้างอิง: <span className="text-slate-200 font-mono font-bold">{selectedLog.data.refNumber || `CS-${selectedLog.id?.slice(0,8).toUpperCase() || 'N/A'}`}</span>
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate-700/60">
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">🏢 สังกัด</div>
                      <div className="text-white font-bold">{selectedLog.data.groupName || '-'}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{selectedLog.data.orgType || ''}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">✍️ ผู้แจ้ง</div>
                      <div className="text-white font-bold">{selectedLog.data.requester || '-'}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">💳 ธุรกรรม</div>
                      <div className="text-blue-400 font-bold">{selectedLog.data.transactionName || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">👨‍💼 เจ้าหน้าที่สภา</div>
                      <div className="text-amber-500 font-bold">{selectedLog.data.councilMemberName || '-'}</div>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1">👥 สมาชิกที่เกี่ยวข้อง ({selectedLog.data.members?.length || 0})</div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                    {(selectedLog.data.members || []).map((m, i) => (
                      <span key={i} className="bg-slate-800 px-2.5 py-1 rounded text-slate-200 text-xs border border-slate-700">{m}</span>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-3 text-slate-500 text-xs">ระบบบริการทั่วไปสภาส่วนกลาง • {selectedLog.createdAt.toLocaleString('th-TH')}</div>
              </div>
            ) : selectedLog.type === 'edit_org' ? (
              <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-amber-900/30 border-b border-amber-700/40 px-5 py-4">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-base mb-1">
                    <span>🔄</span> แก้ไขข้อมูลองค์กร
                  </div>
                  <div className="text-slate-400 text-xs">
                    เลขที่อ้างอิง: <span className="text-slate-200 font-mono font-bold">{selectedLog.data.refNumber || `CS-${selectedLog.id?.slice(0,8).toUpperCase() || 'N/A'}`}</span>
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate-700/60">
                  <div>
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">🏢 สังกัด</div>
                    <div className="text-white font-bold">{selectedLog.data.orgName || '-'}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{selectedLog.data.orgType || ''}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">✍️ ผู้แจ้ง</div>
                    <div className="text-white font-bold">{selectedLog.data.requester || '-'}</div>
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1">🛠️ รายการแก้ไข</div>
                  <div className="space-y-1.5">
                    {selectedLog.data.changeInfo && <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">✅ เปลี่ยนข้อมูล Gang</div>}
                    {selectedLog.data.editTexture && <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">✅ แก้ไข Texture เสื้อผ้า</div>}
                    {selectedLog.data.addCloth && <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">✅ ลงชุดเพิ่ม</div>}
                    {selectedLog.data.bulkChange && <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">✅ เหมาเปลี่ยนข้อมูล Gang</div>}
                    {selectedLog.data.addAccessory && <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-medium">✅ ลง Accessories Adons เสริม</div>}
                    {!selectedLog.data.changeInfo && !selectedLog.data.editTexture && !selectedLog.data.addCloth && !selectedLog.data.bulkChange && !selectedLog.data.addAccessory && (
                      <div className="text-slate-500 italic text-sm">- ไม่มีรายการ -</div>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-slate-700/60 flex justify-between items-center">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">👨‍💼 เจ้าหน้าที่สภา</div>
                  <div className="text-amber-500 font-bold">{selectedLog.data.councilStaffName || '-'}</div>
                </div>
                <div className="px-5 py-3 text-slate-500 text-xs">ระบบแจ้งแก้ไของค์กรสภาส่วนกลาง • {selectedLog.createdAt.toLocaleString('th-TH')}</div>
              </div>
            ) : selectedLog.type === 'welfare_trade' ? (
              <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-violet-900/30 border-b border-violet-700/40 px-5 py-4">
                  <div className="flex items-center gap-2 text-violet-400 font-bold text-base mb-1">
                    <span>🔁</span> แลกเปลี่ยนสวัสดิการ
                  </div>
                  <div className="text-slate-400 text-xs">
                    เลขที่อ้างอิง: <span className="text-slate-200 font-mono font-bold">{selectedLog.data.refNumber || `CS-${selectedLog.id?.slice(0,8).toUpperCase() || 'N/A'}`}</span>
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate-700/60">
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">🏢 สังกัด</div>
                      <div className="text-white font-bold">{selectedLog.data.orgName || '-'}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{selectedLog.data.orgType || ''}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">🏷️ ประเภทสวัสดิการ</div>
                      <div className="text-violet-400 font-bold">{selectedLog.data.tradeType || '-'}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">📤 ผู้โอน (เก่า)</div>
                      <div className="text-red-400 font-bold">{selectedLog.data.oldOwner || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">📥 ผู้รับ (ใหม่)</div>
                      <div className="text-emerald-400 font-bold">{selectedLog.data.newOwner || '-'}</div>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1">🎁 รายการ ({selectedLog.data.items?.length || 0})</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                    {(selectedLog.data.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-800 rounded-lg p-2.5">
                        <span className="text-slate-200 text-sm font-bold">{item.name || '-'}</span>
                        <span className="text-slate-400 text-xs font-mono">{item.detail || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-slate-700/60 flex justify-between items-center">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">👨‍💼 เจ้าหน้าที่สภา</div>
                  <div className="text-amber-500 font-bold">{selectedLog.data.councilStaffName || '-'}</div>
                </div>
                <div className="px-5 py-3 text-slate-500 text-xs flex justify-between">
                  <span>ระบบตรวจสอบสวัสดิการสภาส่วนกลาง • {selectedLog.createdAt.toLocaleString('th-TH')}</span>
                  <span className="font-bold text-slate-400">รวม: {selectedLog.data.totalPrice || '-'}</span>
                </div>
              </div>
            ) : (
              /* Default: raw JSON for other types */
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 overflow-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-700">
                <pre className="text-slate-300 text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.data, null, 2)}
                </pre>
              </div>
            )}
            
            {selectedLog.createdBy && (
              <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <UserCircle size={20} className="text-amber-500" />
                <span>บันทึกโดย: {selectedLog.createdBy.email}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={handleDelete}
        title="ลบประวัติการทำรายการ"
        message="คุณแน่ใจหรือไม่ที่จะลบประวัติรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบข้อมูล"
        confirmStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
