/**
 * Run once to create the AI bot user:
 *   npx tsx prisma/seed-bot.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BOT_ID = process.env.AI_BOT_USER_ID ?? "ai-assistant-bot";

async function main() {
  const existing = await prisma.user.findUnique({ where: { id: BOT_ID } });
  if (existing) {
    console.log("Bot user already exists:", BOT_ID);
    return;
  }

  await prisma.user.create({
    data: {
      id: BOT_ID,
      name: "AI Assistant",
      email: "ai@chatapp.internal",
      image: null,
      isOnline: true,
    },
  });

  console.log("✅ AI bot user created with id:", BOT_ID);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
