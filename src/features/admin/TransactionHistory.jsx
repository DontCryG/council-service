import { useState, useEffect } from 'react';
import { getTransactionLogs } from '../../core/api';
import { Card } from '../../components/ui/Card';
import { Clock, Database, Buildings, UserCircle, Receipt } from '@phosphor-icons/react';

export default function TransactionHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await getTransactionLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'edit_org': return { label: 'แก้ไขข้อมูลองค์กร', color: 'text-pink-400', bg: 'bg-pink-500/10' };
      case 'welfare': return { label: 'เบิกสวัสดิการ', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'welfare_trade': return { label: 'แลกเปลี่ยนสวัสดิการ', color: 'text-violet-400', bg: 'bg-violet-500/10' };
      case 'general_service': return { label: 'บริการทั่วไป', color: 'text-amber-400', bg: 'bg-amber-500/10' };
      case 'register_org': return { label: 'ลงทะเบียนแก๊งใหม่', color: 'text-blue-400', bg: 'bg-blue-500/10' };
      default: return { label: type, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    }
  };

  const getSummaryText = (log) => {
    switch (log.type) {
      case 'edit_org': return `${log.data.orgType}: ${log.data.orgName} (ผู้แจ้ง: ${log.data.requester})`;
      case 'welfare': return `${log.data.orgType}: ${log.data.orgName} (ผู้เบิก: ${log.data.requester})`;
      case 'welfare_trade': return `${log.data.orgType}: ${log.data.orgName} (${log.data.tradeType})`;
      case 'general_service': return `${log.data.groupName || '-'} (ผู้ขอ: ${log.data.requester})`;
      case 'register_org': return `[${log.data.alias}] ${log.data.name} (${log.data.orgType})`;
      default: return JSON.stringify(log.data);
    }
  };

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Database size={32} weight="duotone" className="text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">ประวัติการทำรายการ</h1>
          <p className="text-slate-400">Transaction History Logs (Data Retention)</p>
        </div>
      </div>

      <Card>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['ALL', 'register_org', 'edit_org', 'welfare', 'welfare_trade', 'general_service'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'ทั้งหมด' : getTypeLabel(t).label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-500">
            <Clock className="animate-spin mr-2" size={24} /> กำลังโหลดข้อมูล...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
            ไม่มีประวัติการทำรายการในระบบ
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => {
              const typeInfo = getTypeLabel(log.type);
              return (
                <div key={log.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 justify-between md:items-center hover:bg-slate-800 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock size={14} /> {log.createdAt.toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="text-white font-medium flex items-center gap-2">
                      <Receipt size={18} className="text-slate-400" />
                      {getSummaryText(log)}
                    </div>
                  </div>
                  
                  {log.createdBy && (
                    <div className="text-right text-sm text-slate-400 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg w-max md:w-auto self-start md:self-auto">
                      <UserCircle size={18} className="text-amber-500" />
                      <span>{log.createdBy.email}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
