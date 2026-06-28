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
  const { user, showAlert } = useAppStore();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [customSuitColor, setCustomSuitColor] = useState('');
  
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
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingId(group.id);
      let suitC = group.suitColor || 'ยังไม่ระบุ / สีอิสระ';
      let customC = '';
      if (!SUIT_COLORS.includes(suitC)) {
        customC = suitC;
        suitC = 'อื่นๆ (ระบุเอง)';
      }
      setFormData({ 
        ...group, 
        suitColor: suitC 
      });
      setCustomSuitColor(customC);
    } else {
      setEditingId(null);
      setFormData({ type: 'GANG', name: '', logo: '', suitColor: 'ยังไม่ระบุ / สีอิสระ', updatedBy: '', updatedAt: '' });
      setCustomSuitColor('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedGroups = [...groups];
    
    const now = new Date();
    const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear() + 543}`;
    const updatedBy = user?.displayName || user?.email || 'Admin';

    let finalSuitColor = formData.suitColor;
    if (finalSuitColor === 'อื่นๆ (ระบุเอง)') {
      finalSuitColor = customSuitColor || 'อื่นๆ (ระบุเอง)';
    }

    const groupData = {
      ...formData,
      suitColor: finalSuitColor,
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
    showAlert('success', 'บันทึกข้อมูลองค์กรเรียบร้อยแล้ว');
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
      showAlert('success', 'ลบข้อมูลองค์กรเรียบร้อยแล้ว');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
      
      {/* Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 border border-slate-700/50 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
            <Buildings size={32} weight="duotone" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              ระบบจัดการรายชื่อองค์กร
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">จัดการฐานข้อมูลองค์กร และสถานะ GANG/FAMILY ในเมือง</p>
          </div>
        </div>
        
        <button 
          onClick={() => handleOpenModal()} 
          className="group relative h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 overflow-hidden w-full sm:w-auto"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <Plus size={20} weight="bold" className="relative z-10" /> 
          <span className="relative z-10">ลงทะเบียนองค์กรใหม่</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-2">
        <div className="bg-slate-900/40 border border-slate-700/50 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-white/10 transition-colors"></div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">องค์กรทั้งหมด</span>
          <span className="text-4xl font-black text-white relative z-10 drop-shadow-md">{groups.length}</span>
        </div>
        <div className="bg-amber-900/20 border border-amber-500/30 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors"></div>
          <span className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 relative z-10">GANG</span>
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-600 relative z-10 drop-shadow-sm">{groups.filter(g => g.type === 'GANG').length}</span>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
          <span className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2 relative z-10">FAMILY</span>
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 relative z-10 drop-shadow-sm">{groups.filter(g => g.type === 'FAMILY').length}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 relative z-10">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
          <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
          <input 
            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner backdrop-blur-sm" 
            placeholder="ค้นหาชื่อแก๊ง หรือ ชื่อหัวหน้า..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-inner">
          {['ALL', 'GANG', 'FAMILY'].map(t => (
            <button
              key={t}
              className={`px-6 py-2.5 rounded-xl font-black text-xs tracking-widest transition-all ${
                filterType === t 
                ? (t === 'GANG' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : t === 'FAMILY' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-slate-200 text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)]')
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center">
             <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-400 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/40 border-2 border-dashed border-slate-700/50 rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center">
            <MagnifyingGlass size={48} className="text-slate-600 mb-3" />
            <p className="font-medium text-lg">ไม่พบข้อมูลองค์กรที่ค้นหา</p>
          </div>
        ) : (
          filteredGroups.map(g => {
            const suitHex = getColorCode(g.suitColor);
            const isGang = g.type === 'GANG';
            
            return (
              <div 
                key={g.id} 
                className="group relative bg-slate-900/50 border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-md" 
                onClick={() => handleOpenModal(g)}
              >
                {/* Glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${isGang ? 'from-amber-500/0 to-amber-500/0 group-hover:to-amber-500/5' : 'from-blue-500/0 to-blue-500/0 group-hover:to-blue-500/5'} transition-all duration-500 pointer-events-none`}></div>
                
                {/* Top decorative line */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isGang ? 'via-amber-500' : 'via-blue-500'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <div className="p-6 relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                      {g.logo ? (
                        <img src={g.logo} alt={g.name} className="w-12 h-12 object-contain drop-shadow-md" />
                      ) : (
                        isGang ? <Shield size={32} weight="duotone" className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> : <House size={32} weight="duotone" className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black text-white truncate drop-shadow-sm">{g.name}</h3>
                      <div className="mt-2 flex">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm ${
                          isGang ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {isGang ? <Shield size={12} weight="fill" /> : <House size={12} weight="fill" />} {g.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suit Color */}
                  <div className="flex items-center justify-between bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 shadow-inner group-hover:border-slate-700/80 transition-colors">
                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">สีสูทประจำแก๊ง</span>
                    <div className="flex items-center gap-2.5">
                      {suitHex && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-sm"></div>
                          <div 
                            className="w-5 h-5 rounded-full border-2 border-slate-600 shadow-md relative z-10" 
                            style={{ backgroundColor: suitHex }}
                          ></div>
                        </div>
                      )}
                      <span className="text-[13px] font-bold text-white">{g.suitColor || 'ยังไม่ระบุ / สีอิสระ'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {g.updatedBy && (
                  <div className="bg-slate-950/40 border-t border-slate-800/50 p-3 px-6 flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">อัปเดตล่าสุด</span>
                      <span className="text-[11px] font-bold text-slate-400">{g.updatedAt}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">โดย</span>
                      <span className="text-[11px] font-bold text-slate-400">{g.updatedBy}</span>
                    </div>
                  </div>
                )}
              </div>
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
        <div className="flex flex-col md:flex-row w-full bg-slate-950/80 backdrop-blur-3xl rounded-[32px] overflow-hidden border border-slate-700/50 shadow-2xl h-full max-h-[90vh]">
          
          {/* Left Panel - Live Preview */}
          <div className="w-full md:w-5/12 relative p-8 flex flex-col items-center justify-center min-h-[300px] border-b md:border-b-0 md:border-r border-slate-700/50 overflow-hidden bg-slate-900/40">
            
            {/* Background decorative glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${formData.type === 'GANG' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

            <div className="relative z-10 w-full max-w-[240px] flex flex-col items-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Preview
              </div>

              {/* ID Card Preview */}
              <div className="w-full rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 flex flex-col items-center p-6 shadow-2xl relative overflow-hidden group">
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

                <div className="absolute top-0 left-0 w-full h-1.5 transition-colors duration-500"
                  style={{ backgroundColor: getColorCode(formData.suitColor === 'อื่นๆ (ระบุเอง)' ? customSuitColor : formData.suitColor) || (formData.type === 'GANG' ? '#f59e0b' : '#3b82f6') }}
                />

                <div className="mt-4 mb-6 w-24 h-24 rounded-2xl bg-slate-950/80 border border-slate-700/50 flex items-center justify-center p-3 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-md relative z-10" onError={(e) => { e.target.style.display='none' }} />
                  ) : (
                    formData.type === 'FAMILY' 
                      ? <House size={42} weight="duotone" className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] relative z-10" /> 
                      : <Shield size={42} weight="duotone" className="text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] relative z-10" />
                  )}
                </div>

                <h3 className="text-2xl font-black text-white text-center break-words w-full leading-tight mb-3 drop-shadow-sm">
                  {formData.name || 'Organization'}
                </h3>

                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-10 shadow-sm ${
                  formData.type === 'FAMILY' ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30' : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                }`}>
                  {formData.type}
                </div>

                <div className="w-full pt-4 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Suit Color</span>
                  <div className="flex items-center gap-2">
                    {getColorCode(formData.suitColor === 'อื่นๆ (ระบุเอง)' ? customSuitColor : formData.suitColor) && (
                      <div className="w-2.5 h-2.5 rounded-full border border-slate-500 shadow-sm" style={{ backgroundColor: getColorCode(formData.suitColor === 'อื่นๆ (ระบุเอง)' ? customSuitColor : formData.suitColor) }}></div>
                    )}
                    <span className="text-[11px] font-bold text-slate-300">
                      {formData.suitColor === 'อื่นๆ (ระบุเอง)' ? (customSuitColor || 'ระบุสี...') : (formData.suitColor || '-')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Watermark */}
            <div className="absolute bottom-6 text-[9px] font-black text-slate-600/40 tracking-[0.25em] uppercase pointer-events-none">
              Council Database
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col relative overflow-y-auto bg-slate-900/40">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10 shadow-inner"
            >
              <X size={14} weight="bold" />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-white tracking-tight">
                {editingId ? 'แก้ไขข้อมูลองค์กร' : 'ลงทะเบียนองค์กรใหม่'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">Configure the identity and properties of the group.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1 relative z-10">
                
                {/* 1. Category Selection - Modern Cards */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Classification</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`relative py-5 px-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border overflow-hidden ${
                        formData.type === 'GANG' 
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                          : 'bg-slate-950/60 border-slate-700/50 hover:bg-slate-900/80'
                      }`}
                      onClick={() => setFormData({...formData, type: 'GANG'})}
                    >
                      {formData.type === 'GANG' && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-inner ${
                        formData.type === 'GANG' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-slate-800/80 text-slate-500 border border-slate-700'
                      }`}>
                        <Shield size={24} weight="duotone" />
                      </div>
                      <span className={`text-[12px] font-black tracking-widest relative z-10 ${formData.type === 'GANG' ? 'text-white' : 'text-slate-400'}`}>GANG</span>
                    </button>

                    <button
                      type="button"
                      className={`relative py-5 px-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border overflow-hidden ${
                        formData.type === 'FAMILY' 
                          ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                          : 'bg-slate-950/60 border-slate-700/50 hover:bg-slate-900/80'
                      }`}
                      onClick={() => setFormData({...formData, type: 'FAMILY'})}
                    >
                      {formData.type === 'FAMILY' && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-inner ${
                        formData.type === 'FAMILY' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/20' : 'bg-slate-800/80 text-slate-500 border border-slate-700'
                      }`}>
                        <House size={24} weight="duotone" />
                      </div>
                      <span className={`text-[12px] font-black tracking-widest relative z-10 ${formData.type === 'FAMILY' ? 'text-white' : 'text-slate-400'}`}>FAMILY</span>
                    </button>
                  </div>
                </div>

                {/* 2. Group Name */}
                <div className="space-y-3 group/input">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                    <input 
                      type="text"
                      placeholder="Enter organization name"
                      required 
                      className="w-full relative bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 font-black text-sm transition-all shadow-inner"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                {/* 3. Logo URL */}
                <div className="space-y-3 group/input">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Brand Logo URL</label>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">OPTIONAL</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                    <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                    <input 
                      type="text"
                      placeholder="https://.../logo.png"
                      className="w-full relative bg-slate-950/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 font-medium text-sm transition-all shadow-inner"
                      value={formData.logo}
                      onChange={e => setFormData({...formData, logo: e.target.value})}
                    />
                  </div>
                </div>

                {/* 4. Suit Color */}
                <div className="space-y-3 group/input">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Official Suit Color</label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                    <Palette size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
                    <select 
                      className={`w-full relative bg-slate-950/80 border ${formData.suitColor === 'อื่นๆ (ระบุเอง)' ? 'border-amber-500/50 focus:border-amber-500/80' : 'border-slate-700/80 focus:border-blue-500/80'} rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm appearance-none cursor-pointer transition-all shadow-inner`}
                      value={formData.suitColor}
                      onChange={e => {
                        setFormData({...formData, suitColor: e.target.value});
                        if (e.target.value !== 'อื่นๆ (ระบุเอง)') setCustomSuitColor('');
                      }}
                    >
                      {SUIT_COLORS.map(color => (
                        <option key={color} value={color} className="bg-slate-900 text-white font-medium">{color}</option>
                      ))}
                    </select>
                  </div>
                  {formData.suitColor === 'อื่นๆ (ระบุเอง)' && (
                    <div className="relative pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="absolute inset-0 top-2 bg-amber-500/20 blur-md opacity-0 focus-within:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                      <input 
                        type="text"
                        placeholder="โปรดระบุชื่อสีที่ต้องการ..."
                        required 
                        className="w-full relative bg-slate-950/80 border border-amber-500/50 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 font-bold text-sm transition-all shadow-inner"
                        value={customSuitColor}
                        onChange={e => setCustomSuitColor(e.target.value)}
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Footer Actions */}
              <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between">
                
                {editingId ? (
                  <button 
                    type="button" 
                    onClick={() => triggerDelete(editingId)}
                    className="flex items-center gap-3 bg-[#2A1115] hover:bg-[#3d181e] text-[#ef4444] px-4 py-2.5 rounded-xl transition-all border border-[#451a1a]"
                  >
                    <Trash size={20} weight="fill" />
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-[11px] font-black">Delete</span>
                      <span className="text-[11px] font-black">Org</span>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>{user?.displayName || 'Admin'}</span>
                  </div>
                )}

                <div className="flex gap-3 ml-auto">
                  <Button type="button" variant="ghost" className="px-6 py-3.5 bg-slate-800 hover:bg-[#232d45] border-none text-white rounded-xl font-bold transition-all" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <button type="submit" className="px-8 py-3.5 bg-white hover:bg-slate-200 text-black rounded-xl font-black transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]">
                    {editingId ? 'Save Changes' : 'Register Org'}
                  </button>
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
