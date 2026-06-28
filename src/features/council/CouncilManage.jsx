import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Plus, PencilSimple, Trash, Eye, EyeClosed, ShieldStar, Users } from '@phosphor-icons/react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

const RANKS = [
  'ประธานสภา',
  'รองประธานสภา',
  'เลขานุการสภา',
  'สภาอาวุโส',
  'สภาชำนาญการ',
  'สภาประจำการ',
  'สภาฝึกหัด'
];

export default function CouncilManage() {
  const { user, showAlert } = useAppStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', username: '', role: 'staff', rank: 'สภาฝึกหัด' });

  // Confirm Delete Modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_state', 'council_members'), (docSnap) => {
      if (docSnap.exists()) {
        setMembers(docSnap.data().members || []);
      } else {
        setMembers([]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveToDb = async (newMembers) => {
    try {
      await setDoc(doc(db, 'app_state', 'council_members'), {
        members: newMembers,
        updated_at: new Date().getTime()
      });
    } catch (e) {
      console.error(e);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingId(member.id);
      setFormData({ ...member, rank: member.rank || 'สภาฝึกหัด' });
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '', username: '', role: 'staff', rank: 'สภาฝึกหัด' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedMembers = [...members];
    
    if (editingId) {
      const idx = updatedMembers.findIndex(m => m.id === editingId);
      if (idx > -1) updatedMembers[idx] = { ...formData, id: editingId };
    } else {
      updatedMembers.push({ ...formData, id: 'cm_' + Date.now() });
    }
    
    handleSaveToDb(updatedMembers);
    setIsModalOpen(false);
  };

  const triggerDelete = (id) => {
    setMemberToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      const updatedMembers = members.filter(m => m.id !== memberToDelete);
      handleSaveToDb(updatedMembers);
      setShowConfirmDelete(false);
      showAlert('success', 'ลบข้อมูลสมาชิกเรียบร้อยแล้ว');
    }
  };


  // Assuming user with email 'admin@...' or specific role is Admin. For now, everyone logged in has access.
  // We can refine this later.

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
      
      {/* Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 border border-slate-700/50 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
            <ShieldStar size={32} weight="duotone" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              ระบบจัดการรายชื่อสภา
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">จัดการข้อมูลสมาชิกสภา รหัสผ่าน และสิทธิ์การใช้งาน</p>
          </div>
        </div>
        
        {user?.role === 'admin' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="group relative h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 overflow-hidden w-full sm:w-auto"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={20} weight="bold" className="relative z-10" /> 
            <span className="relative z-10">เพิ่มสมาชิกสภา</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
           <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
           <p className="mt-4 text-slate-400 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-slate-900/40 border-2 border-dashed border-slate-700/50 rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center">
          <Users size={48} className="text-slate-600 mb-3" />
          <p className="font-medium text-lg">ยังไม่มีข้อมูลสมาชิกสภาในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {members.map((m) => {
            const isAdmin = m.role === 'admin';
            return (
              <div key={m.id} className="group relative bg-slate-900/50 border border-slate-700/50 rounded-3xl p-6 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1 backdrop-blur-md">
                
                {/* Glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${isAdmin ? 'from-red-500/0 to-red-500/0 group-hover:to-red-500/5' : 'from-blue-500/0 to-blue-500/0 group-hover:to-blue-500/5'} transition-all duration-500 pointer-events-none`}></div>
                
                {/* Top decorative line */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isAdmin ? 'via-red-500' : 'via-blue-500'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                {/* Rank decorative background */}
                {isAdmin ? (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all pointer-events-none"></div>
                ) : (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
                )}

                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner relative overflow-hidden ${
                      isAdmin ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                      <span className="drop-shadow-sm relative z-10">{m.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white drop-shadow-sm">{m.name}</h3>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm mt-1.5 w-fit ${
                        isAdmin ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {isAdmin ? 'Admin' : 'Staff'}
                      </span>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(m)} className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/80 bg-slate-800/80 border border-slate-700 rounded-xl transition-all shadow-sm">
                        <PencilSimple size={16} weight="bold" />
                      </button>
                      <button onClick={() => triggerDelete(m.id)} className="p-2.5 text-red-400/80 hover:text-white hover:bg-red-500 bg-red-500/10 border border-red-500/20 rounded-xl transition-all shadow-sm">
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 relative z-10 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">ยศ (Rank)</span>
                    <span className="font-bold text-amber-500 text-sm">{m.rank || 'สภาฝึกหัด'}</span>
                  </div>
                  <div className="h-px w-full bg-slate-800/60"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">เบอร์โทร</span>
                    <span className="text-slate-300 font-bold text-sm">{m.phone || '-'}</span>
                  </div>
                  <div className="h-px w-full bg-slate-800/60"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">Email</span>
                    <span className="text-emerald-400 font-bold text-sm">{m.username}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="bg-slate-950/80 backdrop-blur-3xl border border-slate-700/50 shadow-2xl p-0 overflow-hidden max-w-xl w-full"
        title={null}
        hideCloseButton={true}
      >
        <div className="relative p-8 md:p-10 flex flex-col bg-slate-900/40 w-full h-full">
          {/* Background decorative glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${formData.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}></div>

          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10 shadow-inner"
          >
            <Trash size={14} weight="bold" className="hidden" /> {/* just to fix icon import if unused */}
            <span className="font-bold text-sm">✕</span>
          </button>

          <div className="mb-8 relative z-10">
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              {editingId ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
            </h2>
            <p className="text-sm text-slate-400 mt-2">Manage the identity and access level of the council member.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 relative z-10">
            
            <div className="space-y-3 group/input">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                <input 
                  type="text"
                  placeholder="Enter full name"
                  required 
                  className="w-full relative bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 font-black text-sm transition-all shadow-inner"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3 group/input">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                <input 
                  type="text"
                  placeholder="In-game phone number"
                  className="w-full relative bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 font-bold text-sm transition-all shadow-inner font-mono"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3 group/input">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email (Login ID)</label>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                <input 
                  type="email"
                  placeholder="admin@council.com"
                  required 
                  className="w-full relative bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 font-bold text-sm transition-all shadow-inner font-mono text-emerald-400"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3 group/input">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rank</label>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                  <select 
                    className="w-full relative bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-amber-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 font-bold text-sm appearance-none cursor-pointer transition-all shadow-inner"
                    value={formData.rank}
                    onChange={e => setFormData({...formData, rank: e.target.value})}
                  >
                    {RANKS.map(r => <option key={r} value={r} className="bg-slate-900 text-white font-medium">{r}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-3 group/input">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Access Role</label>
                <div className="relative">
                  <div className={`absolute inset-0 blur-md opacity-0 group-focus-within/input:opacity-100 rounded-xl transition-opacity pointer-events-none ${formData.role === 'admin' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}></div>
                  <select 
                    className={`w-full relative bg-slate-950/80 border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 font-bold text-sm appearance-none cursor-pointer transition-all shadow-inner ${
                      formData.role === 'admin' ? 'text-red-400 border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20' : 'text-blue-400 border-blue-500/50 focus:border-blue-500/80 focus:ring-blue-500/20'
                    }`}
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="staff" className="bg-slate-900 text-blue-400 font-bold">Staff (ทั่วไป)</option>
                    <option value="admin" className="bg-slate-900 text-red-400 font-bold">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-800/80">
              <Button type="button" variant="ghost" className="px-6 py-3.5 bg-slate-800 hover:bg-[#232d45] border-none text-white rounded-xl font-bold transition-all" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <button type="submit" className="px-8 py-3.5 bg-white hover:bg-slate-200 text-black rounded-xl font-black transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="⚠️ ยืนยันการลบสมาชิก"
      >
        <div className="space-y-6">
          <p className="text-slate-300">
            คุณต้องการ <strong className="text-red-400">ลบสมาชิกคนนี้</strong> ออกจากระบบใช่หรือไม่?
          </p>
          <p className="text-sm text-slate-400">
            *คุณจำเป็นต้องลบสมาชิกใน Firebase Authentication ด้วยตนเอง
          </p>
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfirmDelete(false)} className="px-6">
              ยกเลิก
            </Button>
            <Button className="bg-red-600 hover:bg-red-500 text-white px-6" onClick={confirmDelete}>
              ยืนยันการลบ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
