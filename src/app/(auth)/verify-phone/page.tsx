'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2, Phone, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/client/auth';
import { MSG } from '@/lib/messages';

const RESEND_COOLDOWN = 60;

function VerifyPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFromQuery = searchParams.get('phone') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [phone, setPhone] = useState(phoneFromQuery);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (phoneFromQuery) inputRefs.current[0]?.focus();
  }, [phoneFromQuery]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('أدخل الرمز المكوّن من 6 أرقام');
      return;
    }
    if (!phone.trim()) {
      setError('أدخل رقم الهاتف');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authClient.verifyPhone({ phone, code: fullCode });
      if (result.success) {
        router.push('/login?verified=true');
      } else if (!result.success) {
        setError(result.error.message || MSG.auth.otpInvalid);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError(MSG.common.unexpected);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (resending || cooldown > 0 || !phone.trim()) return;
    setResending(true);
    try {
      const result = await authClient.resendOtp(phone);
      if (result.success) {
        setCooldown(RESEND_COOLDOWN);
        setError('');
      } else if (!result.success) {
        setError(result.error.message || MSG.common.unexpected);
      }
    } catch {
      setError(MSG.common.unexpected);
    } finally {
      setResending(false);
    }
  }, [resending, cooldown, phone]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-2">تأكيد رقم الهاتف</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">أدخل الرمز المكوّن من 6 أرقام المرسل إلى هاتفك</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Phone field if not from query */}
        {!phoneFromQuery && (
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-1 block">رقم الهاتف</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXXX"
                required
                dir="ltr"
                className="w-full pr-10 pl-4 py-3 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition"
              />
              <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 mb-6" dir="ltr">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                aria-label={`رقم ${index + 1}`}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:bg-muted bg-background text-foreground"
                disabled={loading}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {/* Resend */}
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !phone.trim()}
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
            disabled={loading || code.join('').length !== 6}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            {loading ? 'جاري التحقق...' : 'تأكيد الرقم'}
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

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyPhoneForm />
    </Suspense>
  );
}
