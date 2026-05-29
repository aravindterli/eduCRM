'use client';

import React from 'react';
import { X, Plus, Trash2, Save, Layout, Type, List, CheckSquare, Hash, Globe, Image as ImageIcon } from 'lucide-react';
import { superadminService } from '@/services/superadmin.service';

interface TenantConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: any;
  onSuccess: () => void;
}

export const TenantConfigModal = ({ isOpen, onClose, tenant, onSuccess }: TenantConfigModalProps) => {
  const [loading, setLoading] = React.useState(false);
  const [config, setConfig] = React.useState({
    brandLogo: '',
    additionalDetails: '',
    customFields: [] as any[]
  });

  React.useEffect(() => {
    if (isOpen && tenant) {
      const tenantConfig = tenant.config || {};
      setConfig({
        brandLogo: tenantConfig.brandLogo || '',
        additionalDetails: tenantConfig.additionalDetails || '',
        customFields: tenantConfig.customFields || []
      });
    }
  }, [isOpen, tenant]);

  const addField = () => {
    setConfig({
      ...config,
      customFields: [...config.customFields, { name: '', label: '', type: 'text', required: false }]
    });
  };

  const removeField = (index: number) => {
    setConfig({
      ...config,
      customFields: config.customFields.filter((_, i) => i !== index)
    });
  };

  const updateField = (index: number, updates: any) => {
    const updatedFields = [...config.customFields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setConfig({ ...config, customFields: updatedFields });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PNG or JPEG file');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, brandLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await superadminService.updateTenant(tenant.id, {
        config: config
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white border border-black/8 rounded-[16px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-black/6 flex justify-between items-center bg-[#F9F7F4]">
          <div>
            <h2 className="text-md font-bold text-[#1A1A1A] tracking-tight">Configure {tenant.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Manage Form Fields, Branding, and Details
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-black/5 rounded-[8px] text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {/* Branding & Details Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider border-b border-black/5 pb-2">Branding & Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Brand Logo (PNG)</label>
                <div className="flex items-center gap-4">
                  {config.brandLogo && (
                    <div className="w-12 h-12 rounded-[8px] overflow-hidden border border-black/8 bg-[#F9F7F4] flex items-center justify-center">
                      <img src={config.brandLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 pl-12 pr-6 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] file:hidden cursor-pointer"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase pointer-events-none">
                      Click to Upload
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Additional Details</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    value={config.additionalDetails}
                    onChange={e => setConfig({ ...config, additionalDetails: e.target.value })}
                    placeholder="Notes, Address, or Other Info"
                    className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3 pl-12 pr-6 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Builder Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider border-b border-black/5 pb-2">Custom Form Fields</h3>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">These Fields Will Be Added to the Global Generic Template</p>
              </div>
              <button 
                onClick={addField}
                className="text-[10px] font-bold text-black uppercase tracking-widest hover:text-black/70 flex items-center gap-1"
              >
                <Plus size={14} /> Add Field
              </button>
            </div>

            <div className="space-y-3">
              {config.customFields.length === 0 ? (
                <div className="text-center py-10 bg-[#F9F7F4]/40 border border-dashed border-black/10 rounded-[12px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Custom Fields Added Yet</p>
                </div>
              ) : (
                config.customFields.map((field, idx) => (
                  <div key={idx} className="bg-[#F9F7F4] border border-black/6 rounded-[12px] p-4 flex gap-4 items-end group shadow-sm">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Label</label>
                        <input 
                          value={field.label}
                          onChange={e => updateField(idx, { label: e.target.value })}
                          placeholder="Field Label"
                          className="w-full bg-white border border-black/8 rounded-[8px] py-2 px-3 text-xs text-[#1A1A1A] outline-none focus:border-black/20 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Key (Slug)</label>
                        <input 
                          value={field.name}
                          onChange={e => updateField(idx, { name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_') })}
                          placeholder="field_key"
                          className="w-full bg-white border border-black/8 rounded-[8px] py-2 px-3 text-xs text-[#1A1A1A] outline-none focus:border-black/20 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Type</label>
                        <select 
                          value={field.type}
                          onChange={e => updateField(idx, { type: e.target.value })}
                          className="w-full bg-white border border-black/8 rounded-[8px] py-2 px-3 text-xs text-[#1A1A1A] outline-none focus:border-black/20 font-semibold cursor-pointer"
                        >
                          <option value="text">Text Input</option>
                          <option value="select">Dropdown</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="tel">Phone</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4 h-10">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={field.required}
                            onChange={e => updateField(idx, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-black/8 bg-white text-black focus:ring-0 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Required</span>
                        </label>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeField(idx)}
                      className="p-2.5 rounded-[8px] hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-black/6 bg-[#F9F7F4] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-black/5 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-black hover:bg-black/90 text-[#F5F1EB] px-8 py-2.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (
              <>
                <Save size={12} /> Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
