'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { User, Phone, Mail, GraduationCap, Send, CheckCircle2, ChevronLeft, Calendar, Clock } from 'lucide-react';

export default function WebinarRegistrationPage() {
  const { id } = useParams();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [webinar, setWebinar] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    email: '',
    eduBackground: 'High School',
  });

  // Fetch Webinar Details Publicly
  React.useEffect(() => {
    const fetchWebinarDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webinars/${id}/public`);
        if (res.ok) {
          const data = await res.json();
          setWebinar(data);
        } else {
          setError('Webinar not found or already concluded.');
        }
      } catch (err) {
        console.error('Failed to fetch webinar', err);
        setError('Connection error. Please try again later.');
      }
    };
    if (id) fetchWebinarDetails();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webinars/${id}/register-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        alert(err.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="glass p-12 rounded-[40px] border-white/10 text-center space-y-6 max-w-md w-full">
          <div className="text-red-400 text-xl font-bold">{error}</div>
          <p className="text-slate-400 text-sm">The link might be expired or incorrect.</p>
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

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b,transparent)] opacity-20" />
        <div className="relative glass p-12 rounded-[40px] border-white/10 max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_-12px] shadow-emerald-500/40">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white">Registered!</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              Success! You are now registered for <strong>{webinar?.title}</strong>. A confirmation email with the meeting link will be sent to your inbox shortly.
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

  if (!webinar) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500">
          <Calendar size={24} className="animate-bounce" />
        </div>
        <div className="text-slate-500 font-black tracking-[4px] uppercase text-xs">Fetching Details...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 p-8 lg:py-24 items-start">
        {/* Left Content */}
        <div className="space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-[3px]">
            Upcoming Live Session
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-white">
              {webinar.title}
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed font-medium">
              {webinar.description}
            </p>
          </div>

          <div className="space-y-6 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-400 group-hover:border-blue-500/30 transition-all">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Date</p>
                <p className="text-xl font-bold text-white">
                  {new Date(webinar.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Time</p>
                <p className="text-xl font-bold text-white">
                  {new Date(webinar.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="glass p-1 rounded-[40px] border-white/10 shadow-2xl relative">
          <div className="bg-[#0f172a] rounded-[38px] p-8 lg:p-12 space-y-10">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-white tracking-tight">Reserve Your Spot</h3>
              <p className="text-slate-500 text-sm font-medium">Join us live and ask your questions directly to our experts.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex: David Miller"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white placeholder:text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+1 000 000 0000"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white placeholder:text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      type="email"
                      placeholder="david@example.com"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white placeholder:text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Current Academic Background</label>
                  <div className="relative group">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <select
                      name="eduBackground"
                      value={formData.eduBackground}
                      onChange={handleChange}
                      className="appearance-none w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm outline-none focus:border-blue-500/30 transition-all text-white"
                    >
                      <option className="bg-slate-950">High School</option>
                      <option className="bg-slate-950">Undergraduate</option>
                      <option className="bg-slate-950">Postgraduate</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 py-6 rounded-[24px] text-white font-black uppercase tracking-[3px] shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (
                  <>
                    Secure My Seat
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-12 border-t border-white/5 mt-auto bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-loose">© 2026 EduCRM Global. Empowering students worldwide through expertise.</p>
          <div className="flex gap-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms of Experience</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
