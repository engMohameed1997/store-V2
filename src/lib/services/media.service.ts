import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import fs from "fs/promises";
import path from "path";

export class MediaService {
  static async list() {
    return db.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) {
    return db.mediaAsset.create({ data });
  }

  static async delete(id: string) {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw Errors.notFound("Media Asset");

    // Remove from DB first
    await db.mediaAsset.delete({ where: { id } });

    // Try deleting the physical file
    try {
      const filePath = path.join(process.cwd(), "public", asset.url);
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Failed to delete physical file: public${asset.url}`, err);
    }
  }
}
