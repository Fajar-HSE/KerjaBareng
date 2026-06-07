import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length > 128) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  try {
    /* Atomic update — cegah race condition dari double-click */
    const { data: updated } = await supabaseAdmin
      .from("Profile")
      .update({
        emailVerified:      true,
        emailVerifyToken:   null,
        emailVerifyExpires: null,
      })
      .eq("emailVerifyToken", token)
      .eq("emailVerified", false)
      .gt("emailVerifyExpires", new Date().toISOString())
      .select("id");

    if (!updated || updated.length === 0) {
      /* Token tidak ditemukan atau sudah dipakai atau expired — bersihkan expired token */
      await supabaseAdmin
        .from("Profile")
        .update({
          emailVerifyToken:   null,
          emailVerifyExpires: null,
        })
        .eq("emailVerifyToken", token)
        .lt("emailVerifyExpires", new Date().toISOString());

      /* Cek apakah user sudah terverifikasi (klik ulang link valid) */
      const { data: alreadyVerified } = await supabaseAdmin
        .from("Profile")
        .select("id")
        .eq("emailVerified", true)
        .is("emailVerifyToken", null)
        .limit(1)
        .maybeSingle();

      if (alreadyVerified) {
        return NextResponse.redirect(new URL("/verify-email?success=true", req.url));
      }

      return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
    }

    return NextResponse.redirect(new URL("/verify-email?success=true", req.url));
  } catch (err) {
    console.error("[VERIFY EMAIL]", err);
    return NextResponse.redirect(new URL("/verify-email?error=server", req.url));
  }
}
