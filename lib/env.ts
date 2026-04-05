/**
 * Environment variables used by the app. Next.js loads `.env.local` automatically.
 * Never put secrets in `NEXT_PUBLIC_*` — those are exposed to the browser.
 */

export function authSecret(): string {
  const s = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set AUTH_SECRET or NEXTAUTH_SECRET in production");
  }
  return "dev-insecure-secret-do-not-use-in-production";
}

/** OAuth callbacks, cookie trust — use the same URL users type in the browser */
export function authUrl(): string {
  return (
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  );
}

/** Prisma `datasource.url` */
export const databaseUrl = process.env.DATABASE_URL ?? "";

export const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

/** Socket.io client origin (no trailing slash) */
export const publicAppUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
