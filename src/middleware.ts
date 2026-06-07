import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: { role?: string } | null } }) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Proteksi route /admin/* — hanya role admin
    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // authorized() dipanggil sebelum middleware function
      // Return false = redirect ke /login (sudah di-set di authOptions.pages.signIn)
      authorized: ({ token }) => !!token,
    },
  }
);

// Route mana saja yang diproteksi middleware
export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - /login dan /api/auth/* (public)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, file statis
     */
    "/((?!login|register|verify-email|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
