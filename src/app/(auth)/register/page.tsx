'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Store } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { safeNext, withNext } from '@/lib/utils/safe-next';
import { GoogleSignInButton } from '@/components/store/google-sign-in';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

/** Sign-up is "Continue with Google": the account is created on first use. */
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(safeNext(next));
    }
  }, [isLoading, isAuthenticated, router, next]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
        <div className="bg-gradient-to-b from-primary/5 to-transparent px-8 pt-8 pb-6 text-center border-b border-border/50">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-3">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">إنشاء حساب</h1>
          <p className="text-muted-foreground text-sm mt-1">
            أنشئ حسابك بنقرة واحدة باستخدام حساب Google
          </p>
        </div>

        <div className="p-8">
          <GoogleSignInButton next={next} />

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              لديك حساب بالفعل؟{' '}
              <Link href={withNext('/login', next)} className="text-primary font-medium hover:underline transition">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
