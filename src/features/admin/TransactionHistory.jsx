import { useState, useEffect } from 'react';
import { listenTransactionLogs, deleteTransactionLog, updateTransactionLogStatus, sendWebhook, getTransactionImage, deleteTransactionImage } from '../../core/api';
import { useAppStore } from '../../store';
import { 
  FileText, PencilSimple, Buildings, Handshake, Gift,
  Trash, CheckCircle, Clock, Copy, UserCircle, CheckSquareOffset, ArrowsClockwise, MagnifyingGlass,
  CalendarBlank, WarningCircle
} from '@phosphor-icons/react';
import { transactions } from '../../data/models';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function TransactionHistory() {
  const { user, showAlert } = useAppStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [activeCategory, setActiveCategory] = useState('general_service');
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL'); // ALL, GANG, FAMILY
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    logId: null,
    isLoading: false
  });

  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    logId: null,
    isLoading: false
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenTransactionLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleApprove = (logId) => {
    if (user?.role !== 'admin') {
      showAlert('error', 'คุณไม่มีสิทธิ์ในการอนุมัติ');
      return;
    }
    setApproveModal({
      isOpen: true,
      logId,
      isLoading: false
    });
  };

  const confirmApprove = async () => {
    setApproveModal(prev => ({ ...prev, isLoading: true }));
    try {
      const logToApprove = logs.find(l => l.id === approveModal.logId);
      
      if (logToApprove && logToApprove.data.webhookPayload) {
        let webhookType = logToApprove.type;
        if (webhookType === 'general_service') webhookType = 'general';
        if (webhookType === 'leave') webhookType = 'duty_leave';
        if (webhookType === 'resign') webhookType = 'duty_resign';
        
        // Fetch image from Firestore
        const imageData = await getTransactionImage(logToApprove.id);
        
        if (imageData && imageData.base64Image) {
          // Convert base64 to Blob
          const response = await fetch(imageData.base64Image);
          const blob = await response.blob();
          
          const fd = new FormData();
          fd.append('files[0]', blob, 'receipt.jpg');
          fd.append('payload_json', JSON.stringify(logToApprove.data.webhookPayload));
          
          await sendWebhook(webhookType, fd);
          
          // Delete image to save space
          await deleteTransactionImage(imageData.id);
        } else {
          // Fallback if image not found
          await sendWebhook(webhookType, logToApprove.data.webhookPayload);
        }
      }
      
      await updateTransactionLogStatus(approveModal.logId, 'approved', user);
      showAlert('success', 'อนุมัติคำร้องและส่ง Log เรียบร้อยแล้ว');
      setApproveModal({ isOpen: false, logId: null, isLoading: false });
    } catch (err) {
      console.error("Approval error:", err);
      showAlert('error', 'เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถอนุมัติได้'));
      setApproveModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDelete = (logId) => {
    if (user?.role !== 'admin') {
      showAlert('error', 'คุณไม่มีสิทธิ์ลบข้อมูลนี้');
      return;
    }
    setConfirmModal({
      isOpen: true,
      logId,
      isLoading: false
    });
  };

  const confirmDelete = async () => {
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      // Delete associated image if it exists
      const imageData = await getTransactionImage(confirmModal.logId);
      if (imageData) {
        await deleteTransactionImage(imageData.id);
      }
      
      await deleteTransactionLog(confirmModal.logId);
      showAlert('success', 'ลบคำร้องเรียบร้อยแล้ว');
      setConfirmModal({ isOpen: false, logId: null, isLoading: false });
    } catch (err) {
      showAlert('error', 'เกิดข้อผิดพลาดในการลบ');
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCopy = (log, details, isApproved) => {
    const orgType = details.type === 'GANG' ? 'แก๊ง' : 'ครอบครัว';
    const staffName = isApproved ? (log.approvedBy?.displayName || log.approvedBy?.email || 'Approved') : (log.data.councilMemberName || log.data.councilStaffName || '-- เลือกเจ้าหน้าที่สภา --');
    
    let detailsLines = '  - ไม่มีรายละเอียด';
    if (details.detailsValue && details.detailsValue !== '-') {
      detailsLines = details.detailsValue
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => `  - ${line}`)
        .join('\n');
    }

    let text = `===== COUNCIL DATA =====\n`;
    if (log.type !== 'leave' && log.type !== 'resign') {
      text += `สังกัด: ${details.title} (${orgType})\n`;
    }
    text += `ผู้ทำรายการ: ${details.requester}\n`;
    text += `ธุรกรรม: ${details.transaction}\n`;
    text += `รายละเอียด:\n${detailsLines}`;
    
    if (log.type !== 'leave' && log.type !== 'resign') {
      text += `\nเจ้าหน้าที่: ${staffName}\n`;
      text += `ยอดรวม: ${details.amount}`;
    }

    navigator.clipboard.writeText(text);
    showAlert('success', 'คัดลอกข้อมูลเรียบร้อยแล้ว');
  };

  const categories = [
    {
      group: 'ระบบจัดการคำร้อง',
      items: [
        { id: 'general_service', label: 'บริการทั่วไป', icon: FileText },
        { id: 'edit_org', label: 'แก้ไขข้อมูลสังกัด', icon: PencilSimple },
        { id: 'register_org', label: 'ขึ้นทะเบียนสังกัด', icon: Buildings },
      ]
    },
    {
      group: 'ระบบสวัสดิการ',
      items: [
        { id: 'welfare_trade', label: 'เทรดสวัสดิการ', icon: Handshake },
      ]
    },
    ...(user?.role === 'admin' ? [{
      group: 'ระบบจัดการบุคลากร',
      items: [
        { id: 'leave', label: 'แจ้งลา', icon: CalendarBlank },
        { id: 'resign', label: 'ลาออก', icon: WarningCircle }
      ]
    }] : [])
  ];

  const filteredLogs = logs.filter(log => {
    // Filter out approved logs
    if (log.status === 'approved') return false;

    // 1. Filter by category
    if (log.type !== activeCategory) return false;
    
    // 2. Filter by Group Type (GANG/FAMILY)
    if (groupFilter !== 'ALL') {
      const type = log.data.groupType || log.data.orgType;
      if (type !== groupFilter) return false;
    }

    // 3. Search Term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const groupName = (log.data.groupName || log.data.orgName || log.data.name || '').toLowerCase();
      const requester = (log.data.requester || '').toLowerCase();
      if (!groupName.includes(term) && !requester.includes(term)) {
        return false;
      }
    }
    return true;
  });

  const getLogDetails = (log) => {
    switch (log.type) {
      case 'general_service': {
        const trans = transactions.find(t => t.id === parseInt(log.data.transactionId));
        let calcAmount = 0;
        if (trans) {
           calcAmount = trans.type === 'per_head' ? trans.price * (log.data.members?.length || 1) : trans.price;
        }
        return {
          title: log.data.groupName || '-',
          type: log.data.orgType || log.data.groupType || 'GANG',
          transaction: log.data.transactionName || log.data.serviceType || '-',
          requester: log.data.requester || '-',
          detailsLabel: 'รายละเอียดสมาชิก',
          detailsValue: log.data.members && log.data.members.length > 0 ? log.data.members.join('\n') : '-',
          amount: log.data.totalAmount ? `${log.data.totalAmount.toLocaleString()} $` : (calcAmount ? `${calcAmount.toLocaleString()} $` : '-'),
        };
      }
      case 'edit_org': {
        let editTotal = 0;
        let changeList = [];
        
        if (log.data.changeInfo === true || log.data.changeInfo === "true") {
           editTotal += 500000;
           changeList.push("- เปลี่ยนข้อมูล Gang");
        } else if (typeof log.data.changeInfo === 'string' && log.data.changeInfo !== 'false' && log.data.changeInfo.trim() !== '') {
           changeList.push(`- ${log.data.changeInfo}`);
        }

        const tCount = log.data.textureCount ? Math.max(1, parseInt(log.data.textureCount)) : 1;

        if (log.data.editTexture) {
           editTotal += 500000 * tCount;
           changeList.push(`- แก้ไข Texture เสื้อผ้า (${tCount} ชุด)`);
        }
        if (log.data.addCloth) {
           editTotal += 500000 * tCount;
           changeList.push(`- ลงชุดเพิ่ม (${tCount} ชุด)`);
        }
        if (log.data.bulkChange) {
           editTotal += 1500000;
           changeList.push("- เหมาเปลี่ยนข้อมูล Gang");
        }
        if (log.data.addAccessory) {
           editTotal += 1000000;
           changeList.push("- ลง Accessories Adons เสริม");
        }
        
        let extraInfoStr = [];
        if (log.data.hexColor) extraInfoStr.push(`รหัสสี: ${log.data.hexColor}`);
        if (log.data.extraDetails) extraInfoStr.push(`เพิ่มเติม: ${log.data.extraDetails}`);

        const detailsString = changeList.length > 0 
           ? changeList.join('\n') + (extraInfoStr.length > 0 ? '\n\n' + extraInfoStr.join('\n') : '')
           : '-';

        return {
          title: log.data.orgName || '-',
          type: log.data.orgType || 'GANG',
          transaction: 'แก้ไขข้อมูลสังกัด',
          requester: log.data.requester || '-',
          detailsLabel: 'ข้อมูลที่แก้ไข',
          detailsValue: detailsString,
          detailsNode: (
            <div className="space-y-3">
              {changeList.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {changeList.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              ) : <span>-</span>}
            </div>
          ),
          extraNode: (log.data.hexColor || log.data.extraDetails || log.data.logoUrl) ? (
            <div className="space-y-4">
              {log.data.hexColor && (
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400">รหัสสี:</span>
                    <div className="w-5 h-5 rounded shadow-inner border border-slate-700" style={{ backgroundColor: log.data.hexColor }}></div>
                    <span className="text-sm text-slate-200 font-medium uppercase">{log.data.hexColor}</span>
                 </div>
              )}

              {log.data.extraDetails && (
                 <div>
                   <span className="text-sm font-bold text-slate-400 block mb-2">เพิ่มเติม:</span>
                   <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 text-sm">
                     {log.data.extraDetails}
                   </div>
                 </div>
              )}

              {log.data.logoUrl && (
                 <div>
                   <span className="text-sm font-bold text-slate-400 block mb-2">โลโก้ใหม่:</span>
                   <a href={log.data.logoUrl} target="_blank" rel="noreferrer" className="inline-block border border-slate-700 hover:border-blue-500 rounded-xl overflow-hidden transition-colors bg-slate-950 p-1">
                     <img src={log.data.logoUrl} alt="Logo" className="w-24 h-24 object-contain rounded-lg" />
                   </a>
                 </div>
              )}
            </div>
          ) : null,
          amount: log.data.totalAmount ? `${log.data.totalAmount.toLocaleString()} $` : (editTotal > 0 ? `${editTotal.toLocaleString()} $` : '-'),
        };
      }
      case 'register_org':
        return {
          title: `[${log.data.alias || '-'}] ${log.data.name || '-'}`,
          type: log.data.orgType || 'GANG',
          transaction: 'ขึ้นทะเบียนสังกัดใหม่',
          requester: log.data.leader || log.data.coLeaders?.[0] || 'ดูรายละเอียด',
          detailsLabel: 'รายชื่อสมาชิก',
          detailsValue: `หัวหน้า:\n${log.data.leader || '-'}\n\nรองหัวหน้า:\n${log.data.coLeaders?.join('\n') || '-'}\n\nสมาชิก:\n${log.data.members?.join('\n') || '-'}`,
          extraNode: (log.data.color || log.data.logo) ? (
            <div className="space-y-4">
              {log.data.color && (
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400">รหัสสี:</span>
                    <div className="w-5 h-5 rounded shadow-inner border border-slate-700" style={{ backgroundColor: log.data.color }}></div>
                    <span className="text-sm text-slate-200 font-medium uppercase">{log.data.color}</span>
                 </div>
              )}
              {log.data.logo && (
                 <div>
                   <span className="text-sm font-bold text-slate-400 block mb-2">โลโก้สังกัด:</span>
                   <a href={log.data.logo} target="_blank" rel="noreferrer" className="inline-block border border-slate-700 hover:border-blue-500 rounded-xl overflow-hidden transition-colors bg-slate-950 p-1">
                     <img src={log.data.logo} alt="Logo" className="w-24 h-24 object-contain rounded-lg" />
                   </a>
                 </div>
              )}
            </div>
          ) : null,
          amount: log.data.totalAmount ? `${log.data.totalAmount.toLocaleString()} $` : '200,000 $',
        };
      case 'welfare_trade':
        return {
          title: log.data.orgName || '-',
          type: log.data.orgType || 'GANG',
          transaction: `เทรดสวัสดิการ (${log.data.tradeType || '-'})`,
          requester: log.data.oldOwner || log.data.newOwner || '-',
          detailsLabel: 'รายละเอียดไอเทม',
          detailsValue: log.data.items ? log.data.items.map(i => `- ${i.name} ${i.detail ? `(${i.detail})` : ''}`).join('\n') : '-',
          amount: log.data.totalPrice ? `${log.data.totalPrice.toLocaleString()} $` : '-',
        };
      case 'welfare':
        return {
          title: log.data.orgName || '-',
          type: log.data.orgType || 'GANG',
          transaction: 'เบิกสวัสดิการ',
          requester: log.data.requester || '-',
          detailsLabel: 'รายการเบิก',
          detailsValue: [
            ...(log.data.vehicles ? log.data.vehicles.map(v => `รถ: ${v.name} (ทะเบียน: ${v.plate})`) : []),
            log.data.hasWeaponM9 ? 'เบิกอาวุธ: มีด M9' : '',
            log.data.hasWeaponHeavyRevolver ? 'เบิกอาวุธ: ปืน Heavy Revolver Mk II' : '',
            log.data.hasWeaponPoolCue ? 'เบิกอาวุธ: ไม้ Pool Cue' : '',
            log.data.otherWelfare ? `อื่นๆ: ${log.data.otherWelfare}` : ''
          ].filter(Boolean).join('\n') || '-',
          amount: '-',
        };
      case 'leave':
        return {
          title: log.data.memberName || '-',
          type: 'COUNCIL',
          transaction: 'แจ้งลางาน',
          requester: log.data.memberName || '-',
          detailsLabel: 'รายละเอียดการลา',
          detailsValue: `ประเภท: ${log.data.type}\nตั้งแต่: ${log.data.dateFrom}\nถึง: ${log.data.dateTo}\nเหตุผล: ${log.data.reason}`,
          amount: '-'
        };
      case 'resign':
        return {
          title: log.data.memberName || '-',
          type: 'COUNCIL',
          transaction: 'แจ้งลาออก',
          requester: log.data.memberName || '-',
          detailsLabel: 'รายละเอียดลาออก',
          detailsValue: `วันทำงานสุดท้าย: ${log.data.lastDay}\nเหตุผล: ${log.data.reason}`,
          amount: '-'
        };
      default:
        return {
          title: 'Unknown', type: 'GANG', transaction: 'Unknown', requester: '-', detailsLabel: '-', detailsValue: '-', amount: '-'
        };
    }
  };

  const activeCategoryLabel = categories.flatMap(c => c.items).find(i => i.id === activeCategory)?.label || '';
  const pendingCount = logs.filter(l => l.type === activeCategory && l.status !== 'approved').length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] animate-in fade-in zoom-in-95 duration-700 relative z-10 max-w-[1400px] mx-auto">
      
      {/* Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* LEFT SIDEBAR (Menu) */}
      <div className="w-full lg:w-72 flex-shrink-0 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-8 h-max relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {categories.map((cat, i) => (
          <div key={i} className="space-y-4 relative z-10">
            <h3 className="text-[11px] font-black text-slate-500 tracking-widest uppercase px-2">{cat.group}</h3>
            <div className="space-y-2">
              {cat.items.map(item => {
                const Icon = item.icon;
                const isActive = activeCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${
                      isActive 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent hover:border-slate-700/50 hover:shadow-inner'
                    }`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 pointer-events-none"></div>}
                    <Icon size={20} weight={isActive ? "fill" : "duotone"} className={isActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "group-hover:scale-110 transition-transform"} />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40"></div>
        
        {/* Header */}
        <div className="px-8 py-8 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 bg-slate-950/20">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">{activeCategoryLabel}</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">รายการคำร้องที่รอตรวจสอบทั้งหมด</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <div className="bg-amber-500/10 text-amber-500 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-amber-500/20 shadow-inner">
              <Clock size={16} weight="bold" className="animate-pulse" /> รอตรวจสอบ {pendingCount}
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-emerald-500/20 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> LIVE SYNC
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-5 border-b border-slate-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-950/40 relative z-10 shadow-inner">
          <div className="relative group/search w-full xl:w-96">
            <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/search:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-blue-500 transition-colors z-10" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาข้อมูลผู้ร้อง, ชื่อแก๊ง..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full relative bg-slate-950/80 border border-slate-700/80 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
              {['ALL', 'GANG', 'FAMILY'].map(g => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                    groupFilter === g 
                      ? 'bg-slate-800/80 text-white shadow-md border border-slate-700/50' 
                      : 'bg-transparent text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {g === 'ALL' ? 'ทั้งหมด (ALL)' : `${g} (${g === 'GANG' ? 'แก๊ง' : 'ครอบครัว'})`}
                </button>
              ))}
            </div>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-3 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-700/80 shadow-inner flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group" 
              title="รีเฟรชข้อมูล"
            >
              <ArrowsClockwise size={18} weight="bold" className={`${loading ? 'animate-spin text-blue-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {loading ? (
            <div className="flex justify-center items-center h-40 text-slate-500">
              <ArrowsClockwise className="animate-spin mr-2" size={24} /> กำลังอัปเดตข้อมูล...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              <CheckSquareOffset size={48} className="mb-3 text-slate-600" />
              <p>ไม่มีรายการคำร้องในหมวดหมู่นี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
              {filteredLogs.map(log => {
                const details = getLogDetails(log);
                const isApproved = log.status === 'approved';
              
              return (
                <div key={log.id} className={`group relative bg-slate-900/60 backdrop-blur-md border rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 ${isApproved ? 'border-emerald-500/20 opacity-75' : 'border-slate-700/50 hover:border-slate-500/50'}`}>
                  
                  {/* Decorative Glow inside Card */}
                  {!isApproved && <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] pointer-events-none transition-all duration-700 opacity-20 group-hover:opacity-40 -mr-20 -mt-20 ${details.type === 'GANG' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>}
                  {isApproved && <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] pointer-events-none opacity-10 bg-emerald-500 -mr-20 -mt-20"></div>}

                  {/* Top Accent Bar */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isApproved ? 'from-emerald-600 to-emerald-400' : (details.type === 'GANG' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-indigo-500')}`}></div>

                  {/* Card Header */}
                  <div className="px-7 py-4 border-b border-slate-800/60 flex justify-between items-center bg-slate-950/40 relative z-10 shadow-inner">
                    <div className="flex items-center gap-3">
                      {log.type !== 'leave' && log.type !== 'resign' && (
                        <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-lg shadow-inner border ${details.type === 'GANG' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {details.type === 'GANG' ? 'แก๊ง' : 'ครอบครัว'}
                        </span>
                      )}
                      <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
                        <Clock size={14} weight="bold" /> {log.createdAt.toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCopy(log, details, isApproved)} className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors border border-slate-700/50" title="คัดลอกข้อมูล">
                        <Copy size={16} weight="bold" />
                      </button>
                      <button onClick={() => handleDelete(log.id)} className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors border border-slate-700/50 hover:border-red-500/30" title="ลบคำร้อง">
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-7 relative z-10">
                    <h2 className="text-2xl font-black text-white mb-6 drop-shadow-md truncate">{details.title}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5">รายการธุรกรรม</p>
                          <p className="text-blue-400 font-black text-lg drop-shadow-sm">{details.transaction}</p>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5">ผู้ทำรายการ</p>
                          <p className="text-white font-bold">{details.requester}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 shadow-inner flex-1 flex flex-col">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-3">{details.detailsLabel}</p>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 text-slate-300 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap font-medium shadow-inner flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {details.detailsNode || details.detailsValue}
                          </div>
                        </div>

                        {details.extraNode && (
                          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                            {details.extraNode}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    {log.type !== 'leave' && log.type !== 'resign' && (
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
                        <div className="w-full md:w-auto">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">สภาที่รับเรื่อง</p>
                          <div className={`bg-slate-950/80 border px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 min-w-[200px] shadow-inner ${isApproved ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-700/80 text-slate-300'}`}>
                            <UserCircle size={20} weight="fill" className={isApproved ? "text-emerald-500" : "text-blue-500"} />
                            {isApproved ? (log.approvedBy?.displayName || log.approvedBy?.email || 'Approved') : (log.data.councilMemberName || log.data.councilStaffName || '-- รอตรวจสอบ --')}
                          </div>
                        </div>
                        
                        <div className="w-full md:w-auto text-left md:text-right flex flex-col md:items-end">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">ยอดรวม</p>
                          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 drop-shadow-md">{details.amount}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-8">
                      {isApproved ? (
                        <div className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-4 rounded-2xl font-black flex items-center justify-center gap-2 cursor-default shadow-inner">
                          <CheckCircle size={22} weight="fill" /> ตรวจสอบและอนุมัติเรียบร้อยแล้ว
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApprove(log.id)}
                          className="relative w-full overflow-hidden bg-slate-800 hover:bg-slate-700 border border-amber-500/30 hover:border-amber-400/80 py-4 rounded-2xl font-black text-amber-400 hover:text-amber-300 transition-all duration-300 group/btn shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:-translate-y-0.5"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <CheckSquareOffset size={22} weight="bold" /> ยืนยันการตรวจสอบและอนุมัติ
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, logId: null, isLoading: false })}
        onConfirm={confirmDelete}
        title="ยืนยันการลบคำร้อง"
        message="คุณต้องการลบคำร้องนี้ออกจากระบบใช่หรือไม่? ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้"
        isLoading={confirmModal.isLoading}
        confirmText="ลบข้อมูล"
      />

      <ConfirmationModal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, logId: null, isLoading: false })}
        onConfirm={confirmApprove}
        title="ยืนยันการอนุมัติ"
        message="คุณตรวจสอบข้อมูลครบถ้วนแล้ว และต้องการอนุมัติคำร้องนี้ใช่หรือไม่?"
        isLoading={approveModal.isLoading}
        confirmText="ยืนยันการอนุมัติ"
      />
    </div>
  );
}
