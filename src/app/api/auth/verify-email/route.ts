import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length > 128) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  try {
    /* Cari user berdasarkan token terlebih dahulu, lalu proses verifikasi */
    const { data: targetUser } = await supabaseAdmin
      .from("Profile")
      .select("id, emailVerified, emailVerifyExpires")
      .eq("emailVerifyToken", token)
      .maybeSingle();

    /* Jika token tidak ditemukan di DB sama sekali — invalid */
    if (!targetUser) {
      return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
    }

    /* Jika user sudah terverifikasi sebelumnya (klik ulang link yang sama) */
    if (targetUser.emailVerified) {
      return NextResponse.redirect(new URL("/verify-email?success=true", req.url));
    }

    /* Cek expired */
    if (!targetUser.emailVerifyExpires || new Date(targetUser.emailVerifyExpires) < new Date()) {
      /* Bersihkan token expired */
      await supabaseAdmin
        .from("Profile")
        .update({ emailVerifyToken: null, emailVerifyExpires: null })
        .eq("id", targetUser.id);
      return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
    }

    /* Atomic update — cegah race condition dari double-click */
    const { data: updated } = await supabaseAdmin
      .from("Profile")
      .update({
        emailVerified:      true,
        emailVerifyToken:   null,
        emailVerifyExpires: null,
      })
      .eq("id", targetUser.id)
      .eq("emailVerified", false)
      .select("id");

    if (!updated || updated.length === 0) {
      /* Race condition: verifikasi sudah diproses oleh request lain */
      return NextResponse.redirect(new URL("/verify-email?success=true", req.url));
    }

    return NextResponse.redirect(new URL("/verify-email?success=true", req.url));
  } catch (err) {
    console.error("[VERIFY EMAIL]", err);
    return NextResponse.redirect(new URL("/verify-email?error=server", req.url));
  }
}
