import sharp, { type Metadata as SharpMetadata } from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";
import { Errors } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

const execFileAsync = promisify(execFile);

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB per video
export const MAX_FILES_PER_REQUEST = 10;
const MAX_IMAGE_DIMENSION = 8000; // pixels — prevents decompression bombs

const UPLOAD_BASE_DIR = path.join(process.cwd(), "public", "uploads");

type AllowedMime = "image/jpeg" | "image/png" | "image/webp";
type AllowedVideoMime = "video/mp4" | "video/webm";

// ── Magic Bytes Signatures ────────────────────────────────────────────────────
// Validates real file type from binary content — immune to extension/MIME spoofing
function detectMimeFromBytes(buffer: Buffer): AllowedMime | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a &&
    buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // WEBP: RIFF????WEBP (bytes 0–3 = "RIFF", bytes 8–11 = "WEBP")
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 &&
    buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 &&
    buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function detectVideoMimeFromBytes(buffer: Buffer): AllowedVideoMime | null {
  if (buffer.length < 12) return null;

  // MP4: has "ftyp" at offset 4
  if (
    buffer[4] === 0x66 && buffer[5] === 0x74 &&
    buffer[6] === 0x79 && buffer[7] === 0x70
  ) {
    return "video/mp4";
  }
  // WebM: starts with EBML header 0x1A 0x45 0xDF 0xA3
  if (
    buffer[0] === 0x1a && buffer[1] === 0x45 &&
    buffer[2] === 0xdf && buffer[3] === 0xa3
  ) {
    return "video/webm";
  }

  return null;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
}

export class UploadService {
  static async processAndSave(
    buffer: Buffer,
    folder: string,
    uploadedBy?: string
  ): Promise<UploadResult> {
    const byTag = uploadedBy || "unknown";

    // ── 1. Magic Bytes Validation ─────────────────────────────────────────────
    // Reads actual binary signature — not the client-supplied Content-Type
    const detectedMime = detectMimeFromBytes(buffer);
    if (!detectedMime) {
      logger.warn("Upload rejected: invalid file type", { by: byTag });
      throw Errors.badRequest("Invalid file: only JPEG, PNG, and WEBP images are accepted");
    }

    // ── 2. Header Metadata Check (no full decode — safe against decompression bombs) ─
    let rawMeta: SharpMetadata;
    try {
      rawMeta = await sharp(buffer).metadata();
    } catch {
      logger.warn("Upload rejected: corrupt image", { mime: detectedMime, by: byTag });
      throw Errors.badRequest("Image is corrupt or cannot be parsed");
    }

    if ((rawMeta.width ?? 0) > MAX_IMAGE_DIMENSION || (rawMeta.height ?? 0) > MAX_IMAGE_DIMENSION) {
      throw Errors.badRequest(
        `Image dimensions exceed the allowed maximum of ${MAX_IMAGE_DIMENSION}×${MAX_IMAGE_DIMENSION} pixels`
      );
    }

    // ── 3. Re-Encode via Sharp ────────────────────────────────────────────────
    // Rebuilds the image from pixel data only — strips ALL EXIF, GPS, ICC, XMP,
    // embedded thumbnails, and any hidden payloads. No .withMetadata() = clean output.
    let processedBuffer: Buffer;
    let outputExt: string;
    let outputMime: string;

    try {
      if (detectedMime === "image/png") {
        processedBuffer = await sharp(buffer).png({ compressionLevel: 8 }).toBuffer();
        outputExt = "png";
        outputMime = "image/png";
      } else if (detectedMime === "image/webp") {
        processedBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        outputExt = "webp";
        outputMime = "image/webp";
      } else {
        processedBuffer = await sharp(buffer)
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
        outputExt = "jpg";
        outputMime = "image/jpeg";
      }
    } catch {
      logger.warn("Upload re-encode failed", { mime: detectedMime, by: byTag });
      throw Errors.badRequest("Image processing failed — file may contain unsupported content");
    }

    // ── 4. Get Final Dimensions ───────────────────────────────────────────────
    const finalMeta = await sharp(processedBuffer).metadata();
    const width = finalMeta.width ?? 0;
    const height = finalMeta.height ?? 0;

    // ── 5. Sanitize Folder Name (prevent path traversal) ─────────────────────
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50) || "general";
    const folderPath = path.join(UPLOAD_BASE_DIR, sanitizedFolder);
    await fs.mkdir(folderPath, { recursive: true });

    // ── 6. Generate UUID Filename + Write with Exclusive Flag ────────────────
    // "wx" flag at OS level: fails atomically if file already exists (no overwrite possible)
    const filename = `${crypto.randomUUID()}.${outputExt}`;
    const filePath = path.join(folderPath, filename);

    await fs.writeFile(filePath, processedBuffer, { flag: "wx" });

    const url = `/uploads/${sanitizedFolder}/${filename}`;

    logger.info("Upload saved", { url, width, height, size: processedBuffer.length, mime: outputMime, by: byTag });

    return { url, filename, size: processedBuffer.length, mimeType: outputMime, width, height };
  }

  static async processAndSaveVideo(
    buffer: Buffer,
    folder: string,
    uploadedBy?: string
  ): Promise<UploadResult> {
    const byTag = uploadedBy || "unknown";

    const detectedMime = detectVideoMimeFromBytes(buffer);
    if (!detectedMime) {
      logger.warn("Upload rejected: invalid video type", { by: byTag });
      throw Errors.badRequest("Invalid file: only MP4 and WebM videos are accepted");
    }

    if (!ffmpegPath) {
      throw Errors.badRequest("Video processing is not available on this server");
    }

    const outputExt = detectedMime === "video/mp4" ? "mp4" : "webm";

    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50) || "general";
    const folderPath = path.join(UPLOAD_BASE_DIR, sanitizedFolder);
    await fs.mkdir(folderPath, { recursive: true });

    const tmpId = crypto.randomUUID();
    const tmpInput = path.join(folderPath, `tmp_in_${tmpId}.${outputExt}`);
    const filename = `${crypto.randomUUID()}.${outputExt}`;
    const filePath = path.join(folderPath, filename);

    try {
      // Write raw buffer to a temp file for ffmpeg to read
      await fs.writeFile(tmpInput, buffer, { flag: "wx" });

      // Re-encode stripping all metadata: -map_metadata -1 removes all global metadata
      // -c:v copy -c:a copy keeps original streams (no quality loss, fast)
      await execFileAsync(ffmpegPath, [
        "-i", tmpInput,
        "-map_metadata", "-1",
        "-c:v", "copy",
        "-c:a", "copy",
        "-movflags", "+faststart",
        "-y",
        filePath,
      ]);

      // Read back the processed file to get its size
      const stat = await fs.stat(filePath);
      const url = `/uploads/${sanitizedFolder}/${filename}`;

      logger.info("Video upload saved", { url, size: stat.size, mime: detectedMime, by: byTag });

      return { url, filename, size: stat.size, mimeType: detectedMime, width: 0, height: 0 };
    } catch (err) {
      logger.error("Video processing failed", { by: byTag, error: String(err) });
      // Clean up output file if it was partially written
      await fs.unlink(filePath).catch(() => {});
      throw Errors.badRequest("Video processing failed — the file may be corrupt or unsupported");
    } finally {
      // Always remove the temp input file
      await fs.unlink(tmpInput).catch(() => {});
    }
  }
}
