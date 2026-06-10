import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { db } from '../../core/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sendWebhook, saveTransactionLog } from '../../core/api';
import { toBlob } from 'html-to-image';

import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { PaperPlaneTilt, Buildings, PencilSimple, Palette, TShirt, CheckCircle } from '@phosphor-icons/react';

export default function EditOrg() {
  const navigate = useNavigate();
  const { showAlert, user } = useAppStore();
  
  const [councilMembers, setCouncilMembers] = useState([]);
  
  const [formData, setFormData] = useState({
    orgType: 'GANG',
    orgName: '',
    requester: '',
    councilStaffId: '',
    
    // Transactions
    changeInfo: false,
    editTexture: false,
    addCloth: false,
    bulkChange: false,
    addAccessory: false,
    // Details
    textureCount: 1,
    clothCount: 1,
    accessoryCount: 1,
    hexColor: '#000000',
    logoUrl: '',
    extraDetails: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const captureRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'app_state'), (snapshot) => {
      let loaded = false;
      snapshot.forEach(doc => {
        if (doc.id === 'council_members') {
          setCouncilMembers(doc.data().members || []);
          loaded = true;
        }
      });
      if (!loaded) setCouncilMembers([]);
    });
    return () => unsub();
  }, []);

  // Auto-switch to bulk change
  useEffect(() => {
    let baseCost = 0;
    if (formData.changeInfo) baseCost += 500000;
    if (formData.editTexture) baseCost += (500000 * Math.max(1, formData.textureCount));

    if (baseCost >= 1500000 && !formData.bulkChange) {
      setFormData(prev => ({
        ...prev,
        bulkChange: true,
        changeInfo: false,
        editTexture: false
      }));
      showAlert('info', 'à¸£à¸°à¸šà¸šà¹€à¸¥à¸·à¸­à¸à¹€à¸«à¸¡à¸²à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸«à¹‰à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´');
    } else if (formData.bulkChange && (formData.changeInfo || formData.editTexture)) {
      setFormData(prev => ({
        ...prev,
        changeInfo: false,
        editTexture: false
      }));
    }
  }, [formData.changeInfo, formData.editTexture, formData.textureCount, formData.bulkChange, showAlert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.requester || !formData.councilStaffId) {
      showAlert('error', 'à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¸³à¸„à¸±à¸à¹ƒà¸«à¹‰à¸„à¸£à¸šà¸–à¹‰à¸§à¸™');
      return;
    }

    if (formData.logoUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(formData.logoUrl) && !formData.logoUrl.includes('discordapp.')) {
      showAlert('error', 'à¸Šà¹ˆà¸­à¸‡ Link à¹‚à¸¥à¹‚à¸à¹‰ à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆà¸¥à¸´à¸‡à¸à¹Œà¸£à¸¹à¸›à¸ à¸²à¸žà¸—à¸µà¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡ (à¸•à¹‰à¸­à¸‡à¸¥à¸‡à¸—à¹‰à¸²à¸¢à¸”à¹‰à¸§à¸¢ .png, .jpg à¸¯à¸¥à¸¯ à¸«à¸£à¸·à¸­à¹€à¸›à¹‡à¸™à¸£à¸¹à¸›à¸¥à¸´à¸‡à¸à¹Œà¸ˆà¸²à¸à¸£à¸°à¸šà¸šà¸ªà¹ˆà¸§à¸™à¸à¸¥à¸²à¸‡)');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const blob = await toBlob(captureRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#f1f5f9',
        cacheBust: true 
      });
      if (!blob) throw new Error("Failed to generate image");
      
      const fd = new FormData();
      fd.append('file', blob, 'edit_org.png');
      fd.append('payload_json', JSON.stringify({
        embeds: [{
          title: "ðŸ”„ ORGANIZATION EDIT REQUEST",
          color: 0xec4899, // Pink
          thumbnail: formData.logoUrl ? { url: formData.logoUrl } : undefined,
          fields: [
            { name: "ðŸ° à¹à¸à¹Šà¸‡/à¹à¸Ÿà¸¡à¸´à¸¥à¸µà¹ˆ", value: `${formData.orgName} (${formData.orgType})`, inline: true },
            { name: "ðŸ‘¤ à¸œà¸¹à¹‰à¹à¸ˆà¹‰à¸‡", value: formData.requester, inline: true },
            { name: "à¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¹à¸à¹‰à¹„à¸‚", value: [
                formData.changeInfo ? "âœ… à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Gang" : "",
                formData.editTexture ? `âœ… à¹à¸à¹‰à¹„à¸‚ Texture à¹€à¸ªà¸·à¹‰à¸­à¸œà¹‰à¸² (${formData.textureCount} à¸Šà¸¸à¸”)` : "",
                formData.addCloth ? `âœ… à¸¥à¸‡à¸Šà¸¸à¸”à¹€à¸žà¸´à¹ˆà¸¡ (${formData.clothCount} à¸Šà¸¸à¸”)` : "",
                formData.bulkChange ? "âœ… à¹€à¸«à¸¡à¸²à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Gang" : "",
                formData.addAccessory ? `âœ… à¸¥à¸‡ Accessories Adons à¹€à¸ªà¸£à¸´à¸¡` : ""
            ].filter(Boolean).join('\n') || "à¹„à¸¡à¹ˆà¸¡à¸µ", inline: false },
            { name: "à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¹à¸à¹‰", value: formData.extraDetails || "-", inline: false },
            { name: "à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¸ªà¸ à¸²à¸œà¸¹à¹‰à¸£à¸±à¸šà¹€à¸£à¸·à¹ˆà¸­à¸‡", value: councilMembers.find(c => c.id === formData.councilStaffId)?.name || '-', inline: true },
          ],
          image: {
            url: "attachment://edit_org.png"
          },
          footer: { text: "Council Secretary System" },
          timestamp: new Date().toISOString()
        }]
      }));

      await sendWebhook('edit_org', fd);
      await saveTransactionLog('edit_org', {
        orgName: formData.orgName,
        orgType: formData.orgType,
        requester: formData.requester,
        councilStaffId: formData.councilStaffId,
        changeInfo: formData.changeInfo,
        editTexture: formData.editTexture,
        addCloth: formData.addCloth,
        bulkChange: formData.bulkChange,
        addAccessory: formData.addAccessory
      }, user);
      showAlert('success', 'à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹à¸ˆà¹‰à¸‡à¹à¸à¹‰à¹„à¸‚à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§!');
      setShowConfirm(false);
      navigate('/home');
      
    } catch (err) {
      console.error(err);
      showAlert('error', `à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: ${err.message || 'à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸”à¹‰'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    if (formData.changeInfo) total += 500000;
    if (formData.editTexture) total += (500000 * Math.max(1, formData.textureCount));
    if (formData.addCloth) total += (500000 * Math.max(1, formData.clothCount));
    if (formData.bulkChange) total += 1500000;
    if (formData.addAccessory) total += 1000000;
    return total;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <PencilSimple size={32} weight="duotone" className="text-pink-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">à¹à¸ˆà¹‰à¸‡à¹à¸à¹‰à¹„à¸‚à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸­à¸‡à¸„à¹Œà¸à¸£</h1>
          <p className="text-slate-400">à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¹à¸ˆà¹‰à¸‡à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸Šà¸·à¹ˆà¸­ à¸ªà¸µ à¹‚à¸¥à¹‚à¸à¹‰ à¸«à¸£à¸·à¸­à¸Šà¸¸à¸”à¸›à¸£à¸°à¸ˆà¸³ Gang/Family</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex gap-4 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-1.5 text-sm rounded-md font-bold transition-colors ${formData.orgType === 'GANG' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'GANG'})}
              >
                GANG
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-sm rounded-md font-bold transition-colors ${formData.orgType === 'FAMILY' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setFormData({...formData, orgType: 'FAMILY'})}
              >
                FAMILY
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="à¸Šà¸·à¹ˆà¸­à¹à¸à¹Šà¸‡ / à¹à¸Ÿà¸¡à¸´à¸¥à¸µà¹ˆ" 
                required
                value={formData.orgName}
                onChange={e => {
                  const val = e.target.value.replace(/[^A-Za-z0-9\s\-_.]/g, '').toUpperCase();
                  setFormData({...formData, orgName: val});
                }}
              />
              <Input 
                label="à¸œà¸¹à¹‰à¹à¸ˆà¹‰à¸‡ (à¸Šà¸·à¹ˆà¸­à¹ƒà¸™à¹€à¸à¸¡)" 
                required
                value={formData.requester}
                onChange={e => setFormData({...formData, requester: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <label className="text-sm font-medium text-slate-300 ml-1">à¹€à¸¥à¸·à¸­à¸à¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸—à¸³ (à¸ªà¸²à¸¡à¸²à¸£à¸–à¹€à¸¥à¸·à¸­à¸à¹„à¸”à¹‰à¸«à¸¥à¸²à¸¢à¸‚à¹‰à¸­)</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.changeInfo ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.changeInfo} onChange={e => setFormData({...formData, changeInfo: e.target.checked})} />
                  <Buildings size={20} className={formData.changeInfo ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.changeInfo ? 'text-white' : 'text-slate-300'}`}>à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Gang (500,000 $)</span>
                  {formData.changeInfo && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.editTexture ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.editTexture} onChange={e => setFormData({...formData, editTexture: e.target.checked})} />
                  <Palette size={20} className={formData.editTexture ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.editTexture ? 'text-white' : 'text-slate-300'}`}>à¹à¸à¹‰à¹„à¸‚ Texture à¹€à¸ªà¸·à¹‰à¸­à¸œà¹‰à¸² (500,000 $ / à¸Šà¸¸à¸”)</span>
                  {formData.editTexture && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.addCloth ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.addCloth} onChange={e => setFormData({...formData, addCloth: e.target.checked})} />
                  <TShirt size={20} className={formData.addCloth ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.addCloth ? 'text-white' : 'text-slate-300'}`}>à¸¥à¸‡à¸Šà¸¸à¸”à¹€à¸žà¸´à¹ˆà¸¡ (500,000 $ / à¸Šà¸¸à¸”)</span>
                  {formData.addCloth && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all ${formData.bulkChange ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.bulkChange} onChange={e => setFormData({...formData, bulkChange: e.target.checked})} />
                  <Buildings size={20} className={formData.bulkChange ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.bulkChange ? 'text-white' : 'text-slate-300'}`}>à¹€à¸«à¸¡à¸²à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Gang (1,500,000 $)</span>
                  {formData.bulkChange && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-all sm:col-span-2 ${formData.addAccessory ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={formData.addAccessory} onChange={e => setFormData({...formData, addAccessory: e.target.checked})} />
                  <TShirt size={20} className={formData.addAccessory ? 'text-pink-500' : 'text-slate-400'} />
                  <span className={`font-medium ${formData.addAccessory ? 'text-white' : 'text-slate-300'}`}>à¸¥à¸‡ Accessories Adons à¹€à¸ªà¸£à¸´à¸¡ (1,000,000 $)</span>
                  {formData.addAccessory && <CheckCircle size={16} weight="fill" className="text-pink-500 ml-auto" />}
                </label>
              </div>
            </div>

            {/* Conditional Inputs */}
            {(formData.changeInfo || formData.bulkChange || formData.editTexture || formData.addCloth || formData.addAccessory) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 bg-slate-900/50 p-4 rounded-xl">
                {formData.editTexture && (
                  <Input 
                    type="number" 
                    min="1" 
                    label="à¸ˆà¸³à¸™à¸§à¸™à¹€à¸—à¸à¹€à¸ˆà¸­à¸£à¹Œà¸—à¸µà¹ˆà¹à¸à¹‰" 
                    value={formData.textureCount}
                    onChange={e => setFormData({...formData, textureCount: parseInt(e.target.value) || 1})}
                  />
                )}
                {formData.addCloth && (
                  <Input 
                    type="number" 
                    min="1" 
                    label="à¸ˆà¸³à¸™à¸§à¸™à¸Šà¸¸à¸”à¸—à¸µà¹ˆà¹€à¸žà¸´à¹ˆà¸¡" 
                    value={formData.clothCount}
                    onChange={e => setFormData({...formData, clothCount: parseInt(e.target.value) || 1})}
                  />
                )}
                {(formData.changeInfo || formData.bulkChange) && (
                  <>
                    <Input 
                      label="Logo Link à¹ƒà¸«à¸¡à¹ˆ" 
                      placeholder="à¹ƒà¸ªà¹ˆ URL à¸£à¸¹à¸›à¹‚à¸¥à¹‚à¸à¹‰"
                      value={formData.logoUrl}
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                      error={formData.logoUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(formData.logoUrl) && !formData.logoUrl.includes('discordapp.') ? 'à¸¥à¸´à¸‡à¸à¹Œà¸£à¸¹à¸›à¸ à¸²à¸žà¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡' : ''}
                    />
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-slate-300 ml-1 block mb-1">à¸ªà¸µà¸›à¸£à¸°à¸ˆà¸³à¹à¸à¹Šà¸‡ (à¹ƒà¸«à¸¡à¹ˆ)</label>
                      <div className="flex gap-2 h-11">
                        <div 
                          className="h-full w-12 border border-slate-700 rounded shadow-inner"
                          style={{ backgroundColor: formData.hexColor || '#000000' }}
                        />
                        <Input 
                          className="flex-1"
                          placeholder="#000000"
                          value={formData.hexColor}
                          onChange={e => {
                            const val = e.target.value.replace(/[^A-Za-z0-9#]/g, '');
                            setFormData({...formData, hexColor: val});
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <Input 
                label="à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡ (à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸•à¸´à¸”à¸•à¹ˆà¸­ / à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸)" 
                value={formData.extraDetails}
                onChange={e => setFormData({...formData, extraDetails: e.target.value})}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">à¸ªà¸ à¸²à¸œà¸¹à¹‰à¸£à¸±à¸šà¹€à¸£à¸·à¹ˆà¸­à¸‡</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={formData.councilStaffId}
                  onChange={e => setFormData({...formData, councilStaffId: e.target.value})}
                  required
                >
                  <option value="" disabled>-- à¹€à¸¥à¸·à¸­à¸à¸Šà¸·à¹ˆà¸­à¸ªà¸ à¸² --</option>
                  {councilMembers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              <PaperPlaneTilt size={20} weight="bold" /> à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸ªà¹ˆà¸‡à¸„à¸³à¸£à¹‰à¸­à¸‡
            </Button>
          </form>
        </Card>

        {/* Preview */}
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Live Document</h3>
          
          <div ref={captureRef} className="bg-slate-100 rounded-xl p-8 border border-slate-300 shadow-2xl relative overflow-hidden" style={{ color: '#1e293b' }}>
            <div className="flex flex-row items-end justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex flex-col justify-end">
                <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ color: '#000', lineHeight: '1.1' }}>
                  {formData.orgName || 'ORGANIZATION'}
                </h2>
                <div className="text-slate-500 font-bold tracking-wider text-sm mt-1 whitespace-nowrap w-max">
                  <span>{formData.orgType} MODIFICATION</span>
                </div>
              </div>
              {(formData.changeInfo || formData.bulkChange) && formData.logoUrl && (
                <div className="ml-4 shrink-0">
                  <img src={formData.logoUrl} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md rounded" crossOrigin="anonymous"/>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Requester</div>
                <div className="font-bold text-lg">{formData.requester || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Theme Color (New)</div>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <div className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: formData.hexColor }}></div>
                  {formData.hexColor}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">Requested Changes</div>
              <ul className="text-sm space-y-2 list-none pl-0 text-slate-700 font-medium">
                {formData.changeInfo && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">âœ… à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Gang</span> <span>$500,000</span></li>}
                {formData.editTexture && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">âœ… à¹à¸à¹‰à¹„à¸‚ Texture à¹€à¸ªà¸·à¹‰à¸­à¸œà¹‰à¸² ({formData.textureCount} à¸Šà¸¸à¸”)</span> <span>${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}</span></li>}
                {formData.addCloth && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">âœ… à¸¥à¸‡à¸Šà¸¸à¸”à¹€à¸žà¸´à¹ˆà¸¡ ({formData.clothCount} à¸Šà¸¸à¸”)</span> <span>${(500000 * Math.max(1, formData.clothCount)).toLocaleString()}</span></li>}
                {formData.bulkChange && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">âœ… à¹€à¸«à¸¡à¸²à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Gang</span> <span>$1,500,000</span></li>}
                {formData.addAccessory && <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"><span className="whitespace-nowrap">âœ… à¸¥à¸‡ Accessories Adons à¹€à¸ªà¸£à¸´à¸¡</span> <span>$1,000,000</span></li>}
                {!formData.changeInfo && !formData.editTexture && !formData.addCloth && !formData.bulkChange && !formData.addAccessory && (
                  <li className="text-slate-400 italic">No changes selected</li>
                )}
              </ul>
            </div>

            {formData.extraDetails && (
              <div className="mb-8 p-4 bg-slate-200/50 rounded-lg border border-slate-300">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Extra Details / Remarks</div>
                <div className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {formData.extraDetails}
                </div>
              </div>
            )}

            <div className="flex justify-between items-end pt-4 mt-4 border-t-2 border-slate-300">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Total Fees</div>
                <div className="text-3xl font-black text-emerald-600">${calculateTotal().toLocaleString()}</div>
              </div>
              
              <div className="text-center w-40">
                <div className="border-b border-slate-800 pb-1 font-medium">{councilMembers.find(c => c.id === formData.councilStaffId)?.name || '...'}</div>
                <div className="text-xs mt-1">Council Inspector</div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="à¸¢à¸·à¸™à¸¢à¸±à¸™à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹à¸à¹‰à¹„à¸‚à¸­à¸‡à¸„à¹Œà¸à¸£?"
        message={`à¸„à¸¸à¸“à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸‚à¸­à¸‡à¹à¸à¹Šà¸‡ ${formData.orgName} à¹ƒà¸Šà¹ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ? à¹‚à¸›à¸£à¸”à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹ƒà¸«à¹‰à¹à¸™à¹ˆà¹ƒà¸ˆ`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
