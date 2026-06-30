'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { MSG } from '@/lib/messages';
import { getFirebaseAuth, isFirebaseClientConfigured, normalizePhoneForFirebase } from '@/lib/firebase/client';
import { getFirebaseErrorMessage } from '@/lib/firebase/errors';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth';

type Step = 'phone' | 'otp';

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message && (e.message.includes('recaptcha') || e.message.includes('reCAPTCHA') || e.filename?.includes('recaptcha'))) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const setupRecaptcha = useCallback(async () => {
    if (recaptchaVerifierRef.current) {
      try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
      recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    await verifier.render();
    recaptchaVerifierRef.current = verifier;
    return verifier;
  }, []);

  const sendFirebaseOtp = async (phoneNumber: string): Promise<ConfirmationResult> => {
    const auth = getFirebaseAuth();
    const verifier = await setupRecaptcha();
    const normalized = normalizePhoneForFirebase(phoneNumber);
    try {
      const result = await signInWithPhoneNumber(auth, normalized, verifier);
      setConfirmationResult(result);
      setCooldown(RESEND_COOLDOWN);
      return result;
    } catch (err) {
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
        recaptchaVerifierRef.current = null;
      }
      const friendlyMsg = getFirebaseErrorMessage(err);
      throw new Error(friendlyMsg, { cause: err });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseClientConfigured()) {
      setError('تعذّر إرسال رمز التحقق. حاول مرة أخرى لاحقاً.');
      return;
    }

    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const phoneValue = fd.get('phone') as string;

    try {
      // Call backend to invalidate previous tokens (always returns generic message)
      await authClient.forgotPassword(phoneValue);
      // Send Firebase OTP to the phone number
      await sendFirebaseOtp(phoneValue);
      setPhone(phoneValue);
      setStep('otp');
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = pasted.split('');
      while (newOtp.length < 6) newOtp.push('');
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError(MSG.auth.otpInvalid);
      return;
    }

    if (!confirmationResult) {
      setError('انتهت الجلسة. أعد إرسال الرمز.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(otpCode);
      const idToken = await userCredential.user.getIdToken();

      // Sign out from Firebase — the user only verified their phone, they shouldn't stay signed in
      try { await signOut(getFirebaseAuth()); } catch { /* ignore */ }

      const result = await authClient.verifyResetOtp({
        phone: normalizePhoneForFirebase(phone),
        firebaseIdToken: idToken,
      });
      if (result.success) {
        if (result.data) {
          sessionStorage.setItem('reset_token', result.data.token);
          router.push('/reset-password');
        }
      } else {
        setError(result.error?.message || MSG.auth.otpInvalid);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      try { await signOut(getFirebaseAuth()); } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      await sendFirebaseOtp(phone);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div id="recaptcha-container" className="absolute -top-96 -left-96 w-1 h-1 overflow-hidden" />
      <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 ${step === 'phone' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              1
            </div>
            <span className="text-xs font-medium">رقم الهاتف</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-1.5 ${step === 'otp' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <span className="text-xs font-medium">التحقق</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {step === 'phone' && (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Phone size={26} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">نسيت كلمة المرور؟</h1>
              <p className="text-muted-foreground text-sm mt-1">أدخل رقم هاتفك لإرسال رمز التحقق</p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">رقم الهاتف</label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="07XXXXXXXXX"
                    required
                    dir="ltr"
                    className="w-full pr-10 pl-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-center text-lg tracking-wider"
                  />
                  <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={26} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">أدخل رمز التحقق</h1>
              <p className="text-muted-foreground text-sm mt-1">
                تم إرسال رمز من 6 أرقام إلى
              </p>
              <p className="text-foreground font-medium text-sm mt-0.5" dir="ltr">{phone}</p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    dir="ltr"
                    autoFocus={i === 0}
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                {loading ? 'جاري التحقق...' : 'تحقق'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">لم يصلك الرمز؟</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-primary font-medium hover:text-primary-dark transition text-sm disabled:opacity-60"
              >
                {resending
                  ? 'جاري الإرسال...'
                  : cooldown > 0
                    ? `إعادة الإرسال بعد ${cooldown} ثانية`
                    : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </>
        )}

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
