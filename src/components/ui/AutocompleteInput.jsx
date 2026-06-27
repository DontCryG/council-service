import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { db } from '../../core/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function AutocompleteInput({ 
  value, 
  onChange, 
  label, 
  placeholder,
  type = 'text', // 'text' or 'group'
  orgType = null, // 'GANG' | 'FAMILY'
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [groups, setGroups] = useState([]);
  const wrapperRef = useRef(null);

  const [citizens, setCitizens] = useState([]);

  // Fetch groups if type is 'group'
  useEffect(() => {
    if (type !== 'group') return;
    const unsub = onSnapshot(doc(db, 'app_state', 'groups'), (docSnap) => {
      if (docSnap.exists()) {
        setGroups(docSnap.data().groups || []);
      }
    });
    return () => unsub();
  }, [type]);

  // Fetch citizens if type is 'text'
  useEffect(() => {
    if (type !== 'text') return;
    import('firebase/firestore').then(({ collection, onSnapshot }) => {
      const unsub = onSnapshot(collection(db, 'citizens'), (snapshot) => {
        setCitizens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    });
  }, [type]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = type === 'group' 
    ? groups.filter(g => {
        if (orgType && g.type !== orgType) return false;
        if (value.trim() && !g.name.toLowerCase().includes(value.toLowerCase())) return false;
        return true;
      })
    : citizens.filter(c => {
        if (value.trim() && !c.name.toLowerCase().includes(value.toLowerCase())) return false;
        return true;
      });

  return (
    <div className="space-y-3 relative" ref={wrapperRef}>
      {label && (
        <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      
      <div className={`flex items-center bg-slate-950 border ${isFocused || isOpen ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-700'} rounded-lg px-4 py-3 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <MagnifyingGlass size={20} className="text-slate-500 mr-3 shrink-0" />
        <input 
          type="text"
          placeholder={placeholder}
          className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none font-medium disabled:cursor-not-allowed"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay closing to allow clicking options
            setTimeout(() => setIsOpen(false), 200);
          }}
        />
      </div>

      {isOpen && value.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-4 text-center">
                <div className="text-slate-400 font-medium text-sm">
                  {type === 'group' ? 'ไม่พบข้อมูลสังกัดที่ค้นหา' : 'ไม่พบข้อมูลประชากร'}
                </div>
                {type === 'text' && (
                  <div className="text-amber-500 text-xs mt-1">*ระบบจะบันทึกให้อัตโนมัติเมื่อกดยืนยัน</div>
                )}
              </div>
            ) : (
              filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className="px-4 py-2.5 text-sm text-slate-200 hover:bg-amber-500 hover:text-white cursor-pointer transition-colors"
                  onMouseDown={() => {
                    onChange(item.name);
                    setIsOpen(false);
                  }}
                >
                  {item.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
