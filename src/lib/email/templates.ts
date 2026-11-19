import type { MailMessage } from "@/lib/email/mailer";

const STORE_NAME = "متجر الخزاعي";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function codeEmail(opts: { to: string; name: string; title: string; intro: string; code: string; minutes: number }): MailMessage {
  const name = escapeHtml(opts.name);
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Tahoma,Arial,sans-serif;color:#1f2937">
  <div style="max-width:460px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;text-align:center">
    <h2 style="margin:0 0 8px;color:#2563eb">${STORE_NAME}</h2>
    <h3 style="margin:0 0 16px">${opts.title}</h3>
    <p style="margin:0 0 4px">مرحباً ${name}،</p>
    <p style="margin:0 0 24px;color:#4b5563">${opts.intro}</p>
    <div dir="ltr" style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;background:#eff6ff;color:#1d4ed8;padding:12px 24px;border-radius:12px">${opts.code}</div>
    <p style="margin:24px 0 0;color:#6b7280;font-size:13px">الرمز صالح لمدة ${opts.minutes} دقائق. لا تشاركه مع أي شخص.</p>
    <p style="margin:8px 0 0;color:#9ca3af;font-size:12px">إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.</p>
  </div>
</body>
</html>`;
  const text = `${STORE_NAME}\n${opts.title}\n\nمرحباً ${opts.name}،\n${opts.intro}\n\nالرمز: ${opts.code}\n\nالرمز صالح لمدة ${opts.minutes} دقائق. لا تشاركه مع أي شخص.\nإذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.`;
  return { to: opts.to, subject: `${opts.code} — ${opts.title} | ${STORE_NAME}`, html, text };
}

export function verificationCodeEmail(to: string, name: string, code: string, minutes: number): MailMessage {
  return codeEmail({
    to,
    name,
    code,
    minutes,
    title: "تأكيد البريد الإلكتروني",
    intro: "استخدم الرمز التالي لتأكيد حسابك:",
  });
}

export function passwordResetCodeEmail(to: string, name: string, code: string, minutes: number): MailMessage {
  return codeEmail({
    to,
    name,
    code,
    minutes,
    title: "استعادة كلمة المرور",
    intro: "استخدم الرمز التالي لتعيين كلمة مرور جديدة:",
  });
}
