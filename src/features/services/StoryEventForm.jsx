import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, MapPin, Sword, Coins, Heartbeat, UserCircle, Files, PencilSimple, Plus, Trash, FloppyDisk } from '@phosphor-icons/react';
import Button from '../../components/ui/Button';

const storyEventSchema = z.object({
  date: z.string().min(1, 'ระบุวันที่'),
  time: z.string().min(1, 'ระบุเวลา'),
  team1: z.string().min(1, 'ระบุทีมที่ 1'),
  team2: z.string().min(1, 'ระบุทีมที่ 2'),
  type: z.string().optional(),
  location: z.string().optional(),
  fights: z.string().optional(),
  radio: z.string().optional(),
  bet: z.string().optional(),
  medic: z.string().optional(),
  style: z.string().optional(),
  score: z.string().optional(),
  description: z.string().optional(),
  staff: z.string().optional(),
  note: z.string().optional()
});

export default function StoryEventForm({ 
  defaultValues, 
  editingId, 
  onSubmit, 
  onCancel, 
  onDelete 
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(storyEventSchema),
    defaultValues
  });

  // Keep internal values synced if defaultValues change
  useEffect(() => {
    Object.keys(defaultValues).forEach(key => {
      setValue(key, defaultValues[key]);
    });
  }, [defaultValues, setValue]);

  return (
    <div className="relative pt-2">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="mb-8 border-b border-slate-800/60 pb-4 relative z-10">
        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-3">
          {editingId ? <PencilSimple weight="bold" className="text-amber-500" /> : <Plus weight="bold" className="text-amber-500" />}
          {editingId ? 'แก้ไขข้อมูลกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}
        </div>
        <div className="text-sm font-medium text-slate-400 mt-2 flex items-center gap-2">
          ระบุรายละเอียดของเหตุการณ์เพื่อแจ้งให้ทุกคนทราบ
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-5 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date (วันที่) <span className="text-amber-500">*</span></label>
            <input 
              type="date"
              className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors"
              {...register('date')}
            />
            {errors.date && <span className="text-red-500 text-xs">{errors.date.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Time (เวลา) <span className="text-amber-500">*</span></label>
            <div className="relative">
              <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="time"
                className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors"
                {...register('time')}
              />
            </div>
            {errors.time && <span className="text-red-500 text-xs">{errors.time.message}</span>}
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/50 shadow-inner space-y-6">
          
          <div>
            <label className="text-xs font-black text-slate-400 mb-3 block uppercase tracking-widest">Matchup (คู่กรณี) <span className="text-amber-500">*</span></label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder="Team A"
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3.5 text-center font-black text-white text-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-inner transition-colors uppercase placeholder:normal-case"
                  {...register('team1')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.[\]]/g, '').toUpperCase();
                    setValue('team1', val);
                  }}
                />
                {errors.team1 && <span className="text-red-500 text-xs mt-1 block">{errors.team1.message}</span>}
              </div>
              <div className="bg-slate-800 text-amber-500 font-black px-4 py-3.5 rounded-xl border border-slate-700 shadow-md">VS</div>
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder="Team B"
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3.5 text-center font-black text-white text-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-inner transition-colors uppercase placeholder:normal-case"
                  {...register('team2')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.[\]]/g, '').toUpperCase();
                    setValue('team2', val);
                  }}
                />
                {errors.team2 && <span className="text-red-500 text-xs mt-1 block">{errors.team2.message}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Type (ประเภท)</label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors appearance-none"
                  {...register('type')}
                >
                  <option value="">- เลือกประเภท -</option>
                  <option value="Gang">Gang</option>
                  <option value="Family">Family</option>
                  <option value="Gang - Family">Gang - Family</option>
                  <option value="Gang - Citizen">Gang - Citizen</option>
                  <option value="Family - Citizen">Family - Citizen</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Location (สถานที่)</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  placeholder="เช่น Red Garage"
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors"
                  {...register('location')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Fights (จำนวนไฟต์)</label>
              <div className="relative">
                <Sword size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors"
                  {...register('fights')}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Radio (ว. ที่ใช้)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">ว.</span>
                <select 
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors appearance-none"
                  {...register('radio')}
                >
                  <option value="">- เลือกวิทยุ -</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Bet / Reward (เดิมพัน)</label>
              <div className="relative">
                <Coins size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                <input 
                  type="text"
                  placeholder="เช่น 50,000"
                  className="w-full bg-slate-950/80 border border-amber-500/30 rounded-xl pl-10 pr-4 py-3 text-amber-400 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-inner transition-colors placeholder:text-amber-700/30"
                  {...register('bet')}
                  onChange={e => {
                    const numStr = e.target.value.replace(/\D/g, '');
                    const formatted = numStr ? Number(numStr).toLocaleString('en-US') : '';
                    setValue('bet', formatted);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Medic Cooldown (คูลดาวน์หมอ)</label>
              <div className="relative">
                <Heartbeat size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                <input 
                  type="text"
                  placeholder="เช่น 10 นาที"
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors"
                  {...register('medic')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Style (รูปแบบ)</label>
              <input 
                type="text"
                placeholder="เช่น Melee / Gun"
                className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors"
                {...register('style')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Score (ผลคะแนน)</label>
              <input 
                type="text"
                placeholder="เช่น 2-1"
                className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-black text-center shadow-inner transition-colors"
                {...register('score')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description (รายละเอียดเพิ่มเติม)</label>
            <textarea 
              rows="4"
              placeholder="อธิบายสตอรี่คร่าวๆ (รองรับการขึ้นบรรทัดใหม่ตามที่คัดลอกมาวาง)..."
              className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium resize-y shadow-inner transition-colors custom-scrollbar"
              {...register('description')}
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-5 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><UserCircle size={16} className="text-amber-500" /> Council Staff (สภาผู้ดูแล)</label>
              <input 
                type="text"
                placeholder="ชื่อสภา"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 font-bold cursor-not-allowed shadow-inner"
                {...register('staff')}
                readOnly
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Files size={16} className="text-slate-500" /> Note (หมายเหตุภายใน)</label>
              <input 
                type="text"
                placeholder="หมายเหตุ..."
                className="w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-medium shadow-inner transition-colors"
                {...register('note')}
              />
            </div>
          </div>

        </div>

        <div className="flex justify-between items-center bg-slate-950/50 p-5 rounded-2xl shadow-lg mt-8 border border-slate-800/80 backdrop-blur-md">
          {editingId ? (
            <Button 
              type="button" 
              variant="danger" 
              className="bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 font-bold rounded-xl px-6 h-[44px]" 
              onClick={() => onDelete(editingId)}
            >
              <Trash size={18} className="mr-2" /> ลบกิจกรรม
            </Button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              className="text-slate-400 hover:text-white font-bold rounded-xl px-6 h-[44px]" 
              onClick={onCancel}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl px-8 h-[44px] shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-500/50"
            >
              <FloppyDisk size={20} weight="fill" className="mr-2" /> บันทึกข้อมูล
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
