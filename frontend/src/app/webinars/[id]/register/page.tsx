'use client';

import React from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle2, ChevronRight, Loader2, Sparkles, User, Mail, Phone, GraduationCap, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { useParams } from 'next/navigation';

export default function WebinarRegistrationPage() {
  const { id } = useParams();
  const [webinar, setWebinar] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    eduBackground: '',
  });

  React.useEffect(() => {
    const fetchWebinar = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/webinars/${id}/public`);
        setWebinar(res.data);
      } catch (err) {
        setError('Webinar not found or no longer available.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWebinar();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/webinars/${id}/register-public`, formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error && !webinar) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
          <Calendar size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
        <p className="text-slate-400 max-w-md">{error}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full glass p-10 rounded-[2.5rem] border-white/5 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Registration Successful!</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            We've reserved your spot for <span className="text-white font-semibold">"{webinar.title}"</span>.
            Check your email for the joining instructions.
          </p>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-left space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Calendar size={16} className="text-blue-400" />
              {new Date(webinar.date).toLocaleDateString('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' })}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Clock size={16} className="text-blue-400" />
              {new Date(webinar.date).toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="p-3 bg-white rounded-2xl shadow-inner">
              <QRCodeCanvas
                id="webinar-qr-success"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/webinars/${id}/register`}
                size={140}
                level={"H"}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">scan to share with others</p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white/5 hover:bg-white/10 py-4 rounded-2xl text-blue-400 font-bold transition-all flex items-center justify-center gap-2"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left Column: Info */}
          <div className="space-y-10 animate-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
              <Sparkles size={14} /> Upcoming Live Webinar
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                {webinar.title}
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed font-light">
                {webinar.description || "Join us for an exclusive session designed to help you navigate the next steps in your educational journey. Expert insights, live Q&A, and more."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-colors group">
                <Calendar className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-1">Date</h3>
                <p className="text-lg font-bold">{new Date(webinar.date).toLocaleDateString('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-colors group">
                <Clock className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-1">Time</h3>
                <p className="text-lg font-bold">{new Date(webinar.date).toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-2 pl-6 bg-white/5 rounded-2xl border border-white/5 w-fit">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#050505] bg-slate-800 flex items-center justify-center text-[10px] font-bold`}>
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400 pr-6">
                Joined by <span className="text-white font-bold">{webinar._count?.registrations + 120}+</span> others
              </p>
            </div>

            <div className="pt-10 space-y-4">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                <QrCode size={14} className="text-purple-500" /> scan to join from mobile
              </div>
              <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] w-fit group hover:border-purple-500/30 transition-all">
                <div className="p-3 bg-white rounded-2xl">
                  <QRCodeCanvas
                    id="webinar-qr-sidebar"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/webinars/${id}/register`}
                    size={140}
                    level={"H"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative animate-in slide-in-from-right-8 duration-700">
            <div className="absolute inset-0 bg-blue-600/20 blur-[80px] rounded-full opacity-50 pointer-events-none" />

            <div className="relative glass p-8 lg:p-12 rounded-[3.5rem] border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold mb-2">Reserve Your Seat</h2>
              <p className="text-slate-500 text-sm mb-10">Only a few spots left for this exclusive event.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                    <User size={18} className="absolute left-4 top-4 text-slate-600" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                      />
                      <Mail size={18} className="absolute left-4 top-4 text-slate-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 890"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                      />
                      <Phone size={18} className="absolute left-4 top-4 text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Educational Background</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.eduBackground}
                      onChange={e => setFormData({ ...formData, eduBackground: e.target.value })}
                      placeholder="e.g. High School Senior, Graduate"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                    <GraduationCap size={18} className="absolute left-4 top-4 text-slate-600" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-xs font-bold animate-shake">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Register for Free <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-600 px-8">
                  By registering, you agree to our terms of service and consent to receive event-related communications.
                </p>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex items-center justify-between text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
        <div>Powered by Foundrys</div>
      </footer>
    </div>
  );
}
