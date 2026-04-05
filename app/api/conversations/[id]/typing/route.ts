import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import hub from "@/lib/sse-hub";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id: conversationId } = await params;
  const { isTyping } = await req.json() as { isTyping: boolean };
  const userId = session.user.id;

  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: userId } },
    select: { userId: true },
  });

  const suffix = isTyping ? "start" : "stop";
  others.forEach(({ userId: recipientId }) => {
    hub.emit(`typing:${recipientId}:${suffix}`, { userId, conversationId });
  });

  return NextResponse.json({ ok: true });
}
