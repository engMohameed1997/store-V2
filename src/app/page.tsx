"use client";

import { useMemo, useState, type InputHTMLAttributes } from "react";
import { postJson, type ApiResult } from "@/lib/client/api";

type ActionKey =
  | "login"
  | "register"
  | "verifyEmail"
  | "verifyPhone"
  | "resendOtp"
  | "forgot"
  | "reset"
  | "refresh"
  | "logout";

type ResultMap = Record<ActionKey, ApiResult | null>;

export default function Home() {
  const [accessToken, setAccessToken] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy token");
  const [loadingKey, setLoadingKey] = useState<ActionKey | null>(null);
  const [results, setResults] = useState<ResultMap>({
    login: null,
    register: null,
    verifyEmail: null,
    verifyPhone: null,
    resendOtp: null,
    forgot: null,
    reset: null,
    refresh: null,
    logout: null,
  });

  const [loginInput, setLoginInput] = useState({
    identifier: "",
    password: "",
    deviceName: "",
    deviceId: "",
  });

  const [registerMode, setRegisterMode] = useState<"email" | "phone">("email");
  const [registerEmail, setRegisterEmail] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [registerPhone, setRegisterPhone] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
  });

  const [verifyEmailToken, setVerifyEmailToken] = useState("");
  const [verifyPhonePayload, setVerifyPhonePayload] = useState({ phone: "", code: "" });
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [resetPayload, setResetPayload] = useState({ token: "", password: "" });

  const nextTokenPreview = useMemo(
    () => (accessToken ? `${accessToken.slice(0, 22)}…${accessToken.slice(-6)}` : "Not set"),
    [accessToken]
  );

  const handleAction = async (key: ActionKey, fn: () => Promise<ApiResult>) => {
    setLoadingKey(key);
    const result = await fn();
    setResults((prev) => ({ ...prev, [key]: result }));
    setLoadingKey(null);

    const maybeToken = extractAccessToken(result);
    if (maybeToken) {
      setAccessToken(maybeToken);
      setCopyLabel("Copy token");
    }
  };

  const copyToken = async () => {
    if (!accessToken) return;
    await navigator.clipboard?.writeText(accessToken);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy token"), 1200);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Auth console</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
                تهيئة واجهات المصادقة
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                نماذج تفاعلية متصلة مباشرة بنقاط النهاية في /api/v1/auth لتسجيل الدخول،
                التسجيل، التحقق، وإدارة الجلسات. يمكن تجربة كل تدفق ومشاهدة الاستجابة فورًا.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-slate-400">Access token</span>
                <StatusBadge status={accessToken ? "ready" : "empty"} />
              </div>
              <div className="flex items-center gap-2 text-ellipsis text-sm font-mono text-slate-100">
                <span className="block flex-1 truncate">{nextTokenPreview}</span>
                <button
                  type="button"
                  onClick={copyToken}
                  className="rounded-lg border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:border-cyan-300 hover:text-white disabled:opacity-50"
                  disabled={!accessToken}
                >
                  {copyLabel}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                يتم استلام refreshToken في الكوكيز بعد تسجيل الدخول، ويمكن تحديث الوصول من خلال زر Refresh.
              </p>
            </div>
          </div>
          <div className="grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            <InfoChip label="Cookie-based refresh" value="refreshToken" />
            <InfoChip label="Protected routes" value="Authorization: Bearer {token}" />
            <InfoChip label="Rate limit tier" value="auth/strict" />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 flex flex-col gap-6">
            <ActionCard
              title="تسجيل الدخول"
              subtitle="يدعم البريد أو الهاتف، مع حفظ رمز الوصول والكوكيز للريفريش"
              result={results.login}
              status={loadingKey === "login" ? "loading" : undefined}
            >
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAction("login", () =>
                    postJson("/api/v1/auth/login", {
                      ...loginInput,
                      deviceName: loginInput.deviceName || undefined,
                      deviceId: loginInput.deviceId || undefined,
                    })
                  );
                }}
              >
                <LabeledInput
                  label="البريد أو الهاتف"
                  placeholder="user@example.com أو 079XXXXXXXX"
                  required
                  value={loginInput.identifier}
                  onChange={(e) => setLoginInput({ ...loginInput, identifier: e.target.value })}
                />
                <LabeledInput
                  label="كلمة المرور"
                  type="password"
                  required
                  value={loginInput.password}
                  onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                />
                <LabeledInput
                  label="اسم الجهاز (اختياري)"
                  placeholder="My Laptop"
                  value={loginInput.deviceName}
                  onChange={(e) => setLoginInput({ ...loginInput, deviceName: e.target.value })}
                />
                <LabeledInput
                  label="معرّف الجهاز (اختياري)"
                  placeholder="uuid"
                  value={loginInput.deviceId}
                  onChange={(e) => setLoginInput({ ...loginInput, deviceId: e.target.value })}
                />
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 disabled:opacity-60"
                    disabled={loadingKey === "login"}
                  >
                    {loadingKey === "login" ? "جارٍ الإرسال..." : "دخول"}
                  </button>
                  <p className="text-xs text-slate-400">تم ضبط الكوكيز للريفريش تلقائيًا عند النجاح.</p>
                </div>
              </form>
            </ActionCard>

            <ActionCard
              title="تسجيل جديد"
              subtitle="اختر بين البريد أو الهاتف، مع تحقق من صحة كلمة المرور"
              result={results.register}
              status={loadingKey === "register" ? "loading" : undefined}
            >
              <div className="mb-3 flex gap-2 rounded-xl bg-white/5 p-2 text-sm">
                <button
                  type="button"
                  onClick={() => setRegisterMode("email")}
                  className={`flex-1 rounded-lg px-3 py-2 font-semibold transition ${
                    registerMode === "email"
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  بريد إلكتروني
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterMode("phone")}
                  className={`flex-1 rounded-lg px-3 py-2 font-semibold transition ${
                    registerMode === "phone"
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  هاتف عراقي
                </button>
              </div>

              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const payload =
                    registerMode === "email" ? registerEmail : registerPhone;
                  handleAction("register", () => postJson("/api/v1/auth/register", payload));
                }}
              >
                <LabeledInput
                  label="الاسم الأول"
                  required
                  value={(registerMode === "email" ? registerEmail : registerPhone).firstName}
                  onChange={(e) =>
                    registerMode === "email"
                      ? setRegisterEmail({ ...registerEmail, firstName: e.target.value })
                      : setRegisterPhone({ ...registerPhone, firstName: e.target.value })
                  }
                />
                <LabeledInput
                  label="الكنية"
                  required
                  value={(registerMode === "email" ? registerEmail : registerPhone).lastName}
                  onChange={(e) =>
                    registerMode === "email"
                      ? setRegisterEmail({ ...registerEmail, lastName: e.target.value })
                      : setRegisterPhone({ ...registerPhone, lastName: e.target.value })
                  }
                />
                {registerMode === "email" ? (
                  <LabeledInput
                    label="البريد الإلكتروني"
                    type="email"
                    required
                    className="md:col-span-2"
                    value={registerEmail.email}
                    onChange={(e) => setRegisterEmail({ ...registerEmail, email: e.target.value })}
                  />
                ) : (
                  <LabeledInput
                    label="رقم الهاتف العراقي"
                    placeholder="07XXXXXXXX"
                    required
                    className="md:col-span-2"
                    value={registerPhone.phone}
                    onChange={(e) => setRegisterPhone({ ...registerPhone, phone: e.target.value })}
                  />
                )}
                <LabeledInput
                  label="كلمة المرور القوية"
                  type="password"
                  required
                  className="md:col-span-2"
                  placeholder="8+ أحرف مع أحرف كبيرة/صغيرة وأرقام ورمز"
                  value={(registerMode === "email" ? registerEmail : registerPhone).password}
                  onChange={(e) =>
                    registerMode === "email"
                      ? setRegisterEmail({ ...registerEmail, password: e.target.value })
                      : setRegisterPhone({ ...registerPhone, password: e.target.value })
                  }
                />
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-60"
                    disabled={loadingKey === "register"}
                  >
                    {loadingKey === "register" ? "جارٍ الإرسال..." : "إنشاء الحساب"}
                  </button>
                  <p className="text-xs text-slate-400">يرسل OTP للهاتف أو تعليمات التحقق للبريد.</p>
                </div>
              </form>
            </ActionCard>

            <ActionCard
              title="التحقق و OTP"
              subtitle="تأكيد البريد أو الهاتف، وإعادة إرسال رمز OTP للهاتف"
              status={loadingKey && ["verifyEmail", "verifyPhone", "resendOtp"].includes(loadingKey) ? "loading" : undefined}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">التحقق من البريد</p>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAction("verifyEmail", () =>
                        postJson("/api/v1/auth/verify-email", { token: verifyEmailToken })
                      );
                    }}
                  >
                    <LabeledInput
                      label="رمز التحقق"
                      placeholder="token"
                      value={verifyEmailToken}
                      onChange={(e) => setVerifyEmailToken(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-60"
                      disabled={loadingKey === "verifyEmail"}
                    >
                      تأكيد البريد
                    </button>
                  </form>
                  <ResultView compact result={results.verifyEmail} />
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">التحقق من الهاتف</p>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAction("verifyPhone", () =>
                        postJson("/api/v1/auth/verify-phone", verifyPhonePayload)
                      );
                    }}
                  >
                    <LabeledInput
                      label="رقم الهاتف"
                      placeholder="07XXXXXXXX"
                      value={verifyPhonePayload.phone}
                      onChange={(e) =>
                        setVerifyPhonePayload({ ...verifyPhonePayload, phone: e.target.value })
                      }
                      required
                    />
                    <LabeledInput
                      label="رمز OTP"
                      placeholder="6 أرقام"
                      value={verifyPhonePayload.code}
                      onChange={(e) =>
                        setVerifyPhonePayload({ ...verifyPhonePayload, code: e.target.value })
                      }
                      required
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-60"
                      disabled={loadingKey === "verifyPhone"}
                    >
                      تأكيد الهاتف
                    </button>
                  </form>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleAction("resendOtp", () =>
                          postJson("/api/v1/auth/resend-otp", { phone: verifyPhonePayload.phone })
                        )
                      }
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40 disabled:opacity-60"
                      disabled={!verifyPhonePayload.phone || loadingKey === "resendOtp"}
                    >
                      إعادة إرسال OTP
                    </button>
                    <span className="text-xs text-slate-400">يعمل فقط مع أرقام مسجلة.</span>
                  </div>
                  <ResultView compact result={results.verifyPhone || results.resendOtp} />
                </div>
              </div>
            </ActionCard>

            <ActionCard
              title="استعادة كلمة المرور"
              subtitle="إرسال رابط/OTP للنسيان، أو تعيين كلمة مرور جديدة"
              status={loadingKey && ["forgot", "reset"].includes(loadingKey) ? "loading" : undefined}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">نسيت كلمة المرور</p>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAction("forgot", () =>
                        postJson("/api/v1/auth/forgot-password", { identifier: forgotIdentifier })
                      );
                    }}
                  >
                    <LabeledInput
                      label="البريد أو الهاتف"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-60"
                      disabled={loadingKey === "forgot"}
                    >
                      إرسال تعليمات الاستعادة
                    </button>
                  </form>
                  <ResultView compact result={results.forgot} />
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">تعيين كلمة مرور جديدة</p>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAction("reset", () =>
                        postJson("/api/v1/auth/reset-password", resetPayload)
                      );
                    }}
                  >
                    <LabeledInput
                      label="رمز/رابط الاستعادة"
                      required
                      value={resetPayload.token}
                      onChange={(e) => setResetPayload({ ...resetPayload, token: e.target.value })}
                    />
                    <LabeledInput
                      label="كلمة المرور الجديدة"
                      type="password"
                      required
                      value={resetPayload.password}
                      onChange={(e) => setResetPayload({ ...resetPayload, password: e.target.value })}
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-60"
                      disabled={loadingKey === "reset"}
                    >
                      حفظ كلمة المرور
                    </button>
                  </form>
                  <ResultView compact result={results.reset} />
                </div>
              </div>
            </ActionCard>
          </section>

          <aside className="flex flex-col gap-6">
            <ActionCard
              title="الجلسة والرموز"
              subtitle="تحديث رمز الوصول أو إنهاء الجلسة"
              result={results.refresh || results.logout}
              status={loadingKey && ["refresh", "logout"].includes(loadingKey) ? "loading" : undefined}
            >
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleAction("refresh", () => postJson("/api/v1/auth/refresh"))}
                  className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                  disabled={loadingKey === "refresh"}
                >
                  {loadingKey === "refresh" ? "جارٍ التحديث..." : "Refresh access token"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAction("logout", () => {
                      if (!accessToken) {
                        return Promise.resolve({
                          success: false,
                          status: 400,
                          error: { code: "NO_TOKEN", message: "لا يوجد Access token لإرساله" },
                        });
                      }
                      return postJson("/api/v1/auth/logout", undefined, { token: accessToken });
                    })
                  }
                  className="rounded-xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-200 disabled:opacity-60"
                  disabled={loadingKey === "logout"}
                >
                  {loadingKey === "logout" ? "جارٍ الخروج..." : "تسجيل الخروج"}
                </button>
                <p className="text-xs text-slate-400">
                  يحتاج الخروج إلى Authorization bearer + refreshToken الموجود في الكوكيز لمسح العائلة.
                </p>
              </div>
            </ActionCard>

            <ActionCard
              title="لوحة الاستجابة"
              subtitle="آخر استجابة لأي إجراء"
              result={lastResult(results)}
            >
              <ResultView result={lastResult(results)} />
            </ActionCard>
          </aside>
        </div>
      </main>
    </div>
  );
}

function lastResult(results: ResultMap): ApiResult | null {
  const ordered = [
    results.login,
    results.register,
    results.verifyEmail,
    results.verifyPhone,
    results.resendOtp,
    results.forgot,
    results.reset,
    results.refresh,
    results.logout,
  ];
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    if (ordered[i]) return ordered[i];
  }
  return null;
}

function extractAccessToken(result: ApiResult | null): string | null {
  if (!result || !result.success) return null;
  const data = result.data as unknown;
  if (data && typeof data === "object" && "accessToken" in data) {
    const maybeToken = (data as { accessToken?: string }).accessToken;
    return maybeToken ?? null;
  }
  return null;
}

function ActionCard({
  title,
  subtitle,
  children,
  result,
  status,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  result?: ApiResult | null;
  status?: "loading";
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30 backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
        </div>
        {status === "loading" && <PulseDot />}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      {result ? <ResultView result={result} /> : null}
    </section>
  );
}

function ResultView({ result, compact }: { result: ApiResult | null | undefined; compact?: boolean }) {
  if (!result) {
    return <p className="text-xs text-slate-400">لم يتم الإرسال بعد.</p>;
  }

  const isSuccess = result.success;
  const title = isSuccess ? "نجاح" : result.error.code;
  const message = isSuccess ? (result.message ?? "تمت العملية بنجاح") : result.error.message;

  return (
    <div className={`mt-3 space-y-2 rounded-2xl border px-3 py-3 ${
      isSuccess
        ? "border-emerald-400/30 bg-emerald-500/5 text-emerald-100"
        : "border-rose-400/40 bg-rose-500/5 text-rose-100"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex h-2 w-2 rounded-full bg-current" />
          <span>{title}</span>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-white/70">HTTP {result.status}</span>
      </div>
      <p className="text-xs text-white/80">{message}</p>
      {!compact && (
        <pre className="max-h-64 overflow-auto rounded-xl bg-black/30 p-3 text-[11px] leading-relaxed text-slate-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`flex flex-col gap-2 text-sm text-slate-200 ${className ?? ""}`}>
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: "ready" | "empty" }) {
  const label = status === "ready" ? "READY" : "EMPTY";
  const color = status === "ready" ? "bg-emerald-500/20 text-emerald-100" : "bg-slate-700 text-slate-200";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function PulseDot() {
  return <span className="relative inline-flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-300" /></span>;
}
