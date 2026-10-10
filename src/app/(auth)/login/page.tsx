'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UtensilsCrossed, Lock, Mail, ArrowRight, UserCheck, ChefHat, ShieldCheck } from 'lucide-react';
import { Role } from '@/types/database';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || undefined;
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(email, password, redirectParam);
    setLoading(false);

    if (res.success && res.user) {
      toast(`Welcome back, ${res.user.name}!`, 'success');
      
      const destination = res.redirectUrl || (
        res.user.role === Role.ADMIN
          ? '/admin/dashboard'
          : res.user.role === Role.STAFF
          ? '/staff/dashboard'
          : '/customer/dashboard'
      );
      router.push(destination);
    } else {
      setErrorMsg(res.error || 'Invalid credentials');
    }
  };

  const handleQuickLogin = async (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setErrorMsg('');
    setLoading(true);

    const res = await login(e, p, redirectParam);
    setLoading(false);

    if (res.success && res.user) {
      toast(`Welcome back, ${res.user.name}!`, 'success');
      
      const destination = res.redirectUrl || (
        res.user.role === Role.ADMIN
          ? '/admin/dashboard'
          : res.user.role === Role.STAFF
          ? '/staff/dashboard'
          : '/customer/dashboard'
      );
      router.push(destination);
    } else {
      setErrorMsg(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/25">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Sign In to QUICKBITE</h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Enter your campus credentials to manage orders and skip the lunch queue.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@quickbite.local"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm text-stone-900 outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm text-stone-900 outline-hidden transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2 disabled:bg-brand-400"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-stone-500">
          Don't have an account yet?{' '}
          <Link href="/register" className="font-bold text-brand-600 hover:underline">
            Register as Customer
          </Link>
        </div>
      </div>

      {/* Development Quick-Fill Accounts */}
      <div className="bg-stone-100/80 rounded-2xl border border-stone-200 p-4 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 text-center">
          Development Test Accounts (1-Click Instant Sign In)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin('customer@quickbite.local', 'Customer123!')}
            className="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition flex items-center gap-2 group disabled:opacity-60"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="truncate">
              <p className="font-bold text-stone-800 group-hover:text-brand-700">Customer</p>
              <p className="text-[10px] text-stone-500 truncate">customer@quickbite.local</p>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin('staff@quickbite.local', 'Staff123!')}
            className="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition flex items-center gap-2 group disabled:opacity-60"
          >
            <ChefHat className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <p className="font-bold text-stone-800 group-hover:text-brand-700">Staff (Central)</p>
              <p className="text-[10px] text-stone-500 truncate">staff@quickbite.local</p>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin('staff2@quickbite.local', 'Staff123!')}
            className="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition flex items-center gap-2 group disabled:opacity-60"
          >
            <ChefHat className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <p className="font-bold text-stone-800 group-hover:text-brand-700">Staff (Engg Hub)</p>
              <p className="text-[10px] text-stone-500 truncate">staff2@quickbite.local</p>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin('admin@quickbite.local', 'Admin123!')}
            className="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition flex items-center gap-2 group disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="truncate">
              <p className="font-bold text-stone-800 group-hover:text-brand-700">Admin Console</p>
              <p className="text-[10px] text-stone-500 truncate">admin@quickbite.local</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto my-12 text-center text-stone-400">Loading sign-in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
