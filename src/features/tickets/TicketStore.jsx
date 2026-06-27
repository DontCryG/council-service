import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Ticket, ShoppingCart, WarningCircle, Buildings, ArrowLeft, ShieldChevron, House, MagnifyingGlass, ChartBar, UserCircle, CurrencyDollar } from '@phosphor-icons/react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { Card } from '../../components/ui/Card';

export default function TicketStore() {
  const navigate = useNavigate();
  const { showAlert } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [ticketsState, setTicketsState] = useState(null);
  const [councilMembers, setCouncilMembers] = useState([]);

  const [selectedType, setSelectedType] = useState(null); // 'GANG' | 'FAMILY' | null
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    groupName: '',
    amount: '',
    requester: '',
    councilStaffId: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubTickets = onSnapshot(doc(db, 'app_state', 'tickets'), (docSnap) => {
      if (docSnap.exists()) setTicketsState(docSnap.data());
      setLoading(false); // Stop loading when at least tickets load
    });

    const unsubGroups = onSnapshot(doc(db, 'app_state', 'groups'), (docSnap) => {
      if (docSnap.exists()) setGroups(docSnap.data().groups || []);
    });

    const unsubCouncil = onSnapshot(doc(db, 'app_state', 'council_members'), (docSnap) => {
      if (docSnap.exists()) setCouncilMembers(docSnap.data().members || []);
    });

    return () => {
      unsubTickets();
      unsubGroups();
      unsubCouncil();
    };
  }, []);

  const selectedGroup = groups.find(g => g.type === selectedType && g.name === formData.groupName);
  // Calculate Quotas
  let maxQuota = 0;
  let usedQuota = 0;
  let currentRate = 1;
  let roundStartDate = 'N/A';
  let roundEndDate = 'N/A';

  if (selectedGroup) {
    const settings = ticketsState?.settings || {
      rateGang: 1, rateFamily: 1, 
      quotaGang: 10000000, quotaFamily: 3000000, 
      roundStartDate: '2026-06-08', roundEndDate: '2026-06-14' 
    };

    maxQuota = selectedGroup.type === 'GANG' ? (settings.quotaGang || 10000000) : (settings.quotaFamily || 3000000);
    currentRate = selectedGroup.type === 'GANG' ? (settings.rateGang || 1) : (settings.rateFamily || 1);
    roundStartDate = settings.roundStartDate || 'N/A';
    roundEndDate = settings.roundEndDate || 'N/A';
    
    usedQuota = (ticketsState?.history || [])
      .filter(h => h.groupName === selectedGroup.name && h.status === 'APPROVED')
      .reduce((acc, cur) => acc + (parseInt(cur.amount) || 0), 0);
  }

  const remainingQuota = Math.max(0, maxQuota - usedQuota);
  const amountToBuy = parseInt(String(formData.amount).replace(/,/g, '')) || 0;
  const totalPrice = amountToBuy * currentRate;
  
  const isValidAmount = amountToBuy > 0 && amountToBuy <= remainingQuota;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.groupName || !formData.requester || !formData.councilStaffId) {
      showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (!isValidAmount) {
      showAlert('error', 'จำนวน Ticket ไม่ถูกต้อง หรือเกินโควต้า');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Re-fetch latest to avoid race conditions
      const tDoc = await getDoc(doc(db, 'app_state', 'tickets'));
      let currentState = { 
        orders: [], 
        history: [], 
        settings: ticketsState?.settings || {
          rateGang: 1, rateFamily: 1, 
          quotaGang: 10000000, quotaFamily: 3000000, 
          roundStartDate: '2026-06-08', roundEndDate: '2026-06-14' 
        }
      };
      
      if (tDoc.exists()) {
        const d = tDoc.data();
        currentState = { ...currentState, ...d };
      }

      const newOrder = {
        id: 'ord_' + Date.now(),
        groupName: formData.groupName,
        groupType: selectedGroup.type,
        amount: amountToBuy,
        rate: currentRate,
        totalPrice: totalPrice,
        requester: formData.requester,
        councilStaffId: formData.councilStaffId,
        councilStaffName: councilMembers.find(c => c.id === formData.councilStaffId)?.name || 'Unknown',
        timestamp: new Date().getTime(),
        status: 'PENDING'
      };

      currentState.orders.push(newOrder);

      await setDoc(doc(db, 'app_state', 'tickets'), currentState);
      
      showAlert('success', 'ส่งคำขอซื้อ Ticket เรียบร้อยแล้ว! (รอสภาอนุมัติ)');
      navigate('/home');
    } catch (err) {
      console.error(err);
      showAlert('error', 'เกิดข้อผิดพลาดในการทำรายการ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">กำลังโหลดระบบ Ticket...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-20">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Ticket size={32} className="text-white drop-shadow-md" weight="fill" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ระบบแลก TICKET</h2>
              <p className="text-slate-400 text-sm mt-1 font-medium flex items-center gap-2">
                <ShoppingCart size={16} className="text-amber-500" />
                ส่งคำขอซื้อ Ticket สำหรับซื้อของสวัสดิการสภา
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/home')} 
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-700/50 transition-all h-[44px]"
          >
            <ArrowLeft size={20} className="mr-2" /> <span className="hidden sm:inline font-bold">กลับศูนย์บัญชาการ</span>
          </Button>
        </div>
      </div>

      {!selectedType ? (
        <div className="w-full pt-6">
          <div className="text-center mb-12 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-slate-500/5 rounded-[100%] blur-3xl pointer-events-none"></div>
            <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-lg mb-3">เลือกประเภทสังกัด</h1>
            <p className="text-slate-400 text-lg">กรุณาเลือกประเภทสังกัดที่คุณต้องการเบิก Ticket</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* GANG CARD */}
            <button
              onClick={() => setSelectedType('GANG')}
              className="relative group bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:-translate-y-2 transition-all duration-500 overflow-hidden shadow-2xl"
            >
              {/* Glowing Backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] group-hover:bg-rose-500/30 transition-colors duration-700"></div>
              
              {/* Border Gradient on Hover */}
              <div className="absolute inset-0 rounded-[32px] border-2 border-transparent group-hover:border-rose-500/30 transition-colors duration-500"></div>
              
              <div className="relative z-10 w-32 h-32 rounded-3xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-xl shadow-black/40 group-hover:shadow-rose-500/20 group-hover:bg-rose-950/40">
                <Buildings size={56} weight="duotone" className="text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
              </div>
              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-black text-white tracking-[0.2em] mb-2 group-hover:text-rose-400 transition-colors">GANG</h2>
                <div className="h-1 w-12 bg-rose-500/50 rounded-full mx-auto group-hover:w-24 group-hover:bg-rose-500 transition-all duration-500"></div>
              </div>
            </button>
            
            {/* FAMILY CARD */}
            <button
              onClick={() => setSelectedType('FAMILY')}
              className="relative group bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-[32px] p-12 flex flex-col items-center justify-center gap-8 hover:-translate-y-2 transition-all duration-500 overflow-hidden shadow-2xl"
            >
              {/* Glowing Backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-colors duration-700"></div>
              
              {/* Border Gradient on Hover */}
              <div className="absolute inset-0 rounded-[32px] border-2 border-transparent group-hover:border-blue-500/30 transition-colors duration-500"></div>
              
              <div className="relative z-10 w-32 h-32 rounded-3xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 shadow-xl shadow-black/40 group-hover:shadow-blue-500/20 group-hover:bg-blue-950/40">
                <House size={56} weight="duotone" className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
              </div>
              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-black text-white tracking-[0.2em] mb-2 group-hover:text-blue-400 transition-colors">FAMILY</h2>
                <div className="h-1 w-12 bg-blue-500/50 rounded-full mx-auto group-hover:w-24 group-hover:bg-blue-500 transition-all duration-500"></div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl px-4 py-2 transition-all"
            onClick={() => {
              setSelectedType(null);
              setFormData({...formData, groupName: ''});
              setSearchQuery('');
            }}
          >
            <ArrowLeft size={18} className="mr-2" /> <span className="font-bold">ย้อนกลับไปเลือกประเภท</span>
          </Button>
          
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Ambient Background Lights */}
            <div className={`absolute top-0 right-0 w-96 h-96 ${selectedType === 'GANG' ? 'bg-rose-500/5' : 'bg-blue-500/5'} rounded-full blur-[100px] pointer-events-none`}></div>
            <div className={`absolute bottom-0 left-0 w-96 h-96 ${selectedType === 'GANG' ? 'bg-amber-500/5' : 'bg-cyan-500/5'} rounded-full blur-[100px] pointer-events-none`}></div>

            <form onSubmit={handleSubmit} className="relative z-10 p-6 sm:p-10 space-y-8">
              
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                <div className={`p-2 rounded-lg ${selectedType === 'GANG' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {selectedType === 'GANG' ? <ShieldChevron size={24} weight="fill" /> : <House size={24} weight="fill" />}
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">กรอกข้อมูลการเบิก Ticket</h3>
              </div>

              <div className="space-y-2 relative z-50" ref={dropdownRef}>
                <label className="text-sm font-bold text-slate-400 ml-1 tracking-wider uppercase">แก๊ง / แฟมิลี่ ของคุณ ({selectedType})</label>
                <div 
                  className={`w-full bg-slate-950/80 border ${isDropdownOpen ? (selectedType === 'GANG' ? 'border-rose-500/50' : 'border-blue-500/50') : 'border-slate-700/50'} rounded-xl px-5 py-3.5 text-white cursor-pointer flex justify-between items-center transition-all hover:border-slate-500 shadow-inner`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={formData.groupName ? 'text-white font-bold' : 'text-slate-500'}>
                    {formData.groupName || '-- เลือกแก๊ง/แฟมิลี่ --'}
                  </span>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-700/50 bg-slate-900/50">
                      <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="พิมพ์ค้นหาชื่อ..." 
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                      {groups.filter(g => g.type === selectedType && g.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div className="px-4 py-4 text-sm text-slate-500 text-center font-medium">ไม่พบรายชื่อที่ค้นหา</div>
                      ) : (
                        groups.filter(g => g.type === selectedType && g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(g => (
                          <div 
                            key={g.id} 
                            className={`px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white cursor-pointer transition-all rounded-lg m-1 flex items-center gap-2`}
                            onClick={() => {
                              setFormData({...formData, groupName: g.name});
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full ${selectedType === 'GANG' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                            {g.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

          {selectedGroup && (
            <div className="bg-slate-950/50 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <ChartBar size={18} /> สถานะโควต้าปัจจุบัน
                </div>
                <div className="text-xs font-mono bg-slate-900 border border-slate-700 px-3 py-1 rounded-md text-slate-400">
                  {roundStartDate} - {roundEndDate}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">โควต้าทั้งหมด</div>
                  <div className="font-mono text-2xl font-black text-slate-200">{parseInt(maxQuota).toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">ใช้ไปแล้ว</div>
                  <div className="font-mono text-2xl font-black text-amber-500">{parseInt(usedQuota).toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/80 rounded-xl p-4 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                  <div className="text-xs text-emerald-500/70 uppercase font-bold mb-1">โควต้าคงเหลือ</div>
                  <div className="font-mono text-3xl font-black text-emerald-400 drop-shadow-md">{parseInt(remainingQuota).toLocaleString()}</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">การใช้งานโควต้า</span>
                  <span className="text-slate-400">{Math.min(100, Math.round((usedQuota / maxQuota) * 100)) || 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (usedQuota / maxQuota) > 0.9 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                      (usedQuota / maxQuota) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (usedQuota / maxQuota) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <AutocompleteInput 
              label="ผู้ติดต่อ (ชื่อในเกม)" 
              placeholder="ระบุชื่อผู้เบิก..." 
              type="text"
              value={formData.requester}
              onChange={val => setFormData({...formData, requester: val})}
            />
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 tracking-wider uppercase">สภาผู้ทำรายการ</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <select 
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors appearance-none cursor-pointer hover:border-slate-500"
                  value={formData.councilStaffId}
                  onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
                  required
                >
                  <option value="" disabled className="text-slate-500">-- เลือกชื่อสภา --</option>
                  {councilMembers.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/50">
            <Input 
              label={`จำนวน Ticket ที่ต้องการเบิก (เรท ${currentRate} ต่อ 1 Ticket)`}
              type="text"
              disabled={!selectedGroup || remainingQuota <= 0}
              placeholder={remainingQuota <= 0 ? "โควต้าเต็มแล้ว" : "ระบุจำนวน Ticket (เช่น 1,000,000)"}
              value={formData.amount}
              onChange={e => {
                const numStr = e.target.value.replace(/\D/g, '');
                const formatted = numStr ? Number(numStr).toLocaleString('en-US') : '';
                setFormData({...formData, amount: formatted});
              }}
              required
            />
            {amountToBuy > remainingQuota && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1.5 font-medium animate-pulse">
                <WarningCircle weight="fill" /> จำนวนที่ระบุเกินโควต้าคงเหลือ!
              </p>
            )}
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-red-500/50 transition-colors shadow-2xl">
            <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-red-600/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-red-600/20 transition-colors"></div>
            
            <div className="relative z-10">
              <p className="text-red-400/80 text-xs font-black uppercase tracking-[0.2em] mb-1">Total Amount to Pay</p>
              <h4 className="text-white font-bold text-lg">ยอดเงินที่แก๊ง/แฟมต้องจ่ายให้สภา</h4>
            </div>
            
            <div className="relative z-10 flex items-center gap-3 bg-red-950/50 px-6 py-4 rounded-xl border border-red-500/20 shadow-inner">
              <CurrencyDollar size={32} weight="duotone" className="text-red-500" />
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-md">
                {totalPrice.toLocaleString()}
              </div>
            </div>
          </div>

            <Button 
              type="submit" 
              className="w-full relative overflow-hidden group bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-lg h-[60px] rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:-translate-y-1 transition-all border border-amber-400/30" 
              isLoading={isSubmitting}
              disabled={!isValidAmount || isSubmitting}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ShoppingCart size={24} weight="fill" /> ยืนยันการส่งคำขอเบิก Ticket
              </span>
            </Button>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
