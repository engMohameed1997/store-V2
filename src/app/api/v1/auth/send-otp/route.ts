import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";
import { signPreAuthToken } from "@/lib/api/pre-auth-token";
import { Errors } from "@/lib/api/errors";

export const POST = publicRoute(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const phone = body?.phone as string | undefined;

  if (!phone) {
    throw Errors.badRequest("رقم الهاتف مطلوب.");
  }

  const cleaned = phone.replace(/^(\+964|00964|0)/, "");
  if (!/^7[3-9]\d{8}$/.test(cleaned)) {
    throw Errors.badRequest("رقم هاتف عراقي غير صالح.");
  }

  const normalized = `+964${cleaned}`;
  const altFormat = `0${cleaned}`;

  const existing = await db.user.findFirst({
    where: { phone: { in: [normalized, altFormat] } },
    select: { id: true },
  });

  if (existing) {
    return apiSuccess(
      { preAuthToken: null },
      "تم إرسال رمز التحقق إلى هاتفك."
    );
  }

  const preAuthToken = signPreAuthToken(normalized);

  return apiSuccess(
    { preAuthToken },
    "تم إرسال رمز التحقق إلى هاتفك."
  );
}, "strict");
