'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { MSG } from '@/lib/messages';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const identifier = fd.get('identifier') as string;

    try {
      const result = await authClient.forgotPassword(identifier);
      if (result.success) {
        setSent(true);
      } else if (!result.success) {
        setError(result.error.message || MSG.common.unexpected);
      }
    } catch {
      setError(MSG.common.unexpected);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">تم إرسال رابط إعادة التعيين</h1>
          <p className="text-muted-foreground text-sm mb-6">{MSG.auth.resetLinkSent}</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-dark transition text-sm">
            <ArrowRight size={16} />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-foreground">نسيت كلمة المرور؟</h1>
          <p className="text-muted-foreground text-sm mt-1">أدخل بريدك الإلكتروني أو رقم هاتفك وسنرسل لك رابط إعادة التعيين</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">البريد الإلكتروني أو رقم الهاتف</label>
            <div className="relative">
              <input
                type="text"
                name="identifier"
                placeholder="user@example.com أو 07XXXXXXXXX"
                required
                className="w-full pr-10 pl-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
                dir="ltr"
              />
              <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
            {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
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
