import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  try {
    const { data: users, error } = await supabaseAdmin
      .from("Profile")
      .select("id, fullName, email, role, division, avatarUrl")
      .order("fullName", { ascending: true });

    if (error) {
      console.error("Gagal mengambil data user:", error);
      return NextResponse.json({ error: "Gagal mengambil data user." }, { status: 500 });
    }

    return NextResponse.json(users || []);
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
