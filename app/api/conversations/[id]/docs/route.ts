import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

type Params = { params: Promise<{ id: string }> };

// GET /api/conversations/:id/docs — all documents shared in this conversation, grouped by month
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  const uploads = await prisma.upload.findMany({
    where: {
      uploadType: "DOCUMENT",
      message: { conversationId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      originalName: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });

  // Group by "Month Year"
  const grouped: Record<string, typeof uploads> = {};
  for (const upload of uploads) {
    const label = format(new Date(upload.createdAt), "MMMM yyyy");
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(upload);
  }

  const docGroups = Object.entries(grouped).map(([month, files]) => ({
    month,
    files: files.map((f) => ({
      id: f.id,
      name: f.originalName,
      url: f.url,
      mimeType: f.mimeType,
      size: f.size,
      // Derive the short extension label for the badge
      ext: f.originalName.split(".").pop()?.toLowerCase() ?? "file",
    })),
  }));

  return NextResponse.json({ docGroups });
}
