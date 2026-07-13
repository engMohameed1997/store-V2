import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import { deleteObject } from "@/lib/storage";

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

    // Try deleting the object from MinIO
    try {
      await deleteObject(asset.url);
    } catch (err) {
      logger.error("Failed to delete object from MinIO", { url: asset.url, error: err });
    }
  }
}
