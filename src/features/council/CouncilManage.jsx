import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc, collection, getDocs } from 'firebase/firestore';
import { Plus, PencilSimple, Trash, Eye, EyeClosed, ShieldStar, Users, DownloadSimple } from '@phosphor-icons/react';

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

  // Backup System State
  const [isBackingUp, setIsBackingUp] = useState(false);

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

  const handleBackup = async () => {
    setIsBackingUp(true);
    showAlert('info', 'กำลังดึงข้อมูลทั้งหมดจาก Database กรุณารอสักครู่...');
    try {
      const collectionsToBackup = [
        'app_state',
        'transaction_logs',
        'transactionImages',
        'loan_contracts',
        'transactions'
      ];
      const backupData = {};
      
      for (const colName of collectionsToBackup) {
        const querySnapshot = await getDocs(collection(db, colName));
        backupData[colName] = {};
        querySnapshot.forEach((doc) => {
          backupData[colName][doc.id] = doc.data();
        });
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `council_service_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showAlert('success', 'ดาวน์โหลดข้อมูล Backup สำเร็จ!');
    } catch (error) {
      console.error('Backup failed:', error);
      showAlert('error', 'เกิดข้อผิดพลาดในการ Backup ข้อมูล: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
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
          <div className="flex gap-3 w-full sm:w-auto">
            <Button onClick={handleBackup} disabled={isBackingUp} className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">
              <DownloadSimple size={20} weight="bold" className={isBackingUp ? "animate-bounce" : ""} /> 
              {isBackingUp ? 'กำลังดึงข้อมูล...' : 'Backup Database'}
            </Button>
            <Button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none">
              <Plus size={20} weight="bold" /> เพิ่มสมาชิก
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden p-0 border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">USERNAME</th>
                <th className="px-6 py-4 font-semibold">เบอร์โทรศัพท์</th>
                <th className="px-6 py-4 font-semibold">EMAIL</th>
                <th className="px-6 py-4 font-semibold">Password</th>
                <th className="px-6 py-4 font-semibold">ยศ (Rank)</th>
                <th className="px-6 py-4 font-semibold">ตำแหน่ง</th>
                {user?.role === 'admin' && <th className="px-6 py-4 font-semibold text-right">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-8 text-center">กำลังโหลดข้อมูล...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-slate-500">ยังไม่มีข้อมูลสมาชิก</td></tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{m.name}</td>
                    <td className="px-6 py-4 text-slate-400">{m.phone || '-'}</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">{m.username}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                          {user?.role === 'admin' && showPasswordMap[m.id] ? m.password : '••••••••'}
                        </span>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => togglePasswordVisibility(m.id)}
                            className="text-slate-500 hover:text-white transition-colors"
                          >
                            {showPasswordMap[m.id] ? <EyeClosed size={18} /> : <Eye size={18} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-500 text-sm">
                      {m.rank || 'สภาฝึกหัด'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${m.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {m.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenModal(m)}>
                            <PencilSimple size={16} />
                          </Button>
                          <Button variant="danger" size="icon" onClick={() => triggerDelete(m.id)}>
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
