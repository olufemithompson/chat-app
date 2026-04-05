import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/me — current authenticated user's full profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      theme: true,
      creditsUsed: true,
      creditsTotal: true,
      creditsReset: true,
      isOnline: true,
      lastSeen: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Auto-reset credits if more than 24 hours have passed
  const hoursSinceReset =
    (Date.now() - new Date(user.creditsReset).getTime()) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { creditsUsed: 0, creditsReset: new Date() },
      select: { creditsUsed: true, creditsTotal: true, creditsReset: true },
    });
    return NextResponse.json({ user: { ...user, ...updated } });
  }

  return NextResponse.json({ user });
}

// PATCH /api/users/me — update theme or other profile fields
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowed = ["theme", "name"] as const;
  const data: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, theme: true },
  });

  return NextResponse.json({ user });
}
