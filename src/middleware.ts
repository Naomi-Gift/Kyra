/**
 * Edge middleware — protects /app/* routes.
 *
 * Unauthenticated users are redirected to /auth/login with a `callbackUrl`
 * so they land back on their intended page after signing in.
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth?: unknown }) => {
  const { pathname } = req.nextUrl;

  // Only guard the app shell routes
  if (pathname.startsWith("/app")) {
    if (!req.auth) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*"],
};
