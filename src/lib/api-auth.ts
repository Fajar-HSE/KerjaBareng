/**
 * Helper untuk validasi session di API routes.
 * Gunakan di semua API route yang butuh autentikasi.
 */
import { getServerSession } from "next-auth";
import { NextResponse }     from "next/server";
import { authOptions }      from "./auth";

export type AuthSession = {
  user: { id: string; email: string; name: string; role: string };
};

/** Return session atau NextResponse 401 jika tidak login */
export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session as AuthSession;
}

/** Return session atau NextResponse 403 jika bukan admin */
export async function requireAdmin(): Promise<AuthSession | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  if (result.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

/** Type guard */
export function isAuthSession(v: AuthSession | NextResponse): v is AuthSession {
  return !(v instanceof NextResponse);
}
