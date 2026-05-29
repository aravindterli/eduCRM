'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
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
  const [showPassword, setShowPassword] = React.useState(false);
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
    <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[16px] border border-black/6 shadow-sm text-[#1A1A1A] relative overflow-hidden">
        {/* Soft elegant background decorative accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#F5F1EB]/30 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="w-12 h-12 rounded-[10px] bg-[#1A1A1A] flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <Shield size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
            Centra CRM
          </h1>
          <p className="text-[#888] text-[13px] mt-1 font-semibold">Welcome Back. Please Enter Your Details.</p>
        </div>

        {error && (
          <div className="relative z-10 mb-6 p-4 bg-red-50 border border-red-100 rounded-[8px] flex items-center gap-3 text-red-700 text-xs font-semibold animate-shake">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBB]" size={16} />
              <input
                {...register('email')}
                type="email"
                placeholder="admin@centracrm.com"
                className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3.5 pl-11 pr-4 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] placeholder:text-[#BBB]"
              />
            </div>
            {errors.email && <p className="text-red-600 text-[10px] font-bold ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBB]" size={16} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] py-3.5 pl-11 pr-11 text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] placeholder:text-[#BBB]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BBB] hover:text-[#1A1A1A] transition-colors"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-600 text-[10px] font-bold ml-1">{errors.password.message}</p>}
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white py-3.5 rounded-[8px] font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In To Dashboard'}
            </button>
          </div>
        </form>

        <p className="relative z-10 text-center mt-8 text-[10px] font-bold text-[#BBB] uppercase tracking-widest leading-none">
          Secure Access · Centra CRM Version 1.0
        </p>
      </div>
    </div>
  );
}

