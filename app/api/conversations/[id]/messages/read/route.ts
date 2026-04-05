import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/conversations/:id/messages/read — reset unread count for the current user
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id: conversationId } = await params;

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { unreadCount: 0 },
  });

  return NextResponse.json({ ok: true });
}
