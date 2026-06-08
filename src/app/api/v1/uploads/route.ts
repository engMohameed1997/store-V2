import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { UploadService, MAX_FILE_SIZE, MAX_FILES_PER_REQUEST } from "@/lib/services/upload.service";

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const formData = await request.formData();

  // Collect files — supports both "files" (multi-upload) and "file" (single upload)
  const multiEntries = formData.getAll("files");
  const singleEntry = formData.get("file");
  const folder = (formData.get("folder") as string) || "general";

  const files: File[] = [];
  if (multiEntries.length > 0) {
    for (const entry of multiEntries) {
      if (entry instanceof File) files.push(entry);
    }
  } else if (singleEntry instanceof File) {
    files.push(singleEntry);
  }

  if (files.length === 0) throw Errors.badRequest("No files provided");
  if (files.length > MAX_FILES_PER_REQUEST) {
    throw Errors.badRequest(`Too many files — maximum ${MAX_FILES_PER_REQUEST} per request`);
  }

  // Pre-validate all file sizes before any processing begins
  for (const file of files) {
    if (file.size === 0) throw Errors.badRequest("Empty files are not allowed");
    if (file.size > MAX_FILE_SIZE) {
      throw Errors.badRequest(`File exceeds the 5MB size limit`);
    }
  }

  // Process each file: magic bytes check → re-encode → strip metadata → save
  const results = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await UploadService.processAndSave(buffer, folder, context.user?.userId);
    results.push(result);
  }

  if (results.length === 1) return apiSuccess(results[0]);
  return apiSuccess({ uploads: results, count: results.length });
}, "upload");
