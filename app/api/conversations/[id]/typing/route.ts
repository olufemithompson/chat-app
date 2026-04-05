import { NextResponse } from "next/server";

// Typing indicators are handled via Socket.io (lib/socket-server.ts).
// This REST route is no longer used but kept to avoid 404s from old clients.
export async function POST() {
  return NextResponse.json({ ok: true });
}
