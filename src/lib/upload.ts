import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export interface UploadResult {
  filename: string;
  path: string;
  url: string;
}

export async function saveUploadedFile(
  file: File,
  directory: string,
  options?: { maxSizeMB?: number }
): Promise<UploadResult> {
  const maxSizeMB = options?.maxSizeMB ?? 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Validate file type
  const ext = ALLOWED_TYPES[file.type]?.[0];
  if (!ext) {
    throw new Error("Loại file không hợp lệ. Chỉ chấp nhận JPEG, PNG, WebP.");
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    throw new Error(`File quá lớn. Tối đa ${maxSizeMB}MB.`);
  }

  // Generate unique filename
  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();
  const filename = `${uniqueId}-${timestamp}${ext}`;

  // Ensure directory exists
  const dirPath = path.join(UPLOAD_DIR, directory);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }

  // Save file
  const filePath = path.join(dirPath, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    filename,
    path: filePath,
    url: `/uploads/${directory}/${filename}`,
  };
}

export async function deleteUploadedFile(url: string): Promise<void> {
  // Only allow deleting files from /uploads/
  if (!url.startsWith("/uploads/")) return;

  const filePath = path.join(process.cwd(), "public", url);
  try {
    await unlink(filePath);
  } catch {
    // File may already be deleted
  }
}
