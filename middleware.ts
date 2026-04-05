import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = nextUrl.pathname.startsWith("/login");

  // If already logged in and hitting the login page, send to app
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // Protect everything else
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

// Run middleware on all routes except static files, API auth, and uploads
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png|logo_dark.png|uploads).*)",
  ],
};
