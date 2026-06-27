import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { CalendarCheck, Plus, PencilSimple, Trash, MapPin, Sword, CaretLeft, CaretRight, Folder, Clock, Coins, Heartbeat, NotePencil, UserCircle, Files, Star } from '@phosphor-icons/react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

export default function StoryCalendar() {
  const { user, showAlert } = useAppStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('DAY_VIEW'); // 'DAY_VIEW' | 'EVENT_FORM'
  const [selectedDateForView, setSelectedDateForView] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
  const [realTime, setRealTime] = useState(new Date());

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: '', time: '', team1: '', team2: '', type: 'Gang', location: '', fights: '', radio: '', bet: '', medic: '', style: '', score: '', description: '', staff: '', note: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setRealTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_state', 'stories'), (docSnap) => {
      if (docSnap.exists()) {
        setEvents(docSnap.data().events || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveEventsToDb = async (newEvents) => {
    try {
      await setDoc(doc(db, 'app_state', 'stories'), {
        events: newEvents,
        updated_at: new Date().getTime()
      });
    } catch (e) {
      console.error(e);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDayClick = (dateStr) => {
    setSelectedDateForView(dateStr);
    setModalView('DAY_VIEW');
    setIsModalOpen(true);
  };

  const handleOpenForm = (evt = null, dateStr = null) => {
    if (evt) {
      setEditingId(evt.id);
      setFormData({ ...evt });
    } else {
      setEditingId(null);
      const d = new Date();
      const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setFormData({ 
        date: dateStr || selectedDateForView || localToday, 
        time: '', team1: '', team2: '', type: '', location: '', fights: '', radio: '', bet: '', medic: '', style: '', score: '', description: '', staff: user?.customName || user?.displayName || user?.email?.split('@')[0] || '', note: '' 
      });
    }
    setModalView('EVENT_FORM');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedEvents = [...events];
    
    if (editingId) {
      const idx = updatedEvents.findIndex(ev => ev.id === editingId);
      if (idx > -1) updatedEvents[idx] = { ...formData, id: editingId };
    } else {
      updatedEvents.push({ ...formData, id: 'ev_' + Date.now() });
    }
    
    saveEventsToDb(updatedEvents);
    setIsModalOpen(false);
  };

  const triggerDelete = (id) => {
    setEventToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      const updatedEvents = events.filter(ev => ev.id !== eventToDelete);
      saveEventsToDb(updatedEvents);
      setShowConfirmDelete(false);
      setIsModalOpen(false);
      showAlert('success', 'ลบกิจกรรมเรียบร้อยแล้ว');
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    return `${days[date.getDay()]}ที่ ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const upcomingEvents = events
      .filter(e => {
        if (e.date < todayStr) return false;
        if (e.date === todayStr && (e.time || '00:00') < currentTimeStr) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date === b.date) {
          return (a.time || '00:00').localeCompare(b.time || '00:00');
        }
        return a.date.localeCompare(b.date);
      })
      .slice(0, 5); // Show next 5 events

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarCheck className="text-amber-500" />
              STORY CALENDAR
            </h1>
            <p className="text-slate-400 mt-1">ปฏิทินเดินสตอรี่และวอร์ประจำเดือน</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-700/50 shadow-inner">
              <Clock size={20} weight="bold" className="text-amber-500" />
              <span className="text-white font-black text-xl tracking-wider font-mono">
                {realTime.toLocaleTimeString('en-GB')}
              </span>
              <span className="text-slate-400 font-bold text-sm">BKK</span>
            </div>
            {user && (
              <Button onClick={() => handleOpenForm(null)} className="w-full sm:w-auto">
                <Plus size={20} weight="bold" /> เพิ่มกิจกรรม (Admin)
              </Button>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <Card className="p-0 overflow-hidden lg:col-span-3 border-slate-800 bg-slate-900/50">
        {/* Calendar Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}><CaretLeft size={24} /></Button>
          <h2 className="text-xl font-bold text-white">
            {monthNames[month]} <span className="text-amber-500">{year}</span>
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}><CaretRight size={24} /></Button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 bg-slate-900/30">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
              <div key={i} className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 rounded-lg">
                {d}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-28 rounded-2xl bg-slate-800/10 border border-slate-800/30 border-dashed"></div>;
              
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = todayStr === dateStr;

              return (
                <div 
                  key={day} 
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-28 p-2 rounded-2xl overflow-y-auto custom-scrollbar relative transition-all cursor-pointer border group flex flex-col ${isToday ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:bg-amber-500/20' : 'bg-slate-900/80 border-slate-800/50 hover:border-amber-500/30 hover:bg-slate-800/80 hover:-translate-y-0.5 hover:shadow-lg'}`}
                >
                  <div className="flex justify-between items-start mb-1 shrink-0">
                    <div className={`text-xs font-black flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-amber-500 text-slate-900' : 'text-slate-400 group-hover:text-white'}`}>
                      {day}
                    </div>
                    {/* Visual indicator that it's clickable (for admins) */}
                    {user && (
                      <div className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500/10 p-1 rounded-md">
                        <Plus size={10} weight="bold" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 mt-1">
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        className={`text-[10px] p-1.5 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] flex flex-col gap-1 ${
                          evt.type?.includes('Gang') ? 'bg-red-500/10 text-red-200 border border-red-500/20' : 'bg-blue-500/10 text-blue-200 border border-blue-500/20'
                        }`}
                      >
                        <div className="font-bold truncate leading-tight">{evt.team1} <span className="opacity-50 mx-0.5">v</span> {evt.team2}</div>
                        <div className="flex justify-between items-center opacity-70 text-[9px] font-mono">
                          <span>{evt.time}</span>
                          {evt.type?.includes('Gang') ? <Sword size={10} /> : <MapPin size={10} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Upcoming Stories Sidebar */}
      <Card className="p-5 bg-slate-900/50 border border-slate-800 lg:col-span-1 h-fit shadow-sm">
        <h3 className="text-[17px] font-black text-white flex items-center gap-2.5 mb-5 tracking-tight">
          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-full">
            <Clock size={16} weight="fill" />
          </div>
          Upcoming Stories
        </h3>
        
        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm font-medium">ไม่มีกิจกรรมที่กำลังจะมาถึง</div>
          ) : upcomingEvents.map(evt => {
            const isToday = evt.date === todayStr;
            const shortDate = evt.date.split('-').reverse().join('/');
            
            return (
              <div 
                key={evt.id} 
                onClick={() => handleDayClick(evt.date)}
                className="border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-amber-500/50 transition-all bg-slate-800/30 cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-3">
                  {isToday ? (
                    <div className="border border-amber-500/30 text-amber-500 font-bold px-2 py-0.5 rounded flex items-center gap-1 text-[10px] bg-amber-500/10">
                      <Star size={10} weight="fill" /> TODAY
                    </div>
                  ) : (
                    <div className="border border-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded flex items-center gap-1 text-[10px] bg-slate-800">
                      {shortDate}
                    </div>
                  )}
                  <div className="bg-slate-950 text-amber-500 font-bold px-2 py-0.5 rounded flex items-center gap-1 text-[10px]">
                    <Clock size={10} weight="fill" /> {evt.time || '--:--'}
                  </div>
                </div>
                
                <h4 className="font-black text-white text-sm truncate mb-3 group-hover:text-amber-500 transition-colors">
                  {evt.team1} <span className="text-slate-500 font-medium mx-0.5 text-xs">vs</span> {evt.team2}
                </h4>
                
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 truncate">
                  {evt.radio && (
                    <span className="border border-amber-500/50 text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-full shrink-0">
                      ว.{evt.radio}
                    </span>
                  )}
                  {evt.location && (
                    <span className="truncate flex items-center gap-1">
                      <MapPin size={12} weight="fill" className="text-amber-500 shrink-0" /> {evt.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="max-w-3xl"
        title={null}
      >
        {modalView === 'DAY_VIEW' ? (
          <div className="flex flex-col min-h-[350px]">
            {events.filter(e => e.date === selectedDateForView).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                <Folder size={64} weight="duotone" className="opacity-20 mb-4" />
                <p className="font-medium text-lg opacity-60">ไม่มีตารางในวันนี้</p>
              </div>
            ) : (
              <div className="flex-1 space-y-4 mb-6 overflow-y-auto pr-2 custom-scrollbar max-h-[60vh] pt-4">
                {events.filter(e => e.date === selectedDateForView).map(evt => (
                  <div key={evt.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 shadow-sm text-slate-300">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="bg-slate-950 text-amber-500 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm shadow-sm">
                          <Clock size={16} weight="fill" /> {evt.time || '--:--'}
                        </div>
                        {evt.radio && (
                          <div className="bg-slate-800 border border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-sm shadow-sm">
                            ว. {evt.radio}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {evt.type && (
                          <div className="border border-amber-500/50 text-amber-500 font-bold px-3 py-1 rounded-full text-xs bg-amber-500/10">
                            {evt.type}
                          </div>
                        )}
                        {user && (
                          <button onClick={() => handleOpenForm(evt)} className="bg-slate-800 border border-slate-700 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <PencilSimple size={16} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teams & Location */}
                    <div className="mb-4">
                      <h3 className="text-[26px] font-black uppercase tracking-tight text-white mb-1">
                        {evt.team1} <span className="text-slate-500 font-medium text-xl mx-2">vs</span> {evt.team2}
                      </h3>
                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <MapPin size={16} weight="fill" className="text-amber-500" /> {evt.location}
                        </div>
                      )}
                    </div>

                    {/* Grid Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-900/50 rounded-xl p-4 mb-4 border border-slate-800">
                      <div className="col-span-2 md:col-span-1">
                        <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">SCORE</div>
                        <div className="text-sm font-bold text-white">{evt.score || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">STYLE</div>
                        <div className="text-sm font-bold text-white">{evt.style || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">BET / REWARD</div>
                        <div className="text-sm font-bold text-amber-500">{evt.bet || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">FIGHTS</div>
                        <div className="text-sm font-bold text-white">{evt.fights || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">MEDIC COOLDOWN</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1">
                          <Heartbeat size={14} weight="fill" className="text-amber-500" /> {evt.medic || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Extended Details */}
                    {evt.description && (
                      <div className="border-l-4 border-amber-500 pl-4 py-1 mt-6">
                        <div className="whitespace-pre-wrap text-[13px] font-medium text-slate-300 leading-relaxed">
                          {evt.description}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {user && (
              <div className="mt-auto pt-4 border-t border-slate-800">
                <Button 
                  className="w-full py-4 text-amber-500 hover:text-amber-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 flex justify-center gap-2 items-center text-lg font-bold rounded-xl shadow-inner"
                  onClick={() => handleOpenForm(null, selectedDateForView)}
                >
                  <Plus size={24} weight="bold" /> เพิ่ม Event ในวันนี้
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-2">
            <div className="mb-6">
              <div className="text-[28px] font-black text-white tracking-tight flex items-center gap-2">Story Event 👑</div>
              <div className="text-[13px] font-medium text-slate-400 mt-0.5">เพิ่มหรือแก้ไขข้อมูลไทม์ไลน์ (รองรับการขึ้นบรรทัดใหม่)</div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl p-6 shadow-sm border border-slate-700 relative overflow-hidden">
                {/* Decorative blob like in design */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-0"></div>
                
                <div className="relative z-10">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Date (วันที่) <span className="text-amber-500">*</span></label>
                  <input 
                    type="date"
                    required 
                    value={formData.date}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Time (เวลา) <span className="text-amber-500">*</span></label>
                  <input 
                    type="time"
                    required 
                    value={formData.time}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700 space-y-5">
                
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">Matchup (คู่กรณี) <span className="text-amber-500">*</span></label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text"
                      placeholder="Team A"
                      required
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-center font-bold text-white focus:outline-none focus:border-amber-500"
                      value={formData.team1}
                      onChange={e => {
                        const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.[\]]/g, '').toUpperCase();
                        setFormData({...formData, team1: val});
                      }}
                    />
                    <div className="bg-slate-950 text-amber-500 font-black px-3 py-2 rounded-lg text-sm border border-slate-800 shadow-sm">VS</div>
                    <input 
                      type="text"
                      placeholder="Team B"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-center font-bold text-white focus:outline-none focus:border-amber-500"
                      value={formData.team2}
                      onChange={e => {
                        const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.[\]]/g, '').toUpperCase();
                        setFormData({...formData, team2: val});
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Type (ประเภท)</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="">- เลือกประเภท -</option>
                      <option value="Gang">Gang</option>
                      <option value="Family">Family</option>
                      <option value="Gang - Family">Gang - Family</option>
                      <option value="Gang - Citizen">Gang - Citizen</option>
                      <option value="Family - Citizen">Family - Citizen</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Location (สถานที่)</label>
                    <input 
                      type="text"
                      placeholder="เช่น Red Garage"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Fights (จำนวนไฟต์)</label>
                    <input 
                      type="number"
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      value={formData.fights}
                      onChange={e => setFormData({...formData, fights: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Radio (ว. ที่ใช้)</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      value={formData.radio}
                      onChange={e => setFormData({...formData, radio: e.target.value})}
                    >
                      <option value="">- เลือกวิทยุ -</option>
                      <option value="4">ว.4</option>
                      <option value="5">ว.5</option>
                      <option value="6">ว.6</option>
                      <option value="7">ว.7</option>
                      <option value="8">ว.8</option>
                      <option value="9">ว.9</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Bet / Reward (เดิมพัน / รางวัล)</label>
                    <div className="relative">
                      <Coins size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                      <input 
                        type="text"
                        placeholder="เช่น 50,000"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                        value={formData.bet}
                        onChange={e => {
                          const numStr = e.target.value.replace(/\D/g, '');
                          const formatted = numStr ? Number(numStr).toLocaleString('en-US') : '';
                          setFormData({...formData, bet: formatted});
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Medic Cooldown (คูลดาวน์หมอ)</label>
                    <div className="relative">
                      <Heartbeat size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                      <input 
                        type="text"
                        placeholder="เช่น 10 นาที"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                        value={formData.medic}
                        onChange={e => setFormData({...formData, medic: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Style (รูปแบบ)</label>
                    <input 
                      type="text"
                      placeholder="เช่น Melee / Gun"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      value={formData.style}
                      onChange={e => setFormData({...formData, style: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Score (ผลคะแนน)</label>
                    <input 
                      type="text"
                      placeholder="เช่น 2-1"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-black text-center"
                      value={formData.score}
                      onChange={e => setFormData({...formData, score: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Description (รายละเอียดเพิ่มเติม)</label>
                  <textarea 
                    rows="4"
                    placeholder="อธิบายสตอรี่คร่าวๆ (รองรับการขึ้นบรรทัดใหม่ตามที่คัดลอกมาวาง)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium resize-y"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><UserCircle size={14} className="text-amber-500" /> Council Staff (สภาผู้ดูแล)</label>
                    <input 
                      type="text"
                      placeholder="ชื่อสภา"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 font-medium cursor-not-allowed"
                      value={formData.staff}
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Files size={14} className="text-slate-500" /> Note (หมายเหตุภายใน)</label>
                    <input 
                      type="text"
                      placeholder="หมายเหตุ..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      value={formData.note}
                      onChange={e => setFormData({...formData, note: e.target.value})}
                    />
                  </div>
                </div>

              </div>
            </div>
            </div>

            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl shadow-lg mt-4 border border-slate-800">
              {editingId ? (
                <Button type="button" variant="danger" className="bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => triggerDelete(editingId)}>ลบกิจกรรม</Button>
              ) : <div></div>}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setModalView('DAY_VIEW')}>ยกเลิก</Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8">บันทึกข้อมูล</Button>
              </div>
            </div>
          </form>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Event Modal */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="⚠️ ยืนยันการลบกิจกรรม"
      >
        <div className="space-y-6">
          <p className="text-slate-300">
            คุณต้องการ <strong className="text-red-400">ลบกิจกรรมนี้</strong> ออกจากปฏิทินใช่หรือไม่?
          </p>
          <p className="text-sm text-slate-400">
            การลบสตอรี่จะไม่สามารถกู้คืนได้
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
