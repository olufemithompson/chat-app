import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

type Params = { params: Promise<{ id: string }> };

// GET /api/conversations/:id/links — all link messages, grouped by month
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  // Query Link uploads directly — each URL extracted from a message is its own Upload row
  const linkUploads = await prisma.upload.findMany({
    where: {
      uploadType: "LINK",
      message: { conversationId },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by "Month Year"
  const grouped: Record<
    string,
    { id: string; url: string; title: string; createdAt: Date }[]
  > = {};

  for (const upload of linkUploads) {
    const label = format(new Date(upload.createdAt), "MMMM yyyy");
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push({
      id: upload.id,
      url: upload.linkUrl ?? upload.url,
      title: upload.linkTitle ?? upload.linkUrl ?? upload.url,
      createdAt: upload.createdAt,
    });
  }

  const linkGroups = Object.entries(grouped).map(([month, links]) => ({
    month,
    links,
  }));

  return NextResponse.json({ linkGroups });
}
