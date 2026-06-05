'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { MSG } from '@/lib/messages';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'form' | 'success'>('form');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const fd = new FormData(e.currentTarget);
    const token = fd.get('token') as string;
    const password = fd.get('newPassword') as string;
    const confirmPassword = fd.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError(MSG.auth.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({ token, password });
      if (result.success) {
        setStatus('success');
      } else if (!result.success) {
        setError(result.error.message || MSG.auth.resetLinkInvalid);
      }
    } catch {
      setError(MSG.common.unexpected);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{MSG.auth.resetSuccess}</h1>
          <p className="text-muted-foreground text-sm mb-6">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark transition"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-foreground">إعادة تعيين كلمة المرور</h1>
          <p className="text-muted-foreground text-sm mt-1">أدخل رمز الاستعادة وكلمة المرور الجديدة</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">رمز الاستعادة</label>
            <input
              type="text"
              name="token"
              placeholder="أدخل رمز الاستعادة"
              required
              dir="ltr"
              autoComplete="one-time-code"
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                name="newPassword"
                placeholder="••••••••"
                required
                minLength={8}
                dir="ltr"
                autoComplete="new-password"
                className="w-full pr-10 pl-10 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
              />
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{MSG.password.requirements}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">تأكيد كلمة المرور</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="••••••••"
                required
                minLength={8}
                dir="ltr"
                autoComplete="new-password"
                className="w-full pr-10 pl-10 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
              />
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
            <ArrowRight size={14} />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
