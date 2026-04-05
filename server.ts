import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { registerSocketHandlers } from "./lib/socket-server";
import { authUrl } from "./lib/env";

/** Browser and NEXTAUTH_URL sometimes disagree on localhost vs 127.0.0.1 — allow both in dev. */
function socketCorsOrigins(): string[] | boolean {
  const publicBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  if (process.env.NODE_ENV === "production") {
    const o = new Set<string>();
    for (const u of [authUrl(), publicBase, process.env.NEXT_PUBLIC_APP_URL]) {
      if (u?.trim()) o.add(u.trim().replace(/\/$/, ""));
    }
    const list = [...o];
    return list.length ? list : true;
  }
  const port = process.env.PORT ?? "3000";
  return [
    authUrl().replace(/\/$/, ""),
    publicBase,
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ].filter((v, i, a) => a.indexOf(v) === i);
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    // Socket.io intercepts its own path via the upgrade/request listeners it
    // attaches to the HTTP server. If we pass these through to Next.js it sends
    // a 404 first and the Socket.io handshake/polling never completes.
    if (req.url?.startsWith("/api/socket")) {
      console.log("[server] socket.io request:", req.method, req.url);
      return;
    }

    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Attach Socket.io to the same HTTP server
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: socketCorsOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Expose io globally so API routes can emit events (same process)
  (globalThis as { io?: SocketIOServer }).io = io;

  registerSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    console.log(`\n> Ready on http://${hostname}:${port}\n`);
  });
});
