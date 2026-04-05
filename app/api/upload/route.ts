import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, getUploadType } from "@/lib/upload";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// POST /api/upload — accepts a multipart form with a "file" field
// Saves the file to /public/uploads/[images|documents]/ and records metadata in Prisma
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const messageId = formData.get("messageId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 50 MB limit" },
      { status: 413 }
    );
  }

  // Read file bytes
  const buffer = Buffer.from(await file.arrayBuffer());

  // Save to disk under /public/uploads/[images|documents]/
  const saved = await saveUploadedFile(buffer, file.name, file.type);

  // Persist metadata to Prisma (no binary data — only the URL)
  const upload = await prisma.upload.create({
    data: {
      userId: session.user.id,
      filename: saved.filename,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      size: saved.size,
      url: saved.url,
      uploadType: getUploadType(saved.mimeType),
      ...(messageId && { messageId }),
    },
  });

  return NextResponse.json({ upload }, { status: 201 });
}
