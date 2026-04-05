import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Map MIME types to upload categories
export function getUploadType(mimeType: string): "IMAGE" | "DOCUMENT" {
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "DOCUMENT";
}

// Sub-folder names under /public/uploads/
const UPLOAD_DIRS: Record<"IMAGE" | "DOCUMENT", string> = {
  IMAGE: "images",
  DOCUMENT: "documents",
};

export interface SavedFile {
  filename: string;    // uuid.ext — the name on disk
  originalName: string;
  mimeType: string;
  size: number;
  url: string;         // public URL: /uploads/images/uuid.jpg
}

/**
 * Persists a file buffer to /public/uploads/[type]/[uuid].[ext]
 * and returns the metadata needed to store in Prisma.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<SavedFile> {
  const uploadType = getUploadType(mimeType);
  const subDir = UPLOAD_DIRS[uploadType];

  // Resolve the absolute directory on disk
  const uploadDir = join(process.cwd(), "public", "uploads", subDir);

  // Ensure the directory exists
  await mkdir(uploadDir, { recursive: true });

  // Build a unique filename: keep original extension
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${uuidv4()}.${ext}`;
  const filePath = join(uploadDir, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    originalName,
    mimeType,
    size: buffer.length,
    url: `/uploads/${subDir}/${filename}`,
  };
}
