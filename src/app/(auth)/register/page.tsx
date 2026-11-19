'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, User, Mail, UserPlus, Loader2, ShieldCheck, ArrowRight, KeyRound, Check, X, Store } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { apiErrorMessage } from '@/lib/client/api';
import { useAuth } from '@/components/providers/auth-provider';
import { MSG } from '@/lib/messages';
import { safeNext, withNext } from '@/lib/utils/safe-next';

type Step = 'form' | 'otp';

const RESEND_COOLDOWN = 60;

const PASSWORD_CHECKS = [
  { label: 'حرف كبير (A-Z)', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'حرف صغير (a-z)', test: (v: string) => /[a-z]/.test(v) },
  { label: 'رقم (0-9)', test: (v: string) => /\d/.test(v) },
  { label: 'رمز خاص (!@#$...)', test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
  { label: '8 أحرف على الأقل', test: (v: string) => v.length >= 8 },
];

function getMissingRequirements(pwd: string): string[] {
  return PASSWORD_CHECKS.filter((c) => !c.test(pwd)).map((c) => c.label);
}

const inputClass =
  'w-full pr-10 pl-10 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm';
const inputClassNoIcon =
  'w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm';

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

function RegisterContent() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const { isAuthenticated, isLoading, setAuth } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(safeNext(next));
    }
  }, [isLoading, isAuthenticated, router, next]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const resetOtp = () => {
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    const failedCheck = PASSWORD_CHECKS.find((c) => !c.test(password));
    if (failedCheck) {
      setError(`كلمة المرور يجب أن تحتوي على: ${failedCheck.label}`);
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.register({ email, password, confirmPassword, firstName, lastName });
      if (!result.success) {
        setError(apiErrorMessage(result.error, MSG.auth.registerFailed));
        return;
      }
      setRegistrationToken(result.data.registrationToken);
      setEmail(result.data.email);
      setCooldown(RESEND_COOLDOWN);
      setStep('otp');
      toast.success('أرسلنا رمز التحقق إلى بريدك الإلكتروني');
    } catch {
      setError(MSG.common.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resending || cooldown > 0 || !registrationToken) return;
    setResending(true);
    setError('');
    try {
      const result = await authClient.resendCode(registrationToken);
      if (!result.success) {
        setError(apiErrorMessage(result.error, 'تعذّر إرسال رمز التحقق. حاول لاحقاً.'));
        return;
      }
      setCooldown(RESEND_COOLDOWN);
      resetOtp();
      toast.success('تم إعادة إرسال رمز التحقق');
    } catch {
      setError(MSG.common.networkError);
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
    if (!registrationToken) {
      setError('انتهت الجلسة. أعد المحاولة.');
      setStep('form');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authClient.verifyEmail(registrationToken, fullCode);
      if (result.success && result.data?.user) {
        setAuth(result.data.user);
        toast.success('تم إنشاء الحساب بنجاح!');
        router.replace(safeNext(next));
      } else {
        setError(result.success ? MSG.auth.registerFailed : apiErrorMessage(result.error, MSG.auth.registerFailed));
        resetOtp();
      }
    } catch {
      setError(MSG.common.networkError);
      resetOtp();
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setRegistrationToken(null);
  };

  const missing = password ? getMissingRequirements(password) : [];

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent px-8 pt-8 pb-6 text-center border-b border-border/50">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-3">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 'form' ? 'إنشاء حساب' : 'تأكيد البريد الإلكتروني'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'form' ? 'انضم إلينا واستمتع بأفضل العروض' : 'أدخل الرمز المرسل إلى بريدك الإلكتروني'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <X size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الاسم الأول</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="محمد"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                    />
                    <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الاسم الأخير</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="أحمد"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClassNoIcon}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="example@gmail.com"
                    required
                    dir="ltr"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                  <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password && missing.length > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                    كلمة المرور تحتاج: {missing.join('، ')}
                  </p>
                )}
                {!password && (
                  <p className="text-xs text-muted-foreground mt-1.5">{MSG.password.requirements}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} ${confirmPassword && confirmPassword !== password ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : confirmPassword && confirmPassword === password ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' : ''}`}
                  />
                  <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {confirmPassword && confirmPassword === password && (
                    <Check size={18} className="absolute left-10 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <X size={12} /> كلمتا المرور غير متطابقتين
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                {loading ? 'جاري إرسال الرمز...' : 'إرسال رمز التحقق'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
              </div>

              <p className="text-center text-muted-foreground text-sm mb-6">
                أدخل الرمز المكوّن من 6 أرقام المرسل إلى{' '}
                <span className="font-semibold text-foreground" dir="ltr">{email}</span>
              </p>
              <p className="text-center text-muted-foreground text-xs -mt-4 mb-6">
                لم تجد الرسالة؟ تحقق من مجلد البريد المزعج (Spam).
              </p>

              <div className="flex justify-center gap-2 sm:gap-3 mb-6" dir="ltr">
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
                    className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all disabled:opacity-50 disabled:bg-muted bg-background text-foreground ${digit ? 'border-primary/50 bg-primary/5' : 'border-border'} focus:border-primary focus:ring-2 focus:ring-primary/20`}
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <div className="text-center mb-6">
                <button
                  type="button"
                  onClick={handleResendCode}
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
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
