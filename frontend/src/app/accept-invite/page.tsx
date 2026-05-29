'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Loader2, ShieldCheck, AlertCircle, Key, User } from 'lucide-react';

function AcceptInvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid or missing token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.acceptInvite({ token, password, name });
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <AlertCircle size={24} />
            <h1 className="text-xl font-bold">Invalid Invitation</h1>
          </div>
          <p className="text-slate-400 text-sm">
            The invitation link is missing a valid token. Please check the link or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 backdrop-blur-xl text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to CentraCRM!</h1>
          <p className="text-slate-400 text-sm mb-6">
            Your account has been created successfully. Redirecting you to login...
          </p>
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-emerald-400" size={24} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Accept Invitation</h1>
          <p className="text-slate-400 text-xs mt-1">Set up your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-11 py-3 text-sm outline-none focus:border-blue-500/50 transition-all font-medium"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Password</label>
            <div className="relative">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-11 py-3 text-sm outline-none focus:border-blue-500/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Confirm Password</label>
            <div className="relative">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-11 py-3 text-sm outline-none focus:border-blue-500/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Accept Invitation & Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={ 
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={24} />
          <p className="text-xs uppercase tracking-widest text-slate-500 font-black">Loading Invitation Portal...</p>
        </div>
      </div>
    }>
      <AcceptInvitePageContent />
    </Suspense>
  );
}
