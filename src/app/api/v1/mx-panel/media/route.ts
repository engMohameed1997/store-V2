import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { UploadService, MAX_FILE_SIZE } from "@/lib/services/upload.service";
import { MediaService } from "@/lib/services/media.service";

export const GET = adminRoute(async () => {
  const assets = await MediaService.list();
  return apiSuccess(assets);
});

export const POST = adminRoute(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw Errors.badRequest("No file provided");
  }

  if (file.size === 0) {
    throw Errors.badRequest("Empty file is not allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw Errors.badRequest("File exceeds the 5MB size limit");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Save file to disk
  const uploadResult = await UploadService.processAndSave(buffer, "gallery");

  // Save reference in DB
  const asset = await MediaService.create({
    url: uploadResult.url,
    fileName: file.name,
    fileSize: uploadResult.size,
    mimeType: uploadResult.mimeType,
  });

  return apiCreated(asset);
});
