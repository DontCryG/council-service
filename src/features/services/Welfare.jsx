import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';

import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PaperPlaneTilt, Plus, Trash, Gift, Car, Shield, Buildings } from '@phosphor-icons/react';

export default function Welfare() {
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  
  const [formData, setFormData] = useState({
    orgType: 'GANG',
    orgName: '',
    requester: '',
    hasWeaponWelfare: false,
    otherWelfare: ''
  });
  const [vehicles, setVehicles] = useState([{ id: 1, model: '', plate: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captureRef = useRef(null);

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { id: Date.now(), model: '', plate: '' }]);
  };

  const handleRemoveVehicle = (id) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleVehicleChange = (id, field, val) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.requester) {
      showAlert('error', 'à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸«à¹‰à¸„à¸£à¸šà¸–à¹‰à¸§à¸™');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#0f172a',
        cacheBust: true
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'welfare.png');
      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "ðŸŽ WELFARE REQUEST RECEIPT",
          color: 0x10b981,
          fields: [
            { name: "ðŸ“‹ à¸›à¸£à¸°à¹€à¸ à¸—", value: formData.orgType, inline: true },
            { name: "ðŸ·ï¸ à¸Šà¸·à¹ˆà¸­", value: formData.orgName, inline: true },
            { name: "ðŸ‘¤ à¸œà¸¹à¹‰à¹€à¸šà¸´à¸", value: formData.requester, inline: false },
            { name: "âš”ï¸ à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸­à¸²à¸§à¸¸à¸˜", value: formData.hasWeaponWelfare ? 'âœ… à¸£à¸±à¸šà¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸­à¸²à¸§à¸¸à¸˜à¹„à¸¡à¹‰à¸žà¸¹à¸¥' : 'âŒ à¹„à¸¡à¹ˆà¸£à¸±à¸š', inline: true },
            { name: "ðŸš— à¸¢à¸²à¸™à¸žà¸²à¸«à¸™à¸°", value: vehicles.length > 0 ? vehicles.map(v => `${v.model} (${v.plate})`).join('\n') : 'à¹„à¸¡à¹ˆà¸¡à¸µ', inline: false },
            { name: "ðŸ“¦ à¸­à¸·à¹ˆà¸™à¹†", value: formData.otherWelfare || '-', inline: true },
          ],
          image: {
            url: "attachment://welfare.png"
          },
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('welfare', fd);
      await saveTransactionLog('welfare', {
        orgType: formData.orgType,
        orgName: formData.orgName,
        requester: formData.requester,
        vehicles: vehicles,
        hasWeaponWelfare: formData.hasWeaponWelfare,
        otherWelfare: formData.otherWelfare
      }, user);
      showAlert('success', 'à¸ªà¹ˆà¸‡à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§!');
      navigate('/home');
      
    } catch (err) {
      console.error(err);
      showAlert('error', 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Gift size={32} weight="duotone" className="text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">à¸£à¸°à¸šà¸šà¹€à¸šà¸´à¸à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£ Gang / Family</h1>
          <p className="text-slate-400">à¸Ÿà¸­à¸£à¹Œà¸¡à¸‚à¸­à¹€à¸šà¸´à¸à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸ªà¸³à¸«à¸£à¸±à¸š GANG / FAMILY</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-4 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.orgType === 'GANG' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'GANG'})}
              >
                GANG
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-bold transition-colors ${formData.orgType === 'FAMILY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
              >
                FAMILY
              </button>
            </div>

            <Input 
              label={`à¸Šà¸·à¹ˆà¸­ ${formData.orgType}`} 
              placeholder="à¸£à¸°à¸šà¸¸à¸Šà¸·à¹ˆà¸­..." 
              required
              value={formData.orgName}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                setFormData({...formData, orgName: val});
              }}
            />

            <Input 
              label="à¸œà¸¹à¹‰à¹€à¸šà¸´à¸à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£" 
              placeholder="à¸Šà¸·à¹ˆà¸­à¹ƒà¸™à¹€à¸à¸¡..." 
              required
              value={formData.requester}
              onChange={e => setFormData({...formData, requester: e.target.value})}
            />

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300 ml-1">à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸žà¸²à¸«à¸™à¸°</label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddVehicle} className="text-emerald-400 hover:text-emerald-300">
                  <Plus size={16} /> à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸–
                </Button>
              </div>
              
              {vehicles.map((v, idx) => (
                <div key={v.id} className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="à¸Šà¸·à¹ˆà¸­à¸£à¸– / à¸£à¸¸à¹ˆà¸™à¸£à¸–"
                      value={v.model}
                      onChange={(e) => handleVehicleChange(v.id, 'model', e.target.value)}
                    />
                    <Input 
                      placeholder="à¸›à¹‰à¸²à¸¢à¸—à¸°à¹€à¸šà¸µà¸¢à¸™"
                      value={v.plate}
                      onChange={(e) => handleVehicleChange(v.id, 'plate', e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="danger" size="icon" onClick={() => handleRemoveVehicle(v.id)}>
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  checked={formData.hasWeaponWelfare}
                  onChange={e => setFormData({...formData, hasWeaponWelfare: e.target.checked})}
                />
                <span className="font-medium text-white flex items-center gap-2"><Shield className="text-amber-500"/> à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸­à¸²à¸§à¸¸à¸˜à¹„à¸¡à¹‰à¸žà¸¹à¸¥</span>
              </label>

              <Input 
                label="à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸­à¸·à¹ˆà¸™à¹† (à¸–à¹‰à¸²à¸¡à¸µ)" 
                placeholder="à¹€à¸Šà¹ˆà¸™ à¸à¸¥à¹ˆà¸­à¸‡à¸•à¹ˆà¸²à¸‡à¹†..." 
                value={formData.otherWelfare}
                onChange={e => setFormData({...formData, otherWelfare: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              <PaperPlaneTilt size={20} weight="bold" /> à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¹€à¸šà¸´à¸à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£
            </Button>
          </form>
        </Card>

        {/* Preview */}
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Preview</h3>
          <div ref={captureRef} className="bg-slate-900 rounded-xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">WELFARE RECEIPT</h2>
              <p className="text-emerald-400 font-bold mt-1 uppercase tracking-wider">{formData.orgType}</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">à¸Šà¸·à¹ˆà¸­</span>
                <span className="font-bold text-white text-xl">{formData.orgName || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">à¸œà¸¹à¹‰à¹€à¸šà¸´à¸</span>
                <span className="font-medium text-white">{formData.requester || '-'}</span>
              </div>
              
              <div className="py-3 border-b border-slate-800/50">
                <span className="text-slate-400 block mb-2">à¸¢à¸²à¸™à¸žà¸²à¸«à¸™à¸° ({vehicles.length})</span>
                <div className="space-y-1">
                  {vehicles.map((v, i) => (
                    <div key={i} className="text-sm text-slate-300 flex justify-between bg-slate-950 p-2 rounded">
                      <span className="flex items-center gap-2"><Car className="text-blue-400"/> {v.model || '...'}</span>
                      <span className="font-mono text-amber-400">{v.plate || '...'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                <span className="text-slate-400">à¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸­à¸²à¸§à¸¸à¸˜</span>
                <span className={`font-bold ${formData.hasWeaponWelfare ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {formData.hasWeaponWelfare ? 'âœ… à¸£à¸±à¸šà¸ªà¸§à¸±à¸ªà¸”à¸´à¸à¸²à¸£à¸­à¸²à¸§à¸¸à¸˜à¹„à¸¡à¹‰à¸žà¸¹à¸¥' : 'âŒ à¹„à¸¡à¹ˆà¸£à¸±à¸š'}
                </span>
              </div>

              {formData.otherWelfare && (
                <div className="py-3 border-b border-slate-800/50">
                  <span className="text-slate-400 block mb-1">à¸­à¸·à¹ˆà¸™à¹†</span>
                  <span className="text-white">{formData.otherWelfare}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
