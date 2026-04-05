import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/conversations — all non-archived conversations for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myParticipations = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id, isArchived: false },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { senderId: true, readBy: true },
          },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
  });

  // Shape response: one object per conversation
  const conversations = myParticipations.map((p) => {
    const otherParticipant = p.conversation.participants.find(
      (cp) => cp.userId !== session.user.id
    );
    const lastMsg = p.conversation.messages[0] ?? null;
    return {
      id: p.conversation.id,
      lastMessage: p.conversation.lastMessage,
      lastMessageAt: p.conversation.lastMessageAt,
      unreadCount: p.unreadCount,
      isArchived: p.isArchived,
      isMuted: p.isMuted,
      otherUser: otherParticipant?.user ?? null,
      lastMessageSenderId: lastMsg?.senderId ?? null,
      lastMessageReadByOther: lastMsg && otherParticipant
        ? (lastMsg.readBy ?? []).includes(otherParticipant.userId)
        : false,
    };
  });

  return NextResponse.json({ conversations });
}

// POST /api/conversations — create or find an existing 1:1 conversation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await req.json();
  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }

  // Look for an existing conversation with exactly these two participants
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, isOnline: true } },
        },
      },
    },
  });

  if (existing) {
    const otherUser = existing.participants.find(
      (p) => p.userId !== session.user.id
    )?.user;
    return NextResponse.json({ conversation: { ...existing, otherUser } });
  }

  // Create a new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        createMany: {
          data: [{ userId: session.user.id }, { userId: targetUserId }],
        },
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, isOnline: true } },
        },
      },
    },
  });

  const otherUser = conversation.participants.find(
    (p) => p.userId !== session.user.id
  )?.user;

  return NextResponse.json({ conversation: { ...conversation, otherUser } }, { status: 201 });
}
