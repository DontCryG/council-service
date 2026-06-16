import { useState, useEffect } from 'react';
import { listenTransactionLogs, deleteTransactionLog, updateTransactionLogStatus, sendWebhook, getTransactionImage, deleteTransactionImage } from '../../core/api';
import { useAppStore } from '../../store';
import { 
  FileText, PencilSimple, Buildings, Handshake, Gift,
  Trash, CheckCircle, Clock, Copy, UserCircle, CheckSquareOffset, ArrowsClockwise, MagnifyingGlass
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
          
          // Not deleting image to keep history in database
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

    const text = `===== COUNCIL DATA =====
สังกัด: ${details.title} (${orgType})
ผู้ทำรายการ: ${details.requester}
ธุรกรรม: ${details.transaction}
รายละเอียด:
${detailsLines}
เจ้าหน้าที่: ${staffName}
ยอดรวม: ${details.amount}`;

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
    }
  ];

  const filteredLogs = logs.filter(log => {
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
            log.data.hasWeaponWelfare ? 'เบิกอาวุธ: ใช่' : '',
            log.data.otherWelfare ? `อื่นๆ: ${log.data.otherWelfare}` : ''
          ].filter(Boolean).join('\n') || '-',
          amount: '-',
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
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT SIDEBAR (Menu) */}
      <div className="w-full lg:w-72 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-8 h-max">
        {categories.map((cat, i) => (
          <div key={i} className="space-y-3">
            <h3 className="text-xs font-bold text-amber-500 tracking-wider uppercase px-2">{cat.group}</h3>
            <div className="space-y-1">
              {cat.items.map(item => {
                const Icon = item.icon;
                const isActive = activeCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={20} weight={isActive ? "fill" : "duotone"} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">{activeCategoryLabel}</h1>
            <p className="text-slate-400 text-sm mt-1">รายการคำร้องที่รอตรวจสอบทั้งหมด</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full flex items-center gap-2 border border-amber-500/20">
              <Clock size={16} /> รอตรวจสอบ {pendingCount}
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> LIVE SYNC
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/50">
          <div className="relative w-full xl:w-96">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาข้อมูลผู้ร้อง, ชื่อแก๊ง..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['ALL', 'GANG', 'FAMILY'].map(g => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    groupFilter === g ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {g === 'ALL' ? 'ทั้งหมด (ALL)' : `${g} (${g === 'GANG' ? 'แก๊ง' : 'ครอบครัว'})`}
                </button>
              ))}
            </div>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" 
              title="รีเฟรชข้อมูล"
            >
              <ArrowsClockwise size={18} className={loading ? 'animate-spin' : ''} />
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
                <div key={log.id} className={`bg-slate-950 border rounded-2xl overflow-hidden shadow-lg transition-all ${isApproved ? 'border-emerald-500/30 opacity-75' : 'border-slate-800 hover:border-slate-700'}`}>
                  
                  {/* Card Header */}
                  <div className="px-6 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold rounded-md ${details.type === 'GANG' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                        {details.type === 'GANG' ? 'แก๊ง' : 'ครอบครัว'}
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1.5">
                        <Clock size={14} /> {log.createdAt.toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCopy(log, details, isApproved)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="คัดลอกข้อมูล">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDelete(log.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="ลบคำร้อง">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-black text-white mb-6">{details.title}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-5">
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-1">รายการธุรกรรม</p>
                          <p className="text-blue-400 font-bold text-lg">{details.transaction}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-1">ผู้ทำรายการ</p>
                          <p className="text-slate-200 font-medium">{details.requester}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                          <p className="text-xs font-bold text-slate-500 mb-2">{details.detailsLabel}</p>
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {details.detailsNode || details.detailsValue}
                          </div>
                        </div>

                        {details.extraNode && (
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            {details.extraNode}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-slate-800">
                      <div className="w-full md:w-auto">
                        <p className="text-xs font-bold text-slate-500 mb-1">สภาที่รับเรื่อง</p>
                        <div className={`bg-slate-900 border px-4 py-2 rounded-lg text-sm flex items-center gap-2 min-w-[200px] ${isApproved ? 'border-emerald-500/50 text-emerald-400' : 'border-slate-700 text-slate-300'}`}>
                          <UserCircle size={18} className={isApproved ? "text-emerald-500" : "text-blue-500"} />
                          {isApproved ? (log.approvedBy?.displayName || log.approvedBy?.email || 'Approved') : (log.data.councilMemberName || log.data.councilStaffName || '-- เลือกเจ้าหน้าที่สภา --')}
                        </div>
                      </div>
                      
                      <div className="w-full md:w-auto text-left md:text-right flex flex-col md:items-end">
                        <p className="text-xs font-bold text-slate-500 mb-1">ยอดรวม</p>
                        <p className="text-2xl font-black text-amber-500">{details.amount}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      {isApproved ? (
                        <div className="w-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                          <CheckCircle size={20} weight="fill" /> ตรวจสอบและอนุมัติเรียบร้อยแล้ว
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApprove(log.id)}
                          className="w-full bg-[#d4af37] hover:bg-[#c5a028] text-slate-900 py-4 rounded-xl font-black transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                        >
                          <CheckSquareOffset size={20} weight="bold" /> ตรวจสอบและอนุมัติ
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
