'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { MSG } from '@/lib/messages';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'form' | 'success'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const token = (fd.get('token') as string).trim();

    try {
      const result = await authClient.verifyEmail(token);
      if (result.success) {
        setStatus('success');
      } else if (!result.success) {
        setError(result.error.message || MSG.common.unexpected);
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
          <h1 className="text-xl font-bold text-foreground mb-2">{MSG.auth.verifyEmailSuccess}</h1>
          <p className="text-muted-foreground text-sm mb-6">يمكنك الآن تسجيل الدخول.</p>
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
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-2">تأكيد البريد الإلكتروني</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">أدخل رمز التحقق الذي تم إرساله إلى بريدك الإلكتروني</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">رمز التحقق</label>
            <input
              type="text"
              name="token"
              placeholder="أدخل رمز التحقق"
              required
              dir="ltr"
              autoComplete="one-time-code"
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
            {loading ? 'جاري التحقق...' : 'تأكيد البريد'}
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
