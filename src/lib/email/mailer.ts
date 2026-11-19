import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP mailer. Works with Gmail (smtp.gmail.com + an App Password) or any
 * other SMTP provider — configured entirely from env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 */

let transporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // Local development without SMTP: print instead of sending.
      console.info(`[mail:dev] to=${message.to} subject=${message.subject}\n${message.text}`);
      return;
    }
    throw new Error("SMTP is not configured");
  }

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}
