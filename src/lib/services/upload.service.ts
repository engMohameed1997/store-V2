import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { Errors } from "@/lib/api/errors";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
export const MAX_FILES_PER_REQUEST = 10;
const MAX_IMAGE_DIMENSION = 8000; // pixels — prevents decompression bombs

const UPLOAD_BASE_DIR = path.join(process.cwd(), "public", "uploads");

type AllowedMime = "image/jpeg" | "image/png" | "image/webp";

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
      console.warn(`[Upload] REJECTED invalid file type | by=${byTag}`);
      throw Errors.badRequest("Invalid file: only JPEG, PNG, and WEBP images are accepted");
    }

    // ── 2. Header Metadata Check (no full decode — safe against decompression bombs) ─
    let rawMeta: sharp.Metadata;
    try {
      rawMeta = await sharp(buffer).metadata();
    } catch {
      console.warn(`[Upload] REJECTED corrupt image | mime=${detectedMime} | by=${byTag}`);
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
      console.warn(`[Upload] Re-encode failed | mime=${detectedMime} | by=${byTag}`);
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

    console.info(
      `[Upload] Saved: ${url} | ${width}×${height} | ${processedBuffer.length}B | mime=${outputMime} | by=${byTag}`
    );

    return { url, filename, size: processedBuffer.length, mimeType: outputMime, width, height };
  }
}
