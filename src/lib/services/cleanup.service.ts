import { db } from "@/lib/db";

export class CleanupService {
  static async purgeExpiredTokens() {
    const now = new Date();

    const [revokedTokens, expiredVerifications, expiredResets] =
      await Promise.all([
        db.apiToken.deleteMany({
          where: {
            OR: [
              { isRevoked: true, createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
              { expiresAt: { lt: now } },
            ],
          },
        }),
        db.phoneVerification.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: now } },
              { verified: true, createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            ],
          },
        }),
        db.passwordResetToken.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: now } },
              { usedAt: { not: null } },
            ],
          },
        }),
      ]);

    return {
      revokedTokens: revokedTokens.count,
      expiredVerifications: expiredVerifications.count,
      expiredResets: expiredResets.count,
    };
  }

  static async purgeExpiredCarts() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await db.cart.deleteMany({
      where: {
        updatedAt: { lt: thirtyDaysAgo },
        userId: null,
      },
    });

    return { expiredGuestCarts: result.count };
  }
}
