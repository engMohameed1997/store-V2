'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-sm">

        {/* Header */}
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            تسجيل الدخول
          </h1>
          <p className="text-sm text-muted-foreground">
            أدخل بريدك الإلكتروني أو رقم هاتفك للمتابعة
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
          {/* Honeypot */}
          <div className="absolute opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
            <label htmlFor="website">Website</label>
            <input ref={honeypotRef} type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {/* Identifier Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="text"
                name="identifier"
                placeholder="name@example.com"
                required
                autoComplete="username"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                dir="ltr"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                كلمة المرور
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                required
                autoComplete="current-password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">ليس لديك حساب؟ </span>
          <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}