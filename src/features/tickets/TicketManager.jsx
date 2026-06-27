import { useState, useEffect, useRef } from 'react';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAppStore } from '../../store';
import { Ticket, Clock, CheckCircle, XCircle, Gear, MagnifyingGlass, FileText, Download, ShieldChevron, House, CalendarBlank, WarningCircle, FloppyDisk, ArrowCounterClockwise, Trash, ChartBar, SpeakerHigh, UserCircle, CurrencyDollar } from '@phosphor-icons/react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

export default function TicketManager() {
  const { showAlert, user } = useAppStore();
  const [activeTab, setActiveTab] = useState('orders'); // orders, history, settings, quota
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(null);
  
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [deleteSalesId, setDeleteSalesId] = useState(null);
  
  const [ticketsData, setTicketsData] = useState({
    orders: [],
    history: [],
    salesHistory: [],
    settings: {
      rateGang: 1,
      rateFamily: 1,
      quotaGang: 10000000,
      quotaFamily: 3000000,
      roundStartDate: '2026-06-08',
      roundEndDate: '2026-06-14'
    }
  });

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const prevOrdersCount = useRef(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const unsubTickets = onSnapshot(doc(db, 'app_state', 'tickets'), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        const currentOrders = d.orders || [];

        if (!isInitialLoad.current && currentOrders.length > prevOrdersCount.current) {
          try {
            const audio = new Audio('/alert_sound.mp3');
            audio.play();
          } catch(e) {
            console.error("Audio play failed:", e);
          }
          showAlert('info', '🛎️ มีออเดอร์ขอซื้อตั๋วเข้ามาใหม่!');
        }

        prevOrdersCount.current = currentOrders.length;
        isInitialLoad.current = false;

        setTicketsData({
          orders: currentOrders,
          history: d.history || [],
          salesHistory: d.salesHistory || [],
          settings: d.settings || { 
            rateGang: 1, rateFamily: 1, 
            quotaGang: 10000000, quotaFamily: 3000000, 
            roundStartDate: '2026-06-08', roundEndDate: '2026-06-14' 
          }
        });
      }
      setLoading(false);
    });

    const unsubGroups = onSnapshot(doc(db, 'app_state', 'groups'), (docSnap) => {
      if (docSnap.exists()) {
        setGroups(docSnap.data().groups || []);
      }
    });

    return () => {
      unsubTickets();
      unsubGroups();
    };
  }, []);

  const saveTicketsToDb = async (newData) => {
    try {
      await setDoc(doc(db, 'app_state', 'tickets'), {
        ...newData,
        updated_at: new Date().getTime()
      });
    } catch (e) {
      console.error(e);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleUpdateSettings = (field, value) => {
    setTempSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    const newData = {
      ...ticketsData,
      settings: tempSettings
    };
    saveTicketsToDb(newData);
    setIsEditingSettings(false);
  };

  const handleResetRound = async () => {
    if (ticketsData.orders && ticketsData.orders.length > 0) {
      showAlert('error', 'ไม่สามารถปิดรอบได้ กรุณาตรวจสอบและจัดการคำสั่งซื้อที่ค้างอยู่ (Pending) ให้หมดก่อน');
      setShowConfirmReset(false);
      return;
    }

    const newSettings = { ...(ticketsData.settings || {}) };
    
    const addDays = (dateString, days) => {
      if (!dateString) return dateString;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    const approvedOrders = ticketsData.history.filter(h => h.status === 'APPROVED');
    const totalTickets = approvedOrders.reduce((sum, h) => sum + (parseInt(h.amount) || 0), 0);
    const totalCash = approvedOrders.reduce((sum, h) => sum + (parseInt(h.totalPrice) || 0), 0);
    const storeState = useAppStore.getState();
    const currentCouncilUsername = storeState.councilUsername;
    let closedBy = currentCouncilUsername || user?.councilUsername || user?.displayName || user?.username || user?.email || 'Admin';
    if (closedBy && closedBy.includes('@')) {
      closedBy = closedBy.split('@')[0];
    }

    const newSaleRecord = {
      id: 'sale_' + Date.now(),
      roundStartDate: newSettings.roundStartDate || '',
      roundEndDate: newSettings.roundEndDate || '',
      totalTickets,
      totalCash,
      approvedCount: approvedOrders.length,
      closedBy,
      closedAt: new Date().getTime()
    };

    newSettings.roundStartDate = addDays(newSettings.roundStartDate, 7);
    newSettings.roundEndDate = addDays(newSettings.roundEndDate, 7);

    const newData = {
      ...ticketsData,
      settings: newSettings,
      orders: [],
      history: [],
      salesHistory: [newSaleRecord, ...(ticketsData.salesHistory || [])]
    };
    await saveTicketsToDb(newData);
    setShowConfirmReset(false);
    showAlert('success', 'ปิดรอบการขาย โควต้าแก๊งกลับเป็นศูนย์ และเลื่อนวันที่รอบใหม่เรียบร้อยแล้ว');
  };

  const handleDeleteSalesHistory = (id) => {
    const newData = {
      ...ticketsData,
      salesHistory: (ticketsData.salesHistory || []).filter(s => s.id !== id)
    };
    saveTicketsToDb(newData);
    showAlert('success', 'ลบประวัติยอดขายเรียบร้อยแล้ว');
  };

  const handleProcessOrder = (id, status) => {
    const orderIndex = ticketsData.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return;

    const order = ticketsData.orders[orderIndex];
    order.status = status;
    order.processedAt = new Date().getTime();

    const newOrders = [...ticketsData.orders];
    newOrders.splice(orderIndex, 1);

    const newHistory = [order, ...ticketsData.history];

    saveTicketsToDb({
      ...ticketsData,
      orders: newOrders,
      history: newHistory
    });
    showAlert('success', `ทำรายการ ${status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'} เรียบร้อยแล้ว`);
  };

  const filteredOrders = ticketsData.orders.filter(o => 
    o.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.requester?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = ticketsData.history.filter(h => {
    if (filterType !== 'ALL' && h.status !== filterType) return false;
    return h.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           h.requester?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUsedQuota = (groupName) => {
    // calculate approved ticket amount in history for this group
    return ticketsData.history
      .filter(h => h.groupName === groupName && h.status === 'APPROVED')
      .reduce((acc, cur) => acc + (parseInt(cur.amount) || 0), 0);
  };

  const handleExportCsv = () => {
    // Generate simple CSV
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "ID,วันที่,แก๊ง/แฟมิลี่,ผู้ติดต่อ,จำนวน Ticket,เรทราคา,ยอดรวม (เงินแดง),สถานะ\n";
    
    ticketsData.history.forEach(h => {
      const date = new Date(h.timestamp || h.processedAt || Date.now()).toLocaleString('th-TH');
      csvContent += `${h.id},"${date}","${h.groupName}","${h.requester}",${h.amount},${h.rate},${h.totalPrice},${h.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ticket_history_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playTestSound = () => {
    try {
      const audio = new Audio('/alert_sound.mp3');
      audio.play().catch(e => console.error("Audio play failed:", e));
      showAlert('success', 'ทดสอบเสียงแจ้งเตือนสำเร็จ!');
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Ticket size={28} className="text-white drop-shadow-md" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-2">
                ระบบจัดการ Ticket
                <button 
                  onClick={playTestSound}
                  className="ml-2 p-1.5 rounded-full bg-slate-800/50 text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-all group relative border border-slate-700/50 hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  title="ทดสอบเสียงแจ้งเตือน (คลิกเพื่อปลดล็อคเสียงให้เบราว์เซอร์)"
                >
                  <SpeakerHigh size={20} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity font-medium">
                    ทดสอบ / เปิดเสียง
                  </span>
                </button>
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                <ShieldChevron size={14} className="text-slate-500" />
                ศูนย์กลางการจัดการคำขอซื้อทิคเก็ต โควต้า และเรทราคาสภา
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-x-auto custom-scrollbar shadow-inner relative z-20">
        {[
          { id: 'orders', label: 'คำขอรออนุมัติ', icon: Clock, count: ticketsData.orders.length },
          { id: 'history', label: 'ประวัติการทำรายการ', icon: FileText },
          { id: 'salesHistory', label: 'ประวัติยอดขาย', icon: ChartBar },
          { id: 'quota', label: 'โควต้าแก๊ง/แฟม', icon: Ticket },
          { id: 'settings', label: 'ตั้งค่าระบบ', icon: Gear }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden group flex-1 justify-center ${
              activeTab === tab.id 
                ? 'text-amber-400 shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl" />
            )}
            <tab.icon size={18} className={`relative z-10 ${activeTab === tab.id ? 'drop-shadow-md' : 'group-hover:scale-110 transition-transform'}`} weight={activeTab === tab.id ? "fill" : "regular"} /> 
            <span className="relative z-10">{tab.label}</span>
            {tab.id === 'orders' && tab.count > 0 && (
              <span className="relative z-10 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-1.5 shadow-md shadow-red-500/30 animate-pulse">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="py-20 text-center text-slate-500 border-dashed border-slate-700">กำลังโหลดข้อมูลระบบ...</Card>
      ) : (
        <>
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input 
                  className="pl-10 bg-slate-900/80" 
                  placeholder="ค้นหาชื่อแก๊ง หรือ ชื่อผู้ติดต่อ..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredOrders.length === 0 ? (
                <Card className="py-20 text-center text-slate-500 border-dashed border-slate-700">ไม่มีคำขอรออนุมัติ</Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredOrders.map(order => (
                    <Card key={order.id} className="p-0 overflow-hidden border-slate-700/50 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-300 group">
                      <div className="bg-slate-900/80 backdrop-blur-sm p-5 border-b border-slate-800/80 flex justify-between items-start relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
                        <div className="relative z-10">
                          <div className="text-[10px] font-bold text-amber-500 mb-1 tracking-wider uppercase flex items-center gap-1">
                            <Clock size={12} weight="bold" /> {new Date(order.timestamp).toLocaleString('th-TH')}
                          </div>
                          <h3 className="text-xl font-black text-white">{order.groupName}</h3>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><UserCircle size={14}/> ติดต่อ: {order.requester}</p>
                        </div>
                        <div className="text-right relative z-10">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">สภาที่รับเรื่อง</div>
                          <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{order.councilStaffName || order.council}</div>
                        </div>
                      </div>
                      
                      <div className="p-5 grid grid-cols-2 gap-4 bg-slate-950/50">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Ticket Amount</div>
                          <div className="text-2xl font-black text-amber-400 flex items-center gap-1.5 drop-shadow-md">
                            <Ticket size={24} weight="fill" /> {parseInt(order.amount).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Total (Red Money)</div>
                          <div className="text-2xl font-black text-red-500 drop-shadow-md">
                            ${parseInt(order.totalPrice).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-t border-slate-800/80 flex gap-3 bg-slate-900/30">
                        <Button 
                          type="button"
                          className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-none py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5" 
                          onClick={() => handleProcessOrder(order.id, 'APPROVED')}
                        >
                          <CheckCircle size={20} weight="fill" /> อนุมัติ
                        </Button>
                        <Button 
                          type="button"
                          className="flex-1 bg-transparent hover:bg-red-500/10 text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 py-3 rounded-xl font-bold text-sm transition-all"
                          onClick={() => handleProcessOrder(order.id, 'REJECTED')}
                        >
                          <XCircle size={20} /> ปฏิเสธ
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input 
                    className="pl-10" 
                    placeholder="ค้นหาชื่อแก๊ง หรือ ชื่อผู้ติดต่อ..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 text-white text-sm"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                  >
                    <option value="ALL">ทุกสถานะ</option>
                    <option value="APPROVED">อนุมัติแล้ว</option>
                    <option value="REJECTED">ถูกปฏิเสธ</option>
                  </select>
                  <Button variant="outline" onClick={handleExportCsv}>
                    <Download size={16} /> Export
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                  <Card className="py-20 text-center text-slate-500 border-dashed border-slate-700">ไม่มีประวัติ</Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHistory.map(h => (
                      <div key={h.id} className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 hover:border-slate-500/50 hover:shadow-lg transition-all duration-300 group overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-800/50 rounded-full blur-xl group-hover:bg-slate-700/50 transition-colors pointer-events-none -mr-10 -mt-10"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                          <div>
                            <div className="font-black text-white text-lg">{h.groupName}</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><UserCircle size={14}/> ติดต่อ: {h.requester}</div>
                          </div>
                          {h.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                              <CheckCircle size={14} weight="fill" /> APPROVED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.1)]">
                              <XCircle size={14} weight="fill" /> REJECTED
                            </span>
                          )}
                        </div>
                        
                        <div className="relative z-10 bg-slate-950/80 rounded-xl p-3 grid grid-cols-2 gap-3 border border-slate-800/80 mb-4 shadow-inner">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Ticket</div>
                            <div className="font-mono text-amber-400 font-bold text-lg flex items-center gap-1"><Ticket size={14} weight="fill"/> {parseInt(h.amount).toLocaleString()}</div>
                          </div>
                          <div className="text-right border-l border-slate-800/80 pl-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Red Money</div>
                            <div className="font-mono text-red-400 font-bold text-lg">${parseInt(h.totalPrice).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="relative z-10 text-[10px] font-medium text-slate-500 text-right flex items-center justify-end gap-1">
                          <Clock size={12} /> {new Date(h.processedAt || h.timestamp).toLocaleString('th-TH')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SALES HISTORY TAB */}
          {activeTab === 'salesHistory' && (
            <div className="space-y-4">
              {(!ticketsData.salesHistory || ticketsData.salesHistory.length === 0) ? (
                <Card className="py-20 text-center text-slate-500 border-dashed border-slate-700">ไม่มีประวัติยอดขาย (ต้องทำการปิดรอบการขายก่อน)</Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {ticketsData.salesHistory.map(record => (
                    <Card key={record.id} className="p-0 overflow-hidden bg-slate-900 border border-slate-800 shadow-xl relative group transition-all hover:-translate-y-1 hover:shadow-amber-500/5">
                      <div className="absolute top-0 right-0 bottom-0 w-2 bg-gradient-to-b from-amber-400 to-amber-600"></div>
                      <div className="p-7 pr-10">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap border border-amber-500/20">รอบวันที่</span>
                            <div className="text-lg font-black text-white flex items-center gap-2">
                              <span>{record.roundStartDate}</span>
                              <span className="text-slate-600 font-light">|</span>
                              <span>{record.roundEndDate}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setDeleteSalesId(record.id)}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                          >
                            <Trash size={18} />
                          </button>
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 mb-8 backdrop-blur-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                          <div className="grid grid-cols-2 gap-6 relative z-10">
                            <div>
                              <div className="text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wide">TICKET รวม</div>
                              <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                                <Ticket size={20} weight="fill" className="text-amber-500/40 hidden sm:block" />
                                {parseInt(record.totalTickets).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wide">ยอดเงินรวม (CASH)</div>
                              <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                                <span className="text-emerald-500/40 hidden sm:block">$</span>
                                {parseInt(record.totalCash).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400 font-medium relative z-10">
                            <CheckCircle size={16} className="text-emerald-500" weight="fill" />
                            จากคำสั่งซื้อที่อนุมัติจำนวน: <span className="font-bold text-white bg-slate-900 border border-slate-700 px-2 py-0.5 rounded shadow-inner">{record.approvedCount}</span> รายการ
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs font-medium gap-3">
                          <div className="text-slate-500 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                            ปิดรอบโดย: <span className="text-white font-bold">{record.closedBy}</span>
                          </div>
                          <div className="text-slate-500 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
                            <Clock size={14} className="text-slate-600" />
                            {new Date(record.closedAt).toLocaleString('th-TH')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUOTA TAB */}
          {activeTab === 'quota' && (
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input 
                  className="pl-10 bg-slate-900/80" 
                  placeholder="ค้นหาชื่อองค์กร หรือ ประเภท..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                  <Card className="py-20 text-center text-slate-500 border-dashed border-slate-700">ไม่มีข้อมูลองค์กรที่ค้นหา</Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredGroups.map(g => {
                      const used = getUsedQuota(g.name);
                      const max = g.type === 'GANG' ? ticketsData.settings.quotaGang : ticketsData.settings.quotaFamily;
                      const remaining = Math.max(0, max - used);
                      const percent = Math.min(100, (used / max) * 100);

                      return (
                        <div key={g.id} className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 hover:border-slate-500/50 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] pointer-events-none transition-all duration-500 opacity-20 group-hover:opacity-40 -mr-10 -mt-10 ${g.type === 'GANG' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          {/* Top Border Accent Gradient */}
                          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${g.type === 'GANG' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-indigo-500'}`}></div>
                          
                          <div className="relative z-10 flex items-center gap-4 mb-5 mt-1">
                            <div className="relative w-12 h-12 rounded-xl border-2 border-slate-700/80 flex-shrink-0 shadow-lg" style={{backgroundColor: g.color || '#334155'}}>
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent rounded-lg"></div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-black text-white text-lg truncate drop-shadow-md">{g.name}</h3>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                {g.type === 'GANG' ? <ShieldChevron size={12} className="text-amber-500" weight="fill" /> : <House size={12} className="text-blue-500" weight="fill" />}
                                {g.type}
                              </div>
                            </div>
                          </div>

                          <div className="relative z-10 bg-slate-950/80 rounded-xl p-3.5 grid grid-cols-2 gap-3 border border-slate-800/80 mb-4 shadow-inner">
                            <div className="text-center">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ใช้ไปแล้ว</div>
                              <div className="font-mono text-amber-400 font-black text-lg drop-shadow-md">{parseInt(used).toLocaleString()}</div>
                            </div>
                            <div className="text-center border-l border-slate-800/80">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">คงเหลือ</div>
                              <div className="font-mono text-emerald-400 font-black text-lg drop-shadow-md">{parseInt(remaining).toLocaleString()}</div>
                            </div>
                          </div>

                          <div className="relative z-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                            <span className="text-slate-500">โควต้าสูงสุด: {parseInt(max).toLocaleString()}</span>
                            <span className={`font-black text-sm drop-shadow-md ${percent > 90 ? 'text-rose-500' : percent > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {percent.toFixed(0)}%
                            </span>
                          </div>
                          <div className="relative z-10 w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
                            <div 
                              className={`h-full relative overflow-hidden transition-all duration-1000 ease-out bg-gradient-to-r ${percent > 90 ? 'from-red-600 to-rose-400' : percent > 70 ? 'from-orange-600 to-amber-400' : 'from-emerald-600 to-teal-400'}`} 
                              style={{ width: `${percent}%` }}
                            >
                               <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white">System Settings</h2>
                <p className="text-slate-400">กำหนดราคาและลิมิตประจำสัปดาห์ แยกอิสระระหว่างแก๊งและครอบครัว</p>
              </div>

              {!isEditingSettings ? (
                <>
                  <Card className="p-8 border-slate-700/50 bg-slate-900/60 backdrop-blur-md shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative">
                      {/* Glow Behind Rates */}
                      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2"></div>
                      
                      {/* Rates */}
                      <div className="bg-slate-950/80 rounded-3xl p-7 border border-slate-800/80 shadow-inner relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none -mr-8 -mt-8"></div>
                        <div className="text-xs font-black text-slate-500 mb-6 tracking-widest uppercase flex items-center gap-2">
                          <CurrencyDollar size={16} /> เรทแลกเปลี่ยน (1 TICKET)
                        </div>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center pb-5 border-b border-slate-800/80">
                            <div className="flex items-center gap-2.5 text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                              <ShieldChevron size={18} weight="fill" /> แก๊ง
                            </div>
                            <div className="text-2xl font-black text-white drop-shadow-md">
                              {ticketsData.settings.rateGang} <span className="text-sm text-slate-500 font-bold ml-1">Cash</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5 text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                              <House size={18} weight="fill" /> ครอบครัว
                            </div>
                            <div className="text-2xl font-black text-white drop-shadow-md">
                              {ticketsData.settings.rateFamily} <span className="text-sm text-slate-500 font-bold ml-1">Cash</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quotas */}
                      <div className="bg-slate-950/80 rounded-3xl p-7 border border-slate-800/80 shadow-inner relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none -mr-8 -mt-8"></div>
                        <div className="text-xs font-black text-slate-500 mb-6 tracking-widest uppercase flex items-center gap-2">
                          <ChartBar size={16} /> โควต้าสูงสุดพื้นฐาน / สัปดาห์
                        </div>
                        <div className="space-y-6 relative z-10">
                          <div className="flex justify-between items-center pb-5 border-b border-slate-800/80">
                            <div className="flex items-center gap-2.5 text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                              <ShieldChevron size={18} weight="fill" /> แก๊ง
                            </div>
                            <div className="text-2xl font-black text-white drop-shadow-md">
                              {parseInt(ticketsData.settings.quotaGang).toLocaleString()} <span className="text-sm text-slate-500 font-bold ml-1">ใบ</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5 text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                              <House size={18} weight="fill" /> ครอบครัว
                            </div>
                            <div className="text-2xl font-black text-white drop-shadow-md">
                              {parseInt(ticketsData.settings.quotaFamily).toLocaleString()} <span className="text-sm text-slate-500 font-bold ml-1">ใบ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-6 border-t border-slate-800/50">
                      <div>
                        <div className="text-xs font-black text-slate-500 mb-3 uppercase tracking-widest">รอบเวลาโควต้าปัจจุบัน</div>
                        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 shadow-inner px-5 py-2.5 rounded-xl font-mono text-lg font-bold text-amber-400">
                          <CalendarBlank size={18} className="text-slate-500" />
                          <span>{ticketsData.settings.roundStartDate || 'N/A'}</span>
                          <span className="text-slate-700">|</span>
                          <span>{ticketsData.settings.roundEndDate || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 font-bold transition-all h-[52px] px-8 rounded-xl shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        onClick={() => {
                          setTempSettings(ticketsData.settings);
                          setIsEditingSettings(true);
                        }}
                      >
                        <Gear size={20} weight="fill" className="mr-2" /> แก้ไขการตั้งค่า
                      </Button>
                    </div>
                  </Card>

                  <div className="mt-8 relative overflow-hidden bg-gradient-to-r from-red-950/40 to-rose-950/40 border border-red-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-red-500/40 transition-colors shadow-2xl">
                    <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-red-600/20 transition-all duration-700"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-red-500 flex items-center gap-2 mb-3 drop-shadow-md">
                        <WarningCircle size={28} weight="fill" /> ปิดรอบการขาย (End of Round)
                      </h3>
                      <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                        เมื่อถึงกำหนดหมดรอบ ให้กดปุ่มนี้เพื่อสรุปยอดขายเก็บไว้ใน "ประวัติยอดขาย" และ <strong className="text-red-400 font-bold">ล้างรายการคำสั่งซื้อที่ประมวลผลแล้ว</strong> เพื่อให้โควต้าทุกกลุ่มกลับมาเป็นศูนย์
                      </p>
                    </div>
                    <Button 
                      type="button"
                      className="relative z-10 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black whitespace-nowrap px-10 py-4 h-auto text-lg rounded-2xl shadow-xl shadow-red-900/50 hover:shadow-red-500/40 hover:-translate-y-1 transition-all border border-red-400/20"
                      onClick={() => setShowConfirmReset(true)}
                    >
                      <ArrowCounterClockwise size={22} weight="bold" className="mr-2" /> ปิดรอบและรีเซ็ต
                    </Button>
                  </div>
                </>
              ) : (
                <Card className="p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                  
                  <div className="space-y-8 relative z-10">
                    {/* Gang Settings */}
                    <div>
                      <div className="flex items-center gap-2 text-white font-black mb-4">
                        <ShieldChevron size={20} className="text-red-500" /> แก๊ง (Gang)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                          label="เรทแลกเปลี่ยน (1 TICKET = ? CASH)"
                          type="number"
                          min="1"
                          value={tempSettings.rateGang}
                          onChange={e => handleUpdateSettings('rateGang', parseInt(e.target.value) || 1)}
                        />
                        <Input 
                          label="โควต้าสูงสุดเริ่มต้น"
                          type="number"
                          min="0"
                          step="100000"
                          value={tempSettings.quotaGang}
                          onChange={e => handleUpdateSettings('quotaGang', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Family Settings */}
                    <div>
                      <div className="flex items-center gap-2 text-white font-black mb-4">
                        <House size={20} className="text-blue-500" /> ครอบครัว (Family)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                          label="เรทแลกเปลี่ยน (1 TICKET = ? CASH)"
                          type="number"
                          min="1"
                          value={tempSettings.rateFamily}
                          onChange={e => handleUpdateSettings('rateFamily', parseInt(e.target.value) || 1)}
                        />
                        <Input 
                          label="โควต้าสูงสุดเริ่มต้น"
                          type="number"
                          min="0"
                          step="100000"
                          value={tempSettings.quotaFamily}
                          onChange={e => handleUpdateSettings('quotaFamily', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Date Settings */}
                    <div className="pt-6 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-white font-bold mb-4">
                        <CalendarBlank size={20} className="text-amber-500" /> กำหนดรอบเวลาโควต้า
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                          label="วันที่เริ่มต้นรอบการขาย"
                          type="date"
                          value={tempSettings.roundStartDate || ''}
                          onChange={e => handleUpdateSettings('roundStartDate', e.target.value)}
                        />
                        <Input 
                          label="วันที่สิ้นสุดรอบการขาย"
                          type="date"
                          value={tempSettings.roundEndDate || ''}
                          onChange={e => handleUpdateSettings('roundEndDate', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-8 border-t border-slate-800 flex items-center gap-4">
                      <Button 
                        className="bg-[#D4A336] hover:bg-[#c2932f] text-slate-900 px-8 py-2.5 h-auto font-bold text-base"
                        onClick={handleSaveSettings}
                      >
                        <FloppyDisk size={20} weight="fill" /> บันทึกการตั้งค่า
                      </Button>
                      <Button 
                        variant="outline"
                        className="px-8 py-2.5 h-auto text-base border-slate-700 hover:bg-slate-800 text-white"
                        onClick={() => setIsEditingSettings(false)}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal 
        isOpen={showConfirmReset} 
        onClose={() => setShowConfirmReset(false)}
        title="⚠️ ยืนยันการปิดรอบการขาย"
      >
        <div className="space-y-6">
          <p className="text-slate-300">
            คุณต้องการ <strong className="text-red-400">ปิดรอบการขายและรีเซ็ตคำสั่งซื้อ/โควต้า</strong> ทั้งหมดใช่หรือไม่?
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
            <li>รายการคำสั่งซื้อที่ "รออนุมัติ" จะถูกลบออกทั้งหมด</li>
            <li>ประวัติการทำรายการก่อนหน้า จะยังคงอยู่</li>
            <li>โควต้าของทุกแก๊งและครอบครัว จะกลับมาเต็ม 100% ตามที่ตั้งค่าไว้</li>
          </ul>
          
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmReset(false)}
              className="px-6"
            >
              ยกเลิก
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-500 text-white px-6 shadow-red-900/20"
              onClick={handleResetRound}
            >
              ยืนยันการรีเซ็ต
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Sales History Modal */}
      <Modal
        isOpen={!!deleteSalesId}
        onClose={() => setDeleteSalesId(null)}
        title="ยืนยันการลบประวัติยอดขาย"
      >
        <div className="space-y-6">
          <p className="text-slate-300">
            คุณต้องการลบประวัติยอดขายนี้ใช่หรือไม่? <br/>
            <span className="text-sm text-slate-500">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
          </p>
          <div className="flex gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => setDeleteSalesId(null)}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="danger" 
              className="flex-1 bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
              onClick={() => {
                handleDeleteSalesHistory(deleteSalesId);
                setDeleteSalesId(null);
              }}
            >
              ลบข้อมูล
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
