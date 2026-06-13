'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { MSG } from '@/lib/messages';

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (honeypotRef.current?.value) {
      setError(MSG.common.unexpected);
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    try {
      const result = await login({
        identifier,
        password,
        deviceName: (formData.get('deviceName') as string) || undefined,
        deviceId: (formData.get('deviceId') as string) || undefined,
      });

      if (result.success) {
        toast.success(MSG.auth.loginSuccess);
        router.push('/');
      } else {
        setError(result.message || MSG.auth.invalidCredentials);
        setLoading(false);
      }
    } catch {
      setError(MSG.common.unexpected);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👤</div>
          <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="text-muted-foreground text-sm mt-1">أهلاً بك مجدداً! سجل دخولك للمتابعة</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {/* Honeypot */}
          <div className="absolute opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
            <label htmlFor="website">Website</label>
            <input ref={honeypotRef} type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">البريد الإلكتروني أو رقم الهاتف</label>
            <div className="relative">
              <input
                type="text"
                name="identifier"
                placeholder="user@example.com أو 07XXXXXXXXX"
                required
                autoComplete="username"
                className="w-full pr-10 pl-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
                dir="ltr"
              />
              <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-dark transition">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pr-10 pl-10 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
                dir="ltr"
              />
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-primary font-medium hover:text-primary-dark transition">
              تسجيل حساب جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
