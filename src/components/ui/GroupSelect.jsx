import { useState, useEffect, useRef } from 'react';
import { db } from '../../core/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function GroupSelect({ 
  value, 
  onChange, 
  orgType, 
  label = "ชื่อสังกัด (GROUP NAME)", 
  placeholder = "ระบุชื่อแก๊ง หรือ ครอบครัว",
  disabled = false
}) {
  const [groups, setGroups] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Fetch groups from Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_state', 'groups'), (docSnap) => {
      if (docSnap.exists()) {
        setGroups(docSnap.data().groups || []);
      }
    });
    return () => unsub();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter groups
  const filteredGroups = groups.filter(g => {
    if (orgType && g.type !== orgType) return false;
    if (searchQuery.trim() && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-3 relative" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div 
        className={`w-full bg-slate-950 border ${isDropdownOpen ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center transition-all`}
        onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 transition-transform text-slate-400 ${isDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-slate-700">
            <input 
              type="text" 
              placeholder="พิมพ์ค้นหาชื่อ..." 
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                {searchQuery.trim() ? "ไม่พบรายชื่อที่ค้นหา" : "ไม่มีข้อมูล"}
              </div>
            ) : (
              filteredGroups.map(g => (
                <div 
                  key={g.id} 
                  className="px-4 py-2.5 text-sm text-slate-200 hover:bg-amber-500 hover:text-white cursor-pointer transition-colors"
                  onClick={() => {
                    onChange(g.name);
                    setIsDropdownOpen(false);
                    setSearchQuery('');
                  }}
                >
                  {g.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
