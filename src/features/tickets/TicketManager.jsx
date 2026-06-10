import { useState, useEffect } from 'react';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAppStore } from '../../store';
import { Ticket, Clock, CheckCircle, XCircle, Gear, MagnifyingGlass, FileText, Download, ShieldChevron, House, CalendarBlank, WarningCircle, FloppyDisk, ArrowCounterClockwise, Trash, ChartBar } from '@phosphor-icons/react';

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

  useEffect(() => {
    const unsubTickets = onSnapshot(doc(db, 'app_state', 'tickets'), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setTicketsData({
          orders: d.orders || [],
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="text-amber-500" />
            ระบบจัดการ Ticket
          </h1>
          <p className="text-slate-400 mt-1">จัดการคำขอซื้อทิคเก็ต โควต้า และตั้งค่าเรทราคา</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
        {[
          { id: 'orders', label: 'คำขอรออนุมัติ', icon: Clock },
          { id: 'history', label: 'ประวัติการทำรายการ', icon: FileText },
          { id: 'salesHistory', label: 'ประวัติยอดขาย', icon: ChartBar },
          { id: 'quota', label: 'โควต้าแก๊ง/แฟม', icon: Ticket },
          { id: 'settings', label: 'ตั้งค่าระบบ', icon: Gear }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
            {tab.id === 'orders' && ticketsData.orders.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                {ticketsData.orders.length}
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
                    <Card key={order.id} className="p-0 overflow-hidden border-amber-500/30">
                      <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-amber-500 mb-1">
                            {new Date(order.timestamp).toLocaleString('th-TH')}
                          </div>
                          <h3 className="text-lg font-bold text-white">{order.groupName}</h3>
                          <p className="text-sm text-slate-400">ติดต่อโดย: {order.requester}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-1">สภาที่รับเรื่อง</div>
                          <div className="text-sm font-medium text-emerald-400">{order.councilStaffName || order.council}</div>
                        </div>
                      </div>
                      
                      <div className="p-4 grid grid-cols-2 gap-4 bg-slate-800/20">
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ticket Amount</div>
                          <div className="text-xl font-bold text-amber-400 flex items-center gap-1">
                            <Ticket size={20} /> {parseInt(order.amount).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total (Red Money)</div>
                          <div className="text-xl font-black text-red-500">
                            ${parseInt(order.totalPrice).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-t border-slate-800/50 flex gap-3">
                        <Button 
                          type="button"
                          className="flex-1 bg-[#10a365] hover:bg-[#0e8a55] text-white border-none py-3 rounded-xl font-bold text-sm" 
                          onClick={() => handleProcessOrder(order.id, 'APPROVED')}
                        >
                          <CheckCircle size={20} /> อนุมัติ
                        </Button>
                        <Button 
                          type="button"
                          className="flex-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white border-none py-3 rounded-xl font-bold text-sm"
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

              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-4">วันที่/เวลา</th>
                        <th className="px-6 py-4">ชื่อองค์กร</th>
                        <th className="px-6 py-4">ผู้ติดต่อ</th>
                        <th className="px-6 py-4 text-right">จำนวน Ticket</th>
                        <th className="px-6 py-4 text-right">ยอดเงินแดง</th>
                        <th className="px-6 py-4 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredHistory.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">ไม่มีประวัติ</td></tr>
                      ) : (
                        filteredHistory.map(h => (
                          <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                              {new Date(h.processedAt || h.timestamp).toLocaleString('th-TH')}
                            </td>
                            <td className="px-6 py-4 font-bold text-white">{h.groupName}</td>
                            <td className="px-6 py-4 text-slate-400">{h.requester}</td>
                            <td className="px-6 py-4 text-right font-mono text-amber-400">
                              {parseInt(h.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-red-400">
                              ${parseInt(h.totalPrice).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {h.status === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-500/20">
                                  <CheckCircle size={14} weight="fill" /> APPROVED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-500/20">
                                  <XCircle size={14} weight="fill" /> REJECTED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
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
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-4">องค์กร</th>
                        <th className="px-6 py-4 text-center">ประเภท</th>
                        <th className="px-6 py-4 text-right">โควต้าสูงสุด / รอบ</th>
                        <th className="px-6 py-4 text-right">ใช้ไปแล้ว</th>
                        <th className="px-6 py-4 text-right">คงเหลือ</th>
                        <th className="px-6 py-4">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {groups.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลองค์กรในระบบ</td></tr>
                      ) : (
                        groups.map(g => {
                          const used = getUsedQuota(g.name);
                          const max = g.type === 'GANG' ? ticketsData.settings.quotaGang : ticketsData.settings.quotaFamily;
                          const remaining = Math.max(0, max - used);
                          const percent = Math.min(100, (used / max) * 100);

                          return (
                            <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: g.color}}></div>
                                {g.name}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-xs bg-slate-800 px-2 py-1 rounded uppercase">{g.type}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-slate-400">{parseInt(max).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-mono text-amber-400">{parseInt(used).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">{parseInt(remaining).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
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
                  <Card className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Rates */}
                      <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                        <div className="text-sm font-bold text-slate-400 mb-4 tracking-wider">เรทแลกเปลี่ยน (1 TICKET)</div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                              <ShieldChevron size={18} /> แก๊ง
                            </div>
                            <div className="text-xl font-black text-white">
                              {ticketsData.settings.rateGang} <span className="text-xs text-slate-500 font-normal">Cash</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-blue-400 font-bold">
                              <House size={18} /> ครอบครัว
                            </div>
                            <div className="text-xl font-black text-white">
                              {ticketsData.settings.rateFamily} <span className="text-xs text-slate-500 font-normal">Cash</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quotas */}
                      <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="text-sm font-bold text-slate-400 mb-4 tracking-wider">โควต้าสูงสุดพื้นฐาน / สัปดาห์</div>
                        <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                              <ShieldChevron size={18} /> แก๊ง
                            </div>
                            <div className="text-xl font-black text-white">
                              {parseInt(ticketsData.settings.quotaGang).toLocaleString()} <span className="text-xs text-slate-500 font-normal">ใบ</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-blue-400 font-bold">
                              <House size={18} /> ครอบครัว
                            </div>
                            <div className="text-xl font-black text-white">
                              {parseInt(ticketsData.settings.quotaFamily).toLocaleString()} <span className="text-xs text-slate-500 font-normal">ใบ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-6">
                      <div>
                        <div className="text-sm font-bold text-slate-400 mb-2">รอบเวลาโควต้าปัจจุบัน</div>
                        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg font-mono text-lg font-bold text-slate-300">
                          <span>{ticketsData.settings.roundStartDate || 'N/A'}</span>
                          <span className="text-slate-600">|</span>
                          <span>{ticketsData.settings.roundEndDate || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setTempSettings(ticketsData.settings);
                          setIsEditingSettings(true);
                        }}
                      >
                        <Gear size={18} /> แก้ไขการตั้งค่า
                      </Button>
                    </div>
                  </Card>

                  <div className="mt-6 bg-red-950/20 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-black text-red-500 flex items-center gap-2 mb-2">
                        <WarningCircle size={24} weight="fill" /> ปิดรอบการขาย (End of Round)
                      </h3>
                      <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                        เมื่อถึงกำหนดหมดรอบ ให้กดปุ่มนี้เพื่อสรุปยอดขายเก็บไว้ใน "ประวัติยอดขาย" และ <strong className="text-red-400">ล้างรายการคำสั่งซื้อทั้งหมด</strong> เพื่อให้โควต้าทุกแก๊งกลับมาเป็นศูนย์
                      </p>
                    </div>
                    <Button 
                      type="button"
                      className="bg-red-600 hover:bg-red-500 whitespace-nowrap px-8 py-3 h-auto text-base"
                      onClick={() => setShowConfirmReset(true)}
                    >
                      ปิดรอบการขายและรีเซ็ต
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
