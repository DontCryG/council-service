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
        className="bg-slate-900 border-none max-w-md p-0 rounded-[32px] overflow-hidden"
        title={null}
        hideCloseButton={true}
      >
        <div className="bg-slate-900 text-white p-6 pb-8 h-full flex flex-col">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#EFA81F] flex items-center justify-center text-slate-900 shadow-lg">
                <Plus size={24} weight="bold" />
              </div>
              <h2 className="text-[22px] font-black text-white">เพิ่มข้อมูลกลุ่มใหม่</h2>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="p-2 rounded-full border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          
          <div className="h-px bg-slate-800 w-full mb-6"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Category */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">1. หมวดหมู่ (CATEGORY)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    formData.type === 'GANG' 
                      ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                  onClick={() => setFormData({...formData, type: 'GANG'})}
                >
                  <Shield size={18} weight="bold" /> แก๊ง (Gang)
                </button>
                <button
                  type="button"
                  className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    formData.type === 'FAMILY' 
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                  onClick={() => setFormData({...formData, type: 'FAMILY'})}
                >
                  <House size={18} weight="bold" /> ครอบครัว (Family)
                </button>
              </div>
            </div>

            {/* 2. Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">2. ชื่อกลุ่ม (NAME)</label>
              <input 
                type="text"
                placeholder="เช่น PEAKY BLINDERS"
                required 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* 3. Logo */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">3. ลิงก์รูปภาพโลโก้ (LOGO URL) *ไม่บังคับ</label>
              <div className="relative">
                <Link size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  placeholder="เช่น https://example.com/logo.png"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold text-sm"
                  value={formData.logo}
                  onChange={e => setFormData({...formData, logo: e.target.value})}
                />
              </div>
            </div>
            
            {/* 4. Suit Color */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">4. สีสูท (SUIT COLOR)</label>
              <div className="relative">
                <Palette size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select 
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 font-bold text-sm appearance-none cursor-pointer"
                  value={formData.suitColor}
                  onChange={e => setFormData({...formData, suitColor: e.target.value})}
                >
                  {SUIT_COLORS.map(color => (
                    <option key={color} value={color} className="bg-slate-800 text-white font-bold">{color}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recorder Info */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle size={24} weight="fill" className="text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-400">บันทึกข้อมูลโดย:</div>
                <div className="text-sm font-black text-white">
                  {user?.displayName || 'Admin'} <span className="text-slate-500 font-medium">(Council Member)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              <Button type="button" variant="ghost" className="col-span-1 py-3.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" className="col-span-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black shadow-lg">
                บันทึกข้อมูลเข้าสู่ระบบ
              </Button>
            </div>
            
            {editingId && (
              <div className="mt-6 flex justify-center">
                <button 
                  type="button" 
                  onClick={() => triggerDelete(editingId)}
                  className="text-[15px] font-black text-[#E04444] border-b-2 border-[#E04444] pb-0.5 hover:text-red-400 hover:border-red-400 transition-colors tracking-wide"
                >
                  ลบกลุ่มนี้ออกจากระบบ
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
