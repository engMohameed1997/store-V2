'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, User, Phone, UserPlus, Loader2, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { MSG } from '@/lib/messages';
import { getFirebaseAuth, isFirebaseClientConfigured, normalizePhoneForFirebase } from '@/lib/firebase/client';
import { getFirebaseErrorMessage } from '@/lib/firebase/errors';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth';

type Step = 'form' | 'otp';

const RESEND_COOLDOWN = 60;

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading, setAuth } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

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
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const setupRecaptcha = useCallback(async () => {
    if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    await verifier.render();
    recaptchaVerifierRef.current = verifier;
    return verifier;
  }, []);

  const sendOtp = async (phoneNumber: string): Promise<ConfirmationResult> => {
    const auth = getFirebaseAuth();
    const verifier = await setupRecaptcha();
    const normalized = normalizePhoneForFirebase(phoneNumber);
    const result = await signInWithPhoneNumber(auth, normalized, verifier);
    setConfirmationResult(result);
    setCooldown(RESEND_COOLDOWN);
    return result;
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseClientConfigured()) {
      setError('تعذّر إرسال رمز التحقق. حاول مرة أخرى لاحقاً.');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone);
      setStep('otp');
      toast.success('تم إرسال رمز التحقق إلى هاتفك');
    } catch (err: unknown) {
      console.error('[Firebase OTP Error]', err);
      setError(getFirebaseErrorMessage(err));
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      await sendOtp(phone);
      toast.success('تم إعادة إرسال رمز التحقق');
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('أدخل الرمز المكوّن من 6 أرقام');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (!confirmationResult) {
        setError('انتهت الجلسة. أعد المحاولة.');
        setStep('form');
        return;
      }

      const userCredential = await confirmationResult.confirm(fullCode);
      const idToken = await userCredential.user.getIdToken();

      const result = await authClient.registerByPhone({
        phone: normalizePhoneForFirebase(phone),
        password,
        firstName,
        lastName,
        firebaseIdToken: idToken,
      });

      if (result.success && result.data?.user) {
        setAuth(result.data.user);
        toast.success('تم إنشاء الحساب بنجاح!');
        router.push('/');
      } else if (!result.success) {
        setError(result.error.message || MSG.auth.registerFailed);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        try { await signOut(getFirebaseAuth()); } catch { /* ignore */ }
      } else {
        setError(MSG.auth.registerFailed);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        try { await signOut(getFirebaseAuth()); } catch { /* ignore */ }
      }
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      try { await signOut(getFirebaseAuth()); } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setOtp(['', '', '', '', '', '']);
    setError('');
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
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

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">الاسم الأول</label>
                <div className="relative">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="محمد"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pr-10 pl-3 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
                  />
                  <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">الاسم الأخير</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="أحمد"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">رقم الهاتف (عراقي)</label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  placeholder="07XXXXXXXXX"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
                />
                <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
                />
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{MSG.password.requirements}</p>
            </div>

            <div id="recaptcha-container" className="absolute -top-96 -left-96 w-1 h-1 overflow-hidden" />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              {loading ? 'جاري إرسال الرمز...' : 'إرسال رمز التحقق'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-foreground mb-2">تأكيد رقم الهاتف</h2>
            <p className="text-center text-muted-foreground text-sm mb-6">
              أدخل الرمز المكوّن من 6 أرقام المرسل إلى {phone}
            </p>

            <div className="flex justify-center gap-2 mb-6" dir="ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  aria-label={`رقم ${index + 1}`}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:bg-muted bg-background text-foreground"
                  disabled={loading}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <div id="recaptcha-container" className="flex justify-center min-h-[78px] mb-4" />

            <div className="text-center mb-6">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || cooldown > 0}
                className="text-sm text-muted-foreground hover:text-primary transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending
                  ? 'جاري الإرسال...'
                  : cooldown > 0
                    ? `إعادة الإرسال بعد ${cooldown} ثانية`
                    : 'إعادة إرسال الرمز'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </button>

            <button
              type="button"
              onClick={handleBackToForm}
              className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2"
            >
              <ArrowRight size={14} />
              العودة لتعديل البيانات
            </button>
          </form>
        )}

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
