import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || "http://minio:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || "store_minio_admin",
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET || "store-uploads";
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || "/minio";

export async function uploadObject(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return `${PUBLIC_URL}/${BUCKET}/${key}`;
}

export async function deleteObject(url: string): Promise<void> {
  const prefix = `${PUBLIC_URL}/${BUCKET}/`;
  if (!url.startsWith(prefix)) return;
  const key = url.slice(prefix.length);
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
