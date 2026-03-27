'use client';

import React from 'react';
import { X, User, Phone, Mail, MapPin, GraduationCap, Laptop, Send, Megaphone } from 'lucide-react';
import { useMarketingStore } from '@/store/useMarketingStore';

import { useLeadStore } from '@/store/useLeadStore';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeadForm = ({ isOpen, onClose }: LeadFormProps) => {
  const { addLead } = useLeadStore();
  const { campaigns, fetchCampaigns } = useMarketingStore();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    eduBackground: 'High School',
    interestedProgram: 'CS Engineering',
    leadSource: 'Direct',
    campaignId: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
    }
  }, [isOpen, fetchCampaigns]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Map form fields to schema fields
    const submissionData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      location: formData.location,
      eduBackground: formData.eduBackground,
      qualification: formData.interestedProgram, // Storing program name in qualification for now
      leadSource: formData.leadSource,
      campaignId: formData.campaignId || undefined,
    };

    const success = await addLead(submissionData);
    setLoading(false);
    if (success) {
      onClose();
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        eduBackground: 'High School',
        interestedProgram: 'CS Engineering',
        leadSource: 'Direct',
        campaignId: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl glass rounded-3xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Add New Lead</h2>
            <p className="text-xs text-muted-foreground text-foreground/60">Capture lead details for education admission</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Rahul Sharma" 
                  className="w-full bg-white/5 border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-foreground" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 00000 00000" 
                  className="w-full bg-white/5 border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-foreground" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  type="email"
                  placeholder="rahul@example.com" 
                  className="w-full bg-white/5 border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-foreground" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="City, State" 
                  className="w-full bg-white/5 border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-foreground" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Educational Background</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select 
                    name="eduBackground"
                    value={formData.eduBackground}
                    onChange={handleChange}
                    className="appearance-none w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all"
                  >
                    <option>High School</option>
                    <option>Undergraduate</option>
                    <option>Postgraduate</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Interested Program</label>
                <div className="relative">
                  <Laptop className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select 
                    name="interestedProgram"
                    value={formData.interestedProgram}
                    onChange={handleChange}
                    className="appearance-none w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all"
                  >
                    <option className="bg-slate-900">CS Engineering</option>
                    <option className="bg-slate-900">Data Science</option>
                    <option className="bg-slate-900">Business Management</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Lead Source</label>
                <div className="relative">
                   <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                   <select 
                     name="leadSource"
                     value={formData.leadSource}
                     onChange={handleChange}
                     className="appearance-none w-full bg-white/5 border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                   >
                     <option className="bg-background text-foreground">Direct</option>
                     <option className="bg-background text-foreground">Google Ads</option>
                     <option className="bg-background text-foreground">Facebook</option>
                     <option className="bg-background text-foreground">Instagram</option>
                     <option className="bg-background text-foreground">Referral</option>
                     <option className="bg-background text-foreground">Other</option>
                   </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Marketing Campaign (Optional)</label>
                <div className="relative">
                   <Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                   <select 
                     name="campaignId"
                     value={formData.campaignId}
                     onChange={handleChange}
                     className="appearance-none w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all"
                   >
                     <option value="" className="bg-slate-900">None / No Campaign</option>
                     {campaigns.map(c => (
                       <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-white/[0.02] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 px-8 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send size={16} />
                Submit Lead
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
