'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, User, Phone, UserPlus, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { MSG } from '@/lib/messages';

type Mode = 'email' | 'phone';

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('email');
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const firstName = fd.get('firstName') as string;
    const lastName = fd.get('lastName') as string;
    const password = fd.get('password') as string;

    try {
      const result = mode === 'email'
        ? await authClient.registerByEmail({ firstName, lastName, email: fd.get('email') as string, password })
        : await authClient.registerByPhone({ firstName, lastName, phone: fd.get('phone') as string, password });

      if (result.success) {
        toast.success(MSG.auth.registerSuccess);
        if (mode === 'email') {
          router.push('/verify-email');
        } else {
          router.push(`/verify-phone?phone=${encodeURIComponent(fd.get('phone') as string)}`);
        }
      } else if (!result.success) {
        setError(result.error.message || MSG.auth.registerFailed);
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
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-foreground">تسجيل حساب جديد</h1>
          <p className="text-muted-foreground text-sm mt-1">انضم إلينا واستمتع بأفضل العروض</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-1 rounded-xl bg-muted p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('email')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'email' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail size={14} />
            بريد إلكتروني
          </button>
          <button
            type="button"
            onClick={() => setMode('phone')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'phone' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Phone size={14} />
            رقم هاتف
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">الاسم الأول</label>
              <div className="relative">
                <input type="text" name="firstName" placeholder="محمد" required className="w-full pr-10 pl-3 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition" />
                <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">الاسم الأخير</label>
              <input type="text" name="lastName" placeholder="أحمد" required className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition" />
            </div>
          </div>

          {mode === 'email' ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">البريد الإلكتروني</label>
              <div className="relative">
                <input type="email" name="email" placeholder="example@mail.com" required dir="ltr" className="w-full pr-10 pl-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition" />
                <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">رقم الهاتف (عراقي)</label>
              <div className="relative">
                <input type="tel" name="phone" placeholder="07XXXXXXXXX" required dir="ltr" className="w-full pr-10 pl-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition" />
                <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">كلمة المرور</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} name="password" placeholder="••••••••" required dir="ltr" className="w-full pr-10 pl-10 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition" />
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{MSG.password.requirements}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-primary font-medium hover:text-primary-dark transition">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
