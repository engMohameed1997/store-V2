import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export const POST = protectedRoute(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "general";

  if (!file) throw Errors.badRequest("No file uploaded");
  if (file.size > MAX_SIZE) throw Errors.badRequest("File too large (max 5MB)");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw Errors.badRequest(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }

  const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
  const filename = `${crypto.randomUUID()}${ext}`;
  const folderPath = path.join(UPLOAD_DIR, folder);

  await fs.mkdir(folderPath, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(folderPath, filename), buffer);

  const url = `/uploads/${folder}/${filename}`;

  return apiSuccess({ url, filename, size: file.size, mimeType: file.type });
}, "default");
