import { db } from "@/lib/db";

export class BannerService {
  static async listActive() {
    const now = new Date();
    return db.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
      orderBy: { position: "asc" },
    });
  }

  static async listAll() {
    return db.banner.findMany({ orderBy: { position: "asc" } });
  }
}
