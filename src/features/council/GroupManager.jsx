import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Buildings, Plus, PencilSimple, Trash, MagnifyingGlass, Shield, House, Link, Palette, CheckCircle, X } from '@phosphor-icons/react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

export default function GroupManager() {
  const { user } = useAppStore();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  const [formData, setFormData] = useState({ 
    type: 'GANG', 
    name: '', 
    logo: '', 
    suitColor: 'ยังไม่ระบุ / สีอิสระ',
    updatedBy: '',
    updatedAt: ''
  });

  const SUIT_COLORS = [
    'ยังไม่ระบุ / สีอิสระ',
    'สีดำ', 'สีขาว', 'สีเทา', 'สีน้ำเงิน', 'สีฟ้า', 
    'สีแดง', 'สีชมพู', 'สีส้ม', 'สีเขียว', 'สีน้ำตาล', 
    'สีม่วง', 'สีครีม', 'อื่นๆ (ระบุเอง)'
  ];

  const getColorCode = (colorName) => {
    const colorMap = {
      'สีดำ': '#000000', 'สีขาว': '#ffffff', 'สีเทา': '#9ca3af',
      'สีน้ำเงิน': '#1d4ed8', 'สีฟ้า': '#38bdf8', 'สีแดง': '#ef4444',
      'สีชมพู': '#ec4899', 'สีส้ม': '#f97316', 'สีเขียว': '#22c55e',
      'สีน้ำตาล': '#9a3412', 'สีม่วง': '#a855f7', 'สีครีม': '#fef3c7'
    };
    return colorMap[colorName] || null;
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_state', 'groups'), (docSnap) => {
      if (docSnap.exists()) {
        setGroups(docSnap.data().groups || []);
      } else {
        setGroups([]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveToDb = async (newGroups) => {
    try {
      await setDoc(doc(db, 'app_state', 'groups'), {
        groups: newGroups,
        updated_at: new Date().getTime()
      });
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingId(group.id);
      setFormData({ 
        ...group, 
        suitColor: group.suitColor || 'ยังไม่ระบุ / สีอิสระ' 
      });
    } else {
      setEditingId(null);
      setFormData({ type: 'GANG', name: '', logo: '', suitColor: 'ยังไม่ระบุ / สีอิสระ', updatedBy: '', updatedAt: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedGroups = [...groups];
    
    const now = new Date();
    const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear() + 543}`;
    const updatedBy = user?.displayName || user?.email || 'Admin';

    const groupData = {
      ...formData,
      updatedBy,
      updatedAt: formattedDate
    };
    
    if (editingId) {
      const idx = updatedGroups.findIndex(g => g.id === editingId);
      if (idx > -1) updatedGroups[idx] = { ...groupData, id: editingId };
    } else {
      updatedGroups.push({ ...groupData, id: 'g_' + Date.now() });
    }
    
    handleSaveToDb(updatedGroups);
    setIsModalOpen(false);
  };

  const triggerDelete = (id) => {
    setGroupToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (groupToDelete) {
      const updatedGroups = groups.filter(g => g.id !== groupToDelete);
      handleSaveToDb(updatedGroups);
      setShowConfirmDelete(false);
      setIsModalOpen(false);
    }
  };

  const filteredGroups = groups.filter(g => {
    if (filterType !== 'ALL' && g.type !== filterType) return false;
    if (searchTerm) {
      return g.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Buildings className="text-blue-500" />
            ระบบจัดการรายชื่อองค์กร
          </h1>
          <p className="text-slate-400 mt-1">จัดการฐานข้อมูลองค์กร และสถานะ Gang/Family ในเมือง</p>
        </div>
        
        <Button onClick={() => handleOpenModal()} className="sm:w-auto w-full">
          <Plus size={20} weight="bold" /> ลงทะเบียนใหม่
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input 
            className="pl-10" 
            placeholder="ค้นหาชื่อแก๊ง หรือ ชื่อหัวหน้า..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'GANG', 'FAMILY'].map(t => (
            <button
              key={t}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">ไม่พบข้อมูลที่ค้นหา</div>
        ) : (
          filteredGroups.map(g => {
            const suitHex = getColorCode(g.suitColor);
            
            return (
              <Card key={g.id} className="p-0 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm group hover:border-slate-600 transition-colors cursor-pointer" onClick={() => handleOpenModal(g)}>
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                      {g.logo ? (
                        <img src={g.logo} alt={g.name} className="w-10 h-10 object-contain" />
                      ) : (
                        g.type === 'FAMILY' ? <House size={28} className="text-blue-400" /> : <Shield size={28} className="text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-black text-white truncate">{g.name}</h3>
                      <div className="mt-1">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          g.type === 'FAMILY' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {g.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800 w-full mb-4"></div>

                  {/* Suit Color */}
                  <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <span className="text-xs font-bold text-slate-400 w-12">สีสูท:</span>
                    <div className="flex items-center gap-2">
                      {suitHex && (
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-600 shadow-sm" 
                          style={{ backgroundColor: suitHex }}
                        ></div>
                      )}
                      <span className="text-sm font-bold text-white">{g.suitColor || 'ยังไม่ระบุ / สีอิสระ'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {g.updatedBy && (
                  <div className="bg-slate-800/30 border-t border-slate-800 p-3 px-5 flex flex-col items-end">
                    <div className="text-[10px] font-medium text-slate-500">
                      เพิ่ม/แก้ไข: {g.updatedBy}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">
                      {g.updatedAt}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="bg-[#0B0F19] border border-[#1E293B] max-w-[460px] p-0 rounded-[28px] overflow-hidden"
        title={null}
        hideCloseButton={true}
      >
        <div className="p-7">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4">
              <div className="w-[52px] h-[52px] rounded-full border border-amber-500/40 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center justify-center text-amber-500 shrink-0">
                {editingId ? <PencilSimple size={24} weight="fill" /> : <Plus size={24} weight="bold" />}
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-xl font-bold text-white mb-0.5">
                  {editingId ? 'แก้ไขข้อมูลกลุ่ม' : 'เพิ่มข้อมูลกลุ่มใหม่'}
                </h2>
                <p className="text-[13px] text-slate-400">กรอกข้อมูลรายละเอียดองค์กรให้ครบถ้วน</p>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#131825] text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">หมวดหมู่องค์กร</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all ${
                    formData.type === 'GANG' 
                      ? 'bg-[#ef4444]/10 border border-[#ef4444]/50 text-[#ef4444]' 
                      : 'bg-[#131825] border border-transparent text-slate-400 hover:bg-[#1A2234]'
                  }`}
                  onClick={() => setFormData({...formData, type: 'GANG'})}
                >
                  <Shield size={18} weight="fill" /> 
                  <span className="text-[15px]">แก๊ง (Gang)</span>
                </button>
                <button
                  type="button"
                  className={`py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all ${
                    formData.type === 'FAMILY' 
                      ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/50 text-[#3b82f6]' 
                      : 'bg-[#131825] border border-transparent text-slate-400 hover:bg-[#1A2234]'
                  }`}
                  onClick={() => setFormData({...formData, type: 'FAMILY'})}
                >
                  <House size={18} weight="fill" /> 
                  <span className="text-[15px]">ครอบครัว (Family)</span>
                </button>
              </div>
            </div>

            {/* 2. Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">ชื่อกลุ่ม (NAME)</label>
              <input 
                type="text"
                placeholder={editingId ? "" : "เช่น PEAKY BLINDERS"}
                required 
                className="w-full bg-[#131825] border border-[#1E293B] rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-[15px] font-bold"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* 3. Logo */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400">ลิงก์รูปภาพโลโก้</label>
                <span className="text-[10px] font-medium text-slate-500 bg-[#1E293B] px-2 py-0.5 rounded">ตัวเลือกเสริม</span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 w-7 h-7 rounded-lg bg-[#1E293B]/80 flex items-center justify-center">
                  <Link size={14} weight="bold" className="text-slate-400" />
                </div>
                <input 
                  type="text"
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-[#131825] border border-[#1E293B] rounded-2xl pl-[52px] pr-4 py-3.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-[14px]"
                  value={formData.logo}
                  onChange={e => setFormData({...formData, logo: e.target.value})}
                />
              </div>
            </div>
            
            {/* 4. Suit Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">สีสูทประจำกลุ่ม</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 w-7 h-7 rounded-lg bg-[#1E293B]/80 flex items-center justify-center pointer-events-none">
                  <Palette size={14} weight="bold" className="text-slate-400" />
                </div>
                <select 
                  className="w-full bg-[#131825] border border-[#1E293B] rounded-2xl pl-[52px] pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 text-[15px] font-bold appearance-none cursor-pointer"
                  value={formData.suitColor}
                  onChange={e => setFormData({...formData, suitColor: e.target.value})}
                >
                  {SUIT_COLORS.map(color => (
                    <option key={color} value={color} className="bg-[#0B0F19] text-white font-bold">{color}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recorder Info */}
            <div className="mt-6 flex items-center justify-between bg-[#131825] border border-[#1E293B] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-[34px] h-[34px] rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle size={20} weight="fill" className="text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-400">บันทึกข้อมูลโดย</span>
                  <span className="text-[15px] font-bold text-white">
                    {user?.displayName || '001.NewGlaywind'}
                  </span>
                </div>
              </div>
              <div className="text-[11px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-md">
                Council Member
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3">
              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="w-[120px] py-4 bg-[#131825] hover:bg-[#1A2234] border border-transparent text-slate-300 hover:text-white rounded-2xl font-bold transition-all" onClick={() => setIsModalOpen(false)}>
                  ยกเลิก
                </Button>
                <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-[#F97316] to-[#F59E0B] hover:from-[#EA580C] hover:to-[#D97706] text-slate-950 rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/20">
                  บันทึกข้อมูลเข้าสู่ระบบ
                </button>
              </div>
            </div>
            
            {editingId && (
              <div className="mt-5 flex justify-center pb-1">
                <button 
                  type="button" 
                  onClick={() => triggerDelete(editingId)}
                  className="flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Trash size={16} />
                  <span>ลบกลุ่มนี้ออกจากระบบ</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </Modal>

      {/* Confirmation Delete Modal */}
      <Modal 
        isOpen={showConfirmDelete} 
        onClose={() => setShowConfirmDelete(false)}
        title="⚠️ ยืนยันการลบกลุ่ม"
      >
        <div className="space-y-6">
          <p className="text-slate-300">
            คุณต้องการ <strong className="text-red-400">ลบข้อมูลกลุ่มนี้ออกจากระบบ</strong> ใช่หรือไม่?
          </p>
          <p className="text-sm text-slate-400">
            การลบข้อมูลนี้จะไม่สามารถกู้คืนได้ และกลุ่มนี้จะไม่สามารถทำธุรกรรมใดๆ กับสภาได้อีก
          </p>
          
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDelete(false)}
              className="px-6"
            >
              ยกเลิก
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-500 text-white px-6 shadow-red-900/20 font-bold"
              onClick={confirmDelete}
            >
              ยืนยันการลบ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
