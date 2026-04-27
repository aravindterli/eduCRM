'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Phone, Mail, MapPin, GraduationCap, Laptop, Send, CheckCircle2, ChevronLeft, Sparkles, Globe, ShieldCheck } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';

export default function ApplyPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [programs, setPrograms] = React.useState<any[]>([]);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    eduBackground: 'High School',
    interestedProgramId: '',
    leadSource: 'Website'
  });

  // Fetch Public Programs
  React.useEffect(() => {
    const fetchPublicPrograms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs/public`);
        if (res.ok) {
          const data = await res.json();
          setPrograms(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, interestedProgramId: data[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch programs', err);
      }
    };
    fetchPublicPrograms();
  }, []);

  // Pre-fill from URL
  React.useEffect(() => {
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    if (email) setFormData(prev => ({ ...prev, email }));
    if (name) setFormData(prev => ({ ...prev, name }));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          qualification: programs.find(p => p.id === formData.interestedProgramId)?.name || 'N/A'
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        alert(err.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Submission error', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b,transparent)] opacity-20" />
        <div className="relative glass p-12 rounded-[40px] border-white/10 max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_-12px] shadow-emerald-500/40">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white">Application Received!</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              Thank you for choosing CentraCRM. Your profile has been prioritized, and our chief assignedTo will reach out to you within the next 24 hours.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white/5 hover:bg-white/10 py-4 rounded-2xl text-blue-400 font-bold transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft size={18} />
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 p-8 lg:py-24 items-center">
        {/* Left Content */}
        <div className="space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[3px]">
            <Sparkles size={14} />
            Admissions Open 2026
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white">
              Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Global</span> Future.
            </h1>
            <p className="text-xl text-slate-400 max-w-md leading-relaxed font-medium">
              Join a community of 50,000+ students achieving their academic dreams across 12 countries.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Globe size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Top Programs</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">CS, Business, and Data Science from Global Universities.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Verified Path</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">100% success rate in admission guidance.</p>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="glass p-1 rounded-[40px] border-white/10 shadow-2xl relative">
          <div className="bg-[#0f172a] rounded-[38px] p-8 lg:p-12 space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Application Form</h3>
              <p className="text-slate-500 text-sm font-medium">Please fill in your details for a free counseling session.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex: David Miller"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+1 000 000 0000"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      type="email"
                      placeholder="david@example.com"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Location</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="City, Country"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Program</label>
                <div className="relative group">
                  <Laptop className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <select
                    name="interestedProgramId"
                    value={formData.interestedProgramId}
                    onChange={handleChange}
                    className="appearance-none w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Background</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <select
                    name="eduBackground"
                    value={formData.eduBackground}
                    onChange={handleChange}
                    className="appearance-none w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                  >
                    <option className="bg-slate-900">High School</option>
                    <option className="bg-slate-900">Undergraduate</option>
                    <option className="bg-slate-900">Postgraduate</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-5 rounded-[20px] text-white font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (
                  <>
                    Submit Application
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-8 border-t border-white/5 mt-auto bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex flex-col md:row-auto justify-between items-center gap-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">© 2026 CentraCRM Global. All rights reserved.</p>
          <div className="flex gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
