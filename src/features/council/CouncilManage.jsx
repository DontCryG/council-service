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
  const [formData, setFormData] = useState({ name: '', phone: '', username: '', password: '', role: 'staff', rank: 'สภาฝึกหัด' });
  const [showPasswordMap, setShowPasswordMap] = useState({});

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
      setFormData({ name: '', phone: '', username: '', password: '', role: 'staff', rank: 'สภาฝึกหัด' });
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

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Assuming user with email 'admin@...' or specific role is Admin. For now, everyone logged in has access.
  // We can refine this later.

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldStar className="text-blue-500" />
            ระบบจัดการรายชื่อสภา
          </h1>
          <p className="text-slate-400 mt-1">จัดการข้อมูลสมาชิกสภา รหัสผ่าน และสิทธิ์การใช้งาน</p>
        </div>
        
        {user?.role === 'admin' && (
          <Button onClick={() => handleOpenModal()} className="sm:w-auto w-full">
            <Plus size={20} weight="bold" /> เพิ่มสมาชิก
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
      ) : members.length === 0 ? (
        <div className="py-12 text-center text-slate-500">ยังไม่มีข้อมูลสมาชิก</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all group relative overflow-hidden">
              {/* Rank decorative background */}
              {m.role === 'admin' ? (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all pointer-events-none"></div>
              ) : (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
              )}

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                    m.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{m.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block mt-1 ${
                      m.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {m.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(m)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                      <PencilSimple size={16} />
                    </button>
                    <button onClick={() => triggerDelete(m.id)} className="p-2 text-red-400/70 hover:text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                      <Trash size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">ยศ (Rank)</span>
                  <span className="font-bold text-amber-500">{m.rank || 'สภาฝึกหัด'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">เบอร์โทร</span>
                  <span className="text-slate-300 font-mono">{m.phone || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="text-emerald-400 font-mono">{m.username}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-800">
                  <span className="text-slate-500">Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs">
                      {user?.role === 'admin' && showPasswordMap[m.id] ? m.password : '••••••••'}
                    </span>
                    {user?.role === 'admin' && (
                      <button onClick={() => togglePasswordVisibility(m.id)} className="text-slate-500 hover:text-white">
                        {showPasswordMap[m.id] ? <EyeClosed size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="USERNAME" 
            required 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
          <Input 
            label="เบอร์โทรศัพท์ (ในเกม)" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
          <Input 
            label="EMAIL (สำหรับล็อคอิน)" 
            required 
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
          <Input 
            label="Password (รหัสผ่าน)" 
            required 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">ยศประจำหน่วยงาน</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                value={formData.rank}
                onChange={e => setFormData({...formData, rank: e.target.value})}
              >
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">สิทธิ์การใช้งาน (Role)</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="staff">Staff (ทั่วไป)</option>
                <option value="admin">Admin (ผู้ดูแลระบบ)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit">
              บันทึกข้อมูล
            </Button>
          </div>
        </form>
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
            สมาชิกคนนี้จะไม่สามารถล็อคอินเข้าระบบได้อีกต่อไป
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
