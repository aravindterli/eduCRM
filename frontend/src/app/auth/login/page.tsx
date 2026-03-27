'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md glass p-8 rounded-3xl border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl group-hover:bg-indigo-600/30 transition-all duration-700" />

        <div className="relative z-10 text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
            Welcome to EduCRM
          </h1>
          <p className="text-slate-400 text-sm">Sign in to manage your education platform</p>
        </div>

        {error && (
          <div className="relative z-10 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-shake">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                {...register('email')}
                type="email"
                placeholder="admin@educrm.com"
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-blue-500/50 focus:ring-4 ring-blue-500/10 transition-all"
              />
            </div>
            {errors.email && <p className="text-destructive text-[10px] ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-blue-500/50 focus:ring-4 ring-blue-500/10 transition-all"
              />
            </div>
            {errors.password && <p className="text-destructive text-[10px] ml-1">{errors.password.message}</p>}
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group-active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In to Account'}
          </button>
        </form>

        <p className="relative z-10 text-center mt-8 text-xs text-slate-500">
          Secure enterprise authentication. Protected by EduCRM Shield.
        </p>
      </div>
    </div>
  );
}
