import type { Server, Socket } from "socket.io";
import { prisma } from "./prisma";
import Anthropic from "@anthropic-ai/sdk";

const AI_BOT_USER_ID = process.env.AI_BOT_USER_ID ?? "ai-assistant-bot";

export function registerSocketHandlers(io: Server) {
  console.log("[socket-server] registerSocketHandlers called — io is ready");

  io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;

    console.log(`[socket] new connection  socketId=${socket.id}  userId=${userId ?? "MISSING"}`);

    if (!userId) {
      console.warn("[socket] no userId in handshake auth — disconnecting");
      socket.disconnect();
      return;
    }

    // ── Mark user online ────────────────────────────────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });

    // Join a personal room so messages can be delivered regardless of conversation room membership
    socket.join(`user:${userId}`);
    console.log(`[socket] ${userId} joined personal room user:${userId}`);

    // Tell everyone else this user is now online
    socket.broadcast.emit("user:online", { userId });

    // Send this socket the full list of currently-online users
    const onlineUsers = await prisma.user.findMany({
      where: { isOnline: true },
      select: { id: true },
    });
    socket.emit("users:online-list", { userIds: onlineUsers.map((u: { id: string }) => u.id) });

    // Auto-join all conversation rooms this user is a participant in
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    participations.forEach(({ conversationId }: { conversationId: string }) => socket.join(conversationId));

    // ── Join a specific conversation room ───────────────────────────────────
    socket.on("join:conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`[socket] ${userId} joined conversation room ${conversationId}`);
    });

    // ── Send a message ──────────────────────────────────────────────────────
    socket.on(
      "message:send",
      async (data: {
        conversationId: string;
        text?: string;
        type?: "TEXT" | "IMAGE" | "DOCUMENT" | "LINK";
        uploadId?: string;
      }) => {
        try {
          // Create message in DB
          const message = await prisma.message.create({
            data: {
              conversationId: data.conversationId,
              senderId: userId,
              text: data.text,
              type: data.type ?? "TEXT",
              ...(data.uploadId && {
                uploads: { connect: { id: data.uploadId } },
              }),
            },
            include: {
              sender: { select: { id: true, name: true, image: true } },
              uploads: true,
            },
          });

          // Extract URLs from text and save as Link uploads
          if (data.text) {
            const urlMatches = data.text.match(/https?:\/\/[^\s]+/gi) ?? [];
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

          // Update conversation summary
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: {
              lastMessage: data.text ?? "Sent a file",
              lastMessageAt: message.createdAt,
            },
          });

          // Increment unread count for every other participant
          await prisma.conversationParticipant.updateMany({
            where: {
              conversationId: data.conversationId,
              userId: { not: userId },
            },
            data: { unreadCount: { increment: 1 } },
          });

          // Fetch all participants and deliver via their personal rooms.
          // Personal rooms guarantee delivery regardless of whether the socket
          // has joined the conversation room (avoids all race conditions).
          const participants = await prisma.conversationParticipant.findMany({
            where: { conversationId: data.conversationId },
            select: { userId: true },
          });

          const convUpdate = {
            conversationId: data.conversationId,
            lastMessage: data.text ?? "Sent a file",
            lastMessageAt: message.createdAt,
            lastMessageSenderId: userId,
            lastMessageReadByOther: false,
          };
          console.log(`[socket] message saved id=${message.id} conversationId=${data.conversationId}`);
          participants.forEach(({ userId: participantId }: { userId: string }) => {
            console.log(`[socket] emitting message:received → user:${participantId}`);
            io.to(`user:${participantId}`).emit("message:received", message);
            io.to(`user:${participantId}`).emit("conversation:updated", convUpdate);
          });

          // ── AI reply ────────────────────────────────────────────────────────
          const otherParticipant = participants.find(
            ({ userId: pid }: { userId: string }) => pid !== userId
          );

          if (otherParticipant?.userId === AI_BOT_USER_ID && data.text?.trim()) {
            const emitAi = (msg: typeof message, lastMsg: string) => {
              io.to(`user:${userId}`).emit("typing:stop", { userId: AI_BOT_USER_ID, conversationId: data.conversationId });
              io.to(`user:${userId}`).emit("message:received", msg);
              io.to(`user:${userId}`).emit("conversation:updated", {
                conversationId: data.conversationId,
                lastMessage: lastMsg,
                lastMessageAt: msg.createdAt,
              });
            };

            // Show AI typing indicator while generating response
            io.to(`user:${userId}`).emit("typing:start", { userId: AI_BOT_USER_ID, conversationId: data.conversationId });

            // Check credits
            const userRecord = await prisma.user.findUnique({
              where: { id: userId },
              select: { creditsUsed: true, creditsTotal: true },
            });
            const creditsLeft = (userRecord?.creditsTotal ?? 25) - (userRecord?.creditsUsed ?? 0);

            if (creditsLeft <= 0) {
              const limitMsg = await prisma.message.create({
                data: {
                  conversationId: data.conversationId,
                  senderId: AI_BOT_USER_ID,
                  text: "You've used all your credits for today. They'll reset in 24 hours.",
                  type: "TEXT",
                },
                include: {
                  sender: { select: { id: true, name: true, image: true } },
                  uploads: true,
                },
              });
              emitAi(limitMsg, limitMsg.text!);
            } else {
              // Build conversation history for Claude
              const history = await prisma.message.findMany({
                where: { conversationId: data.conversationId },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: { senderId: true, text: true },
              });

              const anthropicMessages = history
                .reverse()
                .filter((m: { senderId: string; text: string | null }) => m.text?.trim())
                .map((m: { senderId: string; text: string | null }) => ({
                  role: (m.senderId === AI_BOT_USER_ID ? "assistant" : "user") as "user" | "assistant",
                  content: m.text!,
                }));

              const client = new Anthropic();
              const aiResponse = await client.messages.create({
                model: "claude-sonnet-4-6",
                max_tokens: 1024,
                system:
                  "You are a helpful AI assistant inside a chat app called Shipper Chat. Be concise, friendly, and helpful. Use plain text — no markdown formatting.",
                messages: anthropicMessages,
              });

              const aiText =
                aiResponse.content[0].type === "text"
                  ? aiResponse.content[0].text
                  : "Sorry, I couldn't generate a response.";

              const aiMessage = await prisma.message.create({
                data: {
                  conversationId: data.conversationId,
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
                where: { id: data.conversationId },
                data: { lastMessage: aiText, lastMessageAt: aiMessage.createdAt },
              });

              await prisma.user.update({
                where: { id: userId },
                data: { creditsUsed: { increment: 1 } },
              });

              emitAi(aiMessage, aiText);
            }
          }
        } catch (err) {
          console.error("socket message:send error", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // ── Typing indicators ───────────────────────────────────────────────────
    socket.on("typing:start", async ({ conversationId }: { conversationId: string }) => {
      const others = await prisma.conversationParticipant.findMany({
        where: { conversationId, userId: { not: userId } },
        select: { userId: true },
      });
      others.forEach(({ userId: recipientId }: { userId: string }) => {
        io.to(`user:${recipientId}`).emit("typing:start", { userId, conversationId });
      });
    });

    socket.on("typing:stop", async ({ conversationId }: { conversationId: string }) => {
      const others = await prisma.conversationParticipant.findMany({
        where: { conversationId, userId: { not: userId } },
        select: { userId: true },
      });
      others.forEach(({ userId: recipientId }: { userId: string }) => {
        io.to(`user:${recipientId}`).emit("typing:stop", { userId, conversationId });
      });
    });


    // ── Mark messages as read ───────────────────────────────────────────────
    socket.on("messages:read", async ({ conversationId }: { conversationId: string }) => {
      // Reset unread count for this participant
      await prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { unreadCount: 0 },
      });

      // Add this user to readBy on all messages they didn't send
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          NOT: { readBy: { has: userId } },
        },
        data: { readBy: { push: userId } },
      });

      // Notify other participants via personal rooms (reliable delivery)
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      });
      participants.forEach(({ userId: pid }: { userId: string }) => {
        if (pid !== userId) {
          io.to(`user:${pid}`).emit("messages:read", { userId, conversationId });
        }
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });
      io.emit("user:offline", { userId });
    });
  });
}
