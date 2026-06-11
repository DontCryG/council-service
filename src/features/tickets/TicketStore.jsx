import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Ticket, ShoppingCart, WarningCircle, Buildings, ArrowLeft } from '@phosphor-icons/react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Ticket size={32} weight="duotone" className="text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">ระบบแลก TICKET</h1>
          <p className="text-slate-400">ส่งคำขอซื้อ Ticket สำหรับซื้อของสวัสดิการสภา</p>
        </div>
      </div>

      {!selectedType ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button
            onClick={() => setSelectedType('GANG')}
            className="bg-slate-900 border border-slate-800 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-amber-500/50 hover:bg-slate-800/50 transition-all group"
          >
            <div className="w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Buildings size={40} weight="fill" className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-widest">GANG</h2>
          </button>
          
          <button
            onClick={() => setSelectedType('FAMILY')}
            className="bg-slate-900 border border-slate-800 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
          >
            <div className="w-24 h-24 rounded-full bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Buildings size={40} weight="fill" className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-widest">FAMILY</h2>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white px-0"
            onClick={() => {
              setSelectedType(null);
              setFormData({...formData, groupName: ''});
              setSearchQuery('');
            }}
          >
            <ArrowLeft size={18} /> ย้อนกลับ
          </Button>
          
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-sm font-medium text-slate-300 ml-1">แก๊ง / แฟมิลี่ ของคุณ ({selectedType})</label>
                <div 
                  className={`w-full bg-slate-900 border ${isDropdownOpen ? 'border-blue-500' : 'border-slate-700'} rounded-lg px-4 py-2.5 text-white cursor-pointer flex justify-between items-center transition-colors`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={formData.groupName ? 'text-white' : 'text-slate-400'}>
                    {formData.groupName || '-- เลือกแก๊ง/แฟมิลี่ --'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-700">
                      <input 
                        type="text" 
                        placeholder="พิมพ์ค้นหาชื่อ..." 
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {!searchQuery.trim() ? null : groups.filter(g => g.type === selectedType && g.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">ไม่พบรายชื่อที่ค้นหา</div>
                      ) : (
                        groups.filter(g => g.type === selectedType && g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(g => (
                          <div 
                            key={g.id} 
                            className="px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                            onClick={() => {
                              setFormData({...formData, groupName: g.name});
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            {g.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

          {selectedGroup && (
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">โควต้าทั้งหมด ({roundStartDate} - {roundEndDate})</div>
                <div className="font-mono text-lg text-slate-300">{parseInt(maxQuota).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">ใช้ไปแล้ว</div>
                <div className="font-mono text-lg text-amber-500">{parseInt(usedQuota).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">คงเหลือ</div>
                <div className="font-mono text-lg font-bold text-emerald-500">{parseInt(remainingQuota).toLocaleString()}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="ผู้ติดต่อ (ชื่อในเกม)" 
              placeholder="ระบุชื่อผู้เบิก..." 
              required
              value={formData.requester}
              onChange={e => setFormData({...formData, requester: e.target.value})}
            />
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">สภาผู้ทำรายการ</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.councilStaffId}
                onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
                required
              >
                <option value="" disabled>-- เลือกชื่อสภา --</option>
                {councilMembers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Input 
              label={`จำนวน Ticket ที่ต้องการเบิก (เรท ${currentRate} ต่อ 1 Ticket)`}
              type="text"
              disabled={!selectedGroup || remainingQuota <= 0}
              placeholder={remainingQuota <= 0 ? "โควต้าเต็มแล้ว" : "ระบุจำนวน Ticket"}
              value={formData.amount}
              onChange={e => {
                const numStr = e.target.value.replace(/\D/g, '');
                const formatted = numStr ? Number(numStr).toLocaleString('en-US') : '';
                setFormData({...formData, amount: formatted});
              }}
              required
            />
            {amountToBuy > remainingQuota && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <WarningCircle /> ระบุจำนวนเกินโควต้าคงเหลือ
              </p>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl flex items-center justify-between mt-4">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Amount to Pay</p>
              <p className="text-xs text-slate-500 mt-1">ยอดเงินที่ต้องจ่ายสภา</p>
            </div>
            <div className="text-4xl font-black text-red-500 tracking-tighter">
              ${totalPrice.toLocaleString()}
            </div>
          </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              isLoading={isSubmitting}
              disabled={!isValidAmount || isSubmitting}
            >
              <ShoppingCart size={20} weight="fill" /> ส่งคำขอเบิก Ticket
            </Button>
          </form>
        </Card>
      </div>
      )}
    </div>
  );
}
