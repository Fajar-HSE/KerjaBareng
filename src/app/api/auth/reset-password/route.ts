import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/* Helper: cari user berdasarkan token (reset biasa atau invite) */
async function findUserByToken(token: string) {
  const now = new Date().toISOString();

  // Coba resetPasswordToken dulu (flow lupa password)
  const { data: byReset } = await supabaseAdmin
    .from("Profile")
    .select("id, emailVerified")
    .eq("resetPasswordToken", token)
    .gt("resetPasswordExpires", now)
    .maybeSingle();

  if (byReset) return { user: byReset, source: "reset" as const };

  // Fallback ke emailVerifyToken (flow invite)
  const { data: byInvite } = await supabaseAdmin
    .from("Profile")
    .select("id, emailVerified")
    .eq("emailVerifyToken", token)
    .gt("emailVerifyExpires", now)
    .maybeSingle();

  if (byInvite) return { user: byInvite, source: "invite" as const };

  return null;
}

/* ─── GET: validasi token sebelum tampilkan form ───────────── */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token.length > 128) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const found = await findUserByToken(token);
  if (!found) {
    return NextResponse.json({ valid: false, error: "Token tidak valid atau sudah kadaluarsa." }, { status: 400 });
  }

  return NextResponse.json({ valid: true, source: found.source });
}

/* ─── POST: simpan password baru ───────────────────────────── */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `reset:${ip}`, limit: 5, windowSecs: 900 });
  if (!rl.success) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string" || token.length > 128) {
      return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password wajib diisi." }, { status: 400 });
    }
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json({ error: "Password harus antara 8–72 karakter." }, { status: 400 });
    }

    const found = await findUserByToken(token);
    if (!found) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (found.source === "reset") {
      // Flow reset password biasa
      await supabaseAdmin
        .from("Profile")
        .update({ passwordHash, resetPasswordToken: null, resetPasswordExpires: null })
        .eq("id", found.user.id);
    } else {
      // Flow invite — set password + verifikasi email sekaligus
      await supabaseAdmin
        .from("Profile")
        .update({
          passwordHash,
          emailVerified:      true,
          emailVerifyToken:   null,
          emailVerifyExpires: null,
        })
        .eq("id", found.user.id);
    }

    return NextResponse.json({
      message: found.source === "invite"
        ? "Akun berhasil diaktifkan! Silakan login."
        : "Password berhasil diubah. Silakan login.",
      source: found.source,
    });
  } catch (err) {
    console.error("[RESET PASSWORD]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
