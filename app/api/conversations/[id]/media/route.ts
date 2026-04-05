import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

type Params = { params: Promise<{ id: string }> };

// GET /api/conversations/:id/media — all images shared in this conversation, grouped by month
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  const uploads = await prisma.upload.findMany({
    where: {
      uploadType: "IMAGE",
      message: { conversationId },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, originalName: true, createdAt: true },
  });

  // Group by "Month Year" label (e.g. "March 2025")
  const grouped: Record<string, typeof uploads> = {};
  for (const upload of uploads) {
    const label = format(new Date(upload.createdAt), "MMMM yyyy");
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(upload);
  }

  const mediaGroups = Object.entries(grouped).map(([month, items]) => ({
    month,
    images: items.map((i) => ({ id: i.id, url: i.url, name: i.originalName })),
  }));

  return NextResponse.json({ mediaGroups });
}
