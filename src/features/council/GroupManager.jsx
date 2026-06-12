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
        className="bg-transparent border-none max-w-4xl p-0 rounded-none overflow-hidden shadow-none"
        title={null}
        hideCloseButton={true}
      >
        <div className="flex flex-col md:flex-row w-full bg-[#0a0d14] rounded-[32px] overflow-hidden border border-slate-800/60 shadow-2xl h-full max-h-[90vh]">
          
          {/* Left Panel - Live Preview */}
          <div className="w-full md:w-5/12 relative p-8 flex flex-col items-center justify-center min-h-[300px] border-b md:border-b-0 md:border-r border-slate-800/60 overflow-hidden">
            {/* Dynamic Background */}
            <div className={`absolute inset-0 opacity-20 transition-colors duration-700 ${
              formData.type === 'GANG' ? 'bg-gradient-to-br from-red-600 to-transparent' : 'bg-gradient-to-br from-blue-600 to-transparent'
            }`} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/0 via-[#0a0d14]/80 to-[#0a0d14]" />
            
            <div className="relative z-10 w-full max-w-[260px] flex flex-col items-center">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                Live Preview
              </div>

              {/* ID Card Preview */}
              <div className="w-full aspect-[3/4] rounded-3xl bg-slate-900/50 backdrop-blur-md border border-slate-700/50 flex flex-col items-center p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 transition-colors duration-500"
                  style={{ backgroundColor: getColorCode(formData.suitColor) || (formData.type === 'GANG' ? '#ef4444' : '#3b82f6') }}
                />

                <div className="mt-4 mb-6 w-24 h-24 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center p-2 shadow-inner">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" onError={(e) => { e.target.style.display='none' }} />
                  ) : (
                    formData.type === 'FAMILY' 
                      ? <House size={48} weight="duotone" className="text-blue-400 opacity-50" /> 
                      : <Shield size={48} weight="duotone" className="text-red-400 opacity-50" />
                  )}
                </div>

                <h3 className="text-xl font-black text-white text-center break-words w-full leading-tight mb-2">
                  {formData.name || 'Organization Name'}
                </h3>

                <div className={`px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase mb-auto ${
                  formData.type === 'FAMILY' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {formData.type}
                </div>

                <div className="w-full pt-4 mt-4 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Suit Color</span>
                  <div className="flex items-center gap-1.5">
                    {getColorCode(formData.suitColor) && (
                      <div className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: getColorCode(formData.suitColor) }}></div>
                    )}
                    <span className="text-xs font-bold text-slate-300">
                      {formData.suitColor || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Watermark */}
            <div className="absolute bottom-4 text-[10px] font-bold text-slate-700/50 tracking-[0.3em] uppercase pointer-events-none">
              Council Database
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col relative overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
            >
              <X size={14} weight="bold" />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-white tracking-tight">
                {editingId ? 'Edit Organization' : 'Create Organization'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">Configure the identity and properties of the group.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1">
                
                {/* 1. Category Selection - Modern Cards */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Classification</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`relative p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border-2 ${
                        formData.type === 'GANG' 
                          ? 'bg-red-500/5 border-red-500/50 shadow-[0_4px_20px_-5px_rgba(239,68,68,0.15)]' 
                          : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                      onClick={() => setFormData({...formData, type: 'GANG'})}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        formData.type === 'GANG' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Shield size={24} weight="fill" />
                      </div>
                      <span className={`text-sm font-bold ${formData.type === 'GANG' ? 'text-white' : 'text-slate-400'}`}>GANG</span>
                    </button>

                    <button
                      type="button"
                      className={`relative p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border-2 ${
                        formData.type === 'FAMILY' 
                          ? 'bg-blue-500/5 border-blue-500/50 shadow-[0_4px_20px_-5px_rgba(59,130,246,0.15)]' 
                          : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                      onClick={() => setFormData({...formData, type: 'FAMILY'})}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        formData.type === 'FAMILY' ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <House size={24} weight="fill" />
                      </div>
                      <span className={`text-sm font-bold ${formData.type === 'FAMILY' ? 'text-white' : 'text-slate-400'}`}>FAMILY</span>
                    </button>
                  </div>
                </div>

                {/* 2. Group Name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Display Name</label>
                  <input 
                    type="text"
                    placeholder="Enter organization name"
                    required 
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-white/20 focus:bg-slate-800/50 font-medium transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                {/* 3. Logo URL */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Brand Logo URL</label>
                    <span className="text-[10px] font-bold text-slate-600">OPTIONAL</span>
                  </div>
                  <div className="relative">
                    <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text"
                      placeholder="https://.../logo.png"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-white/20 focus:bg-slate-800/50 font-medium text-sm transition-all"
                      value={formData.logo}
                      onChange={e => setFormData({...formData, logo: e.target.value})}
                    />
                  </div>
                </div>

                {/* 4. Suit Color */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Official Suit Color</label>
                  <div className="relative">
                    <Palette size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <select 
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-white/20 focus:bg-slate-800/50 font-medium text-sm appearance-none cursor-pointer transition-all"
                      value={formData.suitColor}
                      onChange={e => setFormData({...formData, suitColor: e.target.value})}
                    >
                      {SUIT_COLORS.map(color => (
                        <option key={color} value={color} className="bg-slate-900 text-white font-medium">{color}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col gap-4">
                <div className="flex items-center justify-between w-full">
                  
                  {editingId ? (
                    <button 
                      type="button" 
                      onClick={() => triggerDelete(editingId)}
                      className="flex items-center gap-2 text-sm font-bold text-red-500/80 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-3 rounded-xl transition-all"
                    >
                      <Trash size={18} />
                      <span className="hidden sm:inline">Delete Org</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span>{user?.displayName || 'Admin'}</span>
                    </div>
                  )}

                  <div className="flex gap-3 ml-auto">
                    <Button type="button" variant="ghost" className="px-6 py-3.5 bg-slate-800/40 hover:bg-slate-800 border-none text-slate-300 hover:text-white rounded-xl font-bold transition-all" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <button type="submit" className="px-8 py-3.5 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-black transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                      {editingId ? 'Save Changes' : 'Register Org'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
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
