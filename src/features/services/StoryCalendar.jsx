import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { CalendarCheck, Plus, PencilSimple, Trash, MapPin, Sword, CaretLeft, CaretRight, Folder, Clock, Coins, Heartbeat, NotePencil, UserCircle, Files, Star, FloppyDisk } from '@phosphor-icons/react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import StoryEventForm from './StoryEventForm';

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
  const [formDefaultValues, setFormDefaultValues] = useState({
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
      setFormDefaultValues({ ...evt });
    } else {
      setEditingId(null);
      const d = new Date();
      const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setFormDefaultValues({ 
        date: dateStr || selectedDateForView || localToday, 
        time: '', team1: '', team2: '', type: '', location: '', fights: '', radio: '', bet: '', medic: '', style: '', score: '', description: '', staff: user?.customName || user?.displayName || user?.email?.split('@')[0] || '', note: '' 
      });
    }
    setModalView('EVENT_FORM');
    setIsModalOpen(true);
  };

  const handleSubmit = (data) => {
    let updatedEvents = [...events];
    
    if (editingId) {
      const idx = updatedEvents.findIndex(ev => ev.id === editingId);
      if (idx > -1) updatedEvents[idx] = { ...data, id: editingId };
    } else {
      updatedEvents.push({ ...data, id: 'ev_' + Date.now() });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-20 max-w-7xl mx-auto px-2 md:px-0">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CalendarCheck size={32} className="text-white drop-shadow-md" weight="fill" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">STORY CALENDAR</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                ปฏิทินเดินสตอรี่และวอร์ประจำเดือน
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/50 shadow-inner">
              <Clock size={24} weight="duotone" className="text-amber-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-white font-black text-xl tracking-widest font-mono leading-none">
                  {realTime.toLocaleTimeString('en-GB')}
                </span>
                <span className="text-amber-500/80 font-bold text-[10px] tracking-widest uppercase mt-0.5">Bangkok Time</span>
              </div>
            </div>
            {user && (
              <Button 
                onClick={() => handleOpenForm(null)} 
                className="w-full sm:w-auto h-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-400 transition-all shadow-lg"
              >
                <Plus size={20} weight="bold" className="mr-2" /> เพิ่มกิจกรรม
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Calendar */}
        <div className="lg:col-span-3 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          {/* Calendar Header */}
          <div className="bg-slate-950/50 border-b border-slate-800/80 p-5 flex items-center justify-between relative z-10">
            <Button variant="ghost" className="h-10 w-10 rounded-full hover:bg-slate-800 hover:text-white" onClick={prevMonth}><CaretLeft size={20} weight="bold" /></Button>
            <h2 className="text-2xl font-black text-white tracking-wide">
              {monthNames[month]} <span className="text-amber-500 font-mono ml-2">{year}</span>
            </h2>
            <Button variant="ghost" className="h-10 w-10 rounded-full hover:bg-slate-800 hover:text-white" onClick={nextMonth}><CaretRight size={20} weight="bold" /></Button>
          </div>

          {/* Calendar Grid */}
          <div className="p-5 flex-1 relative z-10">
            <div className="grid grid-cols-7 gap-3 mb-3">
              {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'].map((d, i) => (
                <div key={i} className="py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-950/40 rounded-xl border border-slate-800/50 shadow-inner">
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{d.charAt(0)}</span>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-28 sm:h-32 rounded-2xl bg-slate-800/5 border border-slate-800/20"></div>;
                
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dateStr);
                const isToday = todayStr === dateStr;

                return (
                  <div 
                    key={day} 
                    onClick={() => handleDayClick(dateStr)}
                    className={`h-28 sm:h-32 p-2 sm:p-3 rounded-2xl overflow-y-auto custom-scrollbar relative transition-all duration-300 cursor-pointer border group flex flex-col
                      ${isToday 
                        ? 'bg-gradient-to-b from-amber-500/10 to-amber-900/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:border-amber-400' 
                        : 'bg-slate-900/40 border-slate-700/40 hover:border-slate-500/60 hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-xl'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2 shrink-0">
                      <div className={`text-sm sm:text-base font-black flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors
                        ${isToday ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 group-hover:text-white group-hover:bg-slate-700'}`}>
                        {day}
                      </div>
                      {/* Visual indicator that it's clickable (for admins) */}
                      {user && (
                        <div className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500/10 p-1.5 rounded-lg">
                          <Plus size={12} weight="bold" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 mt-1">
                      {dayEvents.map(evt => {
                        const isGang = evt.type?.includes('Gang');
                        return (
                          <div 
                            key={evt.id} 
                            className={`text-xs p-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col gap-1 shadow-sm border
                              ${isGang 
                                ? 'bg-gradient-to-r from-red-950/40 to-red-900/20 text-red-100 border-red-500/30 hover:border-red-400/60 hover:shadow-red-500/10' 
                                : 'bg-gradient-to-r from-blue-950/40 to-blue-900/20 text-blue-100 border-blue-500/30 hover:border-blue-400/60 hover:shadow-blue-500/10'
                              }`}
                          >
                            <div className="font-black truncate leading-tight tracking-tight">
                              {evt.team1} <span className="opacity-50 mx-0.5 text-[10px] font-medium">v</span> {evt.team2}
                            </div>
                            <div className="flex justify-between items-center opacity-80 text-[10px] font-mono">
                              <span className="bg-black/30 px-1.5 py-0.5 rounded-md">{evt.time}</span>
                              {isGang ? <Sword size={12} weight="fill" className="text-red-400" /> : <MapPin size={12} weight="fill" className="text-blue-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* Upcoming Stories Sidebar */}
      <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-fit">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
        
        <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6 tracking-wide relative z-10">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-500 rounded-xl border border-amber-500/20 shadow-inner">
            <Clock size={20} weight="fill" />
          </div>
          Upcoming
        </h3>
        
        <div className="space-y-4 relative z-10">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed text-slate-500 text-sm font-medium">
              ไม่มีกิจกรรมที่กำลังจะมาถึง
            </div>
          ) : upcomingEvents.map(evt => {
            const isToday = evt.date === todayStr;
            const shortDate = evt.date.split('-').reverse().join('/');
            
            return (
              <div 
                key={evt.id} 
                onClick={() => handleDayClick(evt.date)}
                className="bg-slate-950/40 border border-slate-700/50 rounded-2xl p-4 shadow-sm hover:border-amber-500/50 hover:bg-slate-800/60 hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-3">
                  {isToday ? (
                    <div className="border border-amber-500/40 text-amber-400 font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[10px] bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-widest uppercase">
                      <Star size={12} weight="fill" /> TODAY
                    </div>
                  ) : (
                    <div className="border border-slate-700/80 text-slate-400 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-[10px] bg-slate-900 shadow-inner">
                      {shortDate}
                    </div>
                  )}
                  <div className="bg-slate-900/80 text-amber-500 font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[10px] shadow-inner border border-slate-800">
                    <Clock size={12} weight="bold" /> {evt.time || '--:--'}
                  </div>
                </div>
                
                <h4 className="font-black text-white text-[15px] truncate mb-3 group-hover:text-amber-400 transition-colors tracking-tight">
                  {evt.team1} <span className="text-slate-500 font-medium mx-1 text-xs">vs</span> {evt.team2}
                </h4>
                
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 truncate">
                  {evt.radio && (
                    <span className="border border-slate-600/50 text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                      ว. {evt.radio}
                    </span>
                  )}
                  {evt.location && (
                    <span className="truncate flex items-center gap-1.5 text-slate-400">
                      <MapPin size={14} weight="fill" className="text-amber-500 shrink-0" /> {evt.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="max-w-3xl bg-slate-900/90 backdrop-blur-2xl border-slate-700/50 shadow-2xl overflow-hidden"
        title={null}
      >
        {modalView === 'DAY_VIEW' ? (
          <div className="flex flex-col min-h-[350px] relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60 relative z-10">
              <CalendarCheck size={28} weight="duotone" className="text-amber-500" />
              <h2 className="text-2xl font-black text-white tracking-wide">
                กิจกรรมวันที่ <span className="text-amber-500">{selectedDateForView?.split('-').reverse().join('/')}</span>
              </h2>
            </div>

            {events.filter(e => e.date === selectedDateForView).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-16 relative z-10">
                <div className="w-24 h-24 rounded-full bg-slate-800/30 flex items-center justify-center mb-4 border border-slate-700/30 shadow-inner">
                  <Folder size={48} weight="duotone" className="text-slate-600" />
                </div>
                <p className="font-bold text-lg text-slate-400">ไม่มีตารางในวันนี้</p>
                <p className="text-sm text-slate-500 mt-1">ยังไม่มีการนัดหมายใดๆ ถูกบันทึกไว้</p>
              </div>
            ) : (
              <div className="flex-1 space-y-5 mb-6 overflow-y-auto pr-2 custom-scrollbar max-h-[60vh] pt-2 relative z-10">
                {events.filter(e => e.date === selectedDateForView).map(evt => {
                  const isGang = evt.type?.includes('Gang');
                  return (
                  <div key={evt.id} className="bg-slate-950/60 rounded-2xl border border-slate-700/50 p-6 shadow-lg relative overflow-hidden group hover:border-slate-500/50 transition-all">
                    {/* Background glow based on type */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-40
                      ${isGang ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="bg-slate-900 border border-amber-500/30 text-amber-500 font-black px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                          <Clock size={16} weight="bold" /> {evt.time || '--:--'}
                        </div>
                        {evt.radio && (
                          <div className="bg-slate-800/80 border border-slate-600/50 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-sm shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> ว. {evt.radio}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {evt.type && (
                          <div className={`border font-black px-3 py-1 rounded-lg text-xs uppercase tracking-wider
                            ${isGang ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-blue-500/50 text-blue-400 bg-blue-500/10'}`}>
                            {evt.type}
                          </div>
                        )}
                        {user && (
                          <button onClick={() => handleOpenForm(evt)} className="bg-slate-800 border border-slate-600 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-amber-600 hover:border-amber-500 transition-all shadow-sm">
                            <PencilSimple size={16} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teams & Location */}
                    <div className="mb-6 relative z-10">
                      <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-2 drop-shadow-md">
                        {evt.team1} <span className="text-slate-500 font-bold text-xl mx-2 bg-slate-900 px-2 py-0.5 rounded-md">VS</span> {evt.team2}
                      </h3>
                      {evt.location && (
                        <div className="flex items-center gap-2 text-slate-400 font-bold bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg border border-slate-800/50">
                          <MapPin size={16} weight="fill" className={isGang ? 'text-red-400' : 'text-blue-400'} /> {evt.location}
                        </div>
                      )}
                    </div>

                    {/* Grid Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 relative z-10 shadow-inner">
                      <div className="col-span-2 md:col-span-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                        <div className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">SCORE</div>
                        <div className="text-lg font-black text-white">{evt.score || '-'}</div>
                      </div>
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                        <div className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">STYLE</div>
                        <div className="text-sm font-bold text-slate-200 mt-1">{evt.style || '-'}</div>
                      </div>
                      <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/20 blur-md rounded-full -mt-2 -mr-2"></div>
                        <div className="text-[10px] font-black text-amber-500/70 mb-1 uppercase tracking-widest relative z-10">BET / REWARD</div>
                        <div className="text-sm font-black text-amber-400 mt-1 relative z-10">{evt.bet || '-'}</div>
                      </div>
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                        <div className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">FIGHTS</div>
                        <div className="text-sm font-bold text-slate-200 mt-1">{evt.fights || '-'}</div>
                      </div>
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                        <div className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">MEDIC CD</div>
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mt-1">
                          <Heartbeat size={14} weight="fill" className="text-rose-500" /> {evt.medic || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Extended Details */}
                    {evt.description && (
                      <div className="relative mt-5 pt-5 border-t border-slate-800 z-10">
                        <div className="absolute left-0 top-5 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-transparent rounded-full"></div>
                        <div className="pl-4 whitespace-pre-wrap text-sm font-medium text-slate-300 leading-relaxed">
                          {evt.description}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {user && (
              <div className="mt-auto pt-5 border-t border-slate-800/60 relative z-10">
                <Button 
                  className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-amber-600 hover:to-orange-600 text-amber-500 hover:text-white border border-slate-700 hover:border-amber-500 flex justify-center gap-2 items-center text-lg font-black rounded-2xl shadow-lg transition-all duration-300 group overflow-hidden relative"
                  onClick={() => handleOpenForm(null, selectedDateForView)}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <Plus size={24} weight="bold" className="relative z-10 group-hover:rotate-90 transition-transform duration-300" /> 
                  <span className="relative z-10">เพิ่มกิจกรรมลงในวันนี้</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <StoryEventForm
            defaultValues={formDefaultValues}
            editingId={editingId}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            onDelete={triggerDelete}
          />
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
