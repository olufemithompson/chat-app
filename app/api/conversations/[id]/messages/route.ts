import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Server as SocketServer } from "socket.io";
import Anthropic from "@anthropic-ai/sdk";

type Params = { params: Promise<{ id: string }> };

const AI_BOT_USER_ID = process.env.AI_BOT_USER_ID ?? "ai-assistant-bot";

// GET /api/conversations/:id/messages — most recent 50, chronological
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  const batch = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      uploads: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const messages = batch.slice().reverse();

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { unreadCount: 0 },
  });

  return NextResponse.json({ messages });
}

// POST /api/conversations/:id/messages — send a message (+ AI reply if bot conversation)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;
  const { text, type = "TEXT", uploadId } = await req.json();
  const userId = session.user.id;

  // Save the user's message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text,
      type,
      ...(uploadId && { uploads: { connect: { id: uploadId } } }),
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      uploads: true,
    },
  });

  // Extract URLs from text and save as Link uploads
  if (text) {
    const urlMatches = (text as string).match(/https?:\/\/[^\s]+/gi) ?? [];
    for (const url of urlMatches) {
      await prisma.upload.create({
        data: {
          messageId: message.id,
          userId,
          filename: url,
          originalName: url,
          mimeType: "text/uri-list",
          size: 0,
          url,
          uploadType: "LINK",
          linkUrl: url,
          linkTitle: url,
        },
      });
    }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: text ?? "Sent a file", lastMessageAt: message.createdAt },
  });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: { not: userId } },
    data: { unreadCount: { increment: 1 } },
  });

  // Emit user's message to all participants
  const io = (globalThis as { io?: SocketServer }).io;
  const emitToParticipants = async (msg: typeof message, lastMessage: string) => {
    if (!io) return;
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const convUpdate = { conversationId, lastMessage, lastMessageAt: msg.createdAt };
    participants.forEach(({ userId: pid }) => {
      io.to(`user:${pid}`).emit("message:received", msg);
      io.to(`user:${pid}`).emit("conversation:updated", convUpdate);
    });
  };

  await emitToParticipants(message, text ?? "Sent a file");

  // ── AI reply ──────────────────────────────────────────────────────────────
  const otherParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: { not: userId } },
    select: { userId: true },
  });

  if (otherParticipant?.userId === AI_BOT_USER_ID && text?.trim()) {
    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditsUsed: true, creditsTotal: true },
    });
    const creditsLeft = (user?.creditsTotal ?? 25) - (user?.creditsUsed ?? 0);

    if (creditsLeft <= 0) {
      // Send a system message instead of calling Claude
      const limitMsg = await prisma.message.create({
        data: {
          conversationId,
          senderId: AI_BOT_USER_ID,
          text: "You've used all your credits for today. They'll reset in 24 hours.",
          type: "TEXT",
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          uploads: true,
        },
      });
      await emitToParticipants(limitMsg, limitMsg.text!);
    } else {
      // Fetch conversation history for context (last 20 messages)
      const history = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { senderId: true, text: true },
      });

      const anthropicMessages = history
        .reverse()
        .filter((m) => m.text?.trim())
        .map((m) => ({
          role: (m.senderId === AI_BOT_USER_ID ? "assistant" : "user") as "user" | "assistant",
          content: m.text!,
        }));

      // Call Claude
      const client = new Anthropic();
      const aiResponse = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system:
          "You are a helpful AI assistant inside a chat app called Shipper Chat. Be concise, friendly, and helpful. Use plain text — no markdown formatting.",
        messages: anthropicMessages,
      });

      const aiText =
        aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "Sorry, I couldn't generate a response.";

      // Save AI reply
      const aiMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: AI_BOT_USER_ID,
          text: aiText,
          type: "TEXT",
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          uploads: true,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessage: aiText, lastMessageAt: aiMessage.createdAt },
      });

      // Increment user's credits used
      await prisma.user.update({
        where: { id: userId },
        data: { creditsUsed: { increment: 1 } },
      });

      await emitToParticipants(aiMessage, aiText);
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}

// DELETE /api/conversations/:id/messages — clear all messages
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  await prisma.message.deleteMany({ where: { conversationId } });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: null, lastMessageAt: null },
  });

  return NextResponse.json({ cleared: true });
}
