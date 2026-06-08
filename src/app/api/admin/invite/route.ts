import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isAuthSession } from "@/lib/api-auth";
import { sendInviteEmail } from "@/lib/mailer";

/* ─── POST /api/admin/invite ────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSession(auth)) return auth;

  try {
    const body = await req.json();
    const { emails, role = "user", division } = body as {
      emails: string[];
      role: "admin" | "user";
      division?: string;
    };

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Minimal satu email diperlukan." }, { status: 400 });
    }

    const results: { email: string; status: "invited" | "already_exists" | "error" }[] = [];

    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({ email, status: "error" });
        continue;
      }

      /* Cek apakah email sudah terdaftar */
      const { data: existing } = await supabaseAdmin
        .from("Profile")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        results.push({ email, status: "already_exists" });
        continue;
      }

      /* Buat akun sementara dengan password random + token verifikasi */
      const tempPassword  = crypto.randomBytes(12).toString("hex"); // user harus reset password
      const passwordHash  = await bcrypt.hash(tempPassword, 12);
      const verifyToken   = crypto.randomBytes(32).toString("hex");
      const verifyExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari

      const { data: newUser, error: createError } = await supabaseAdmin
        .from("Profile")
        .insert({
          fullName:           email.split("@")[0], // placeholder, user ubah di profil
          email,
          passwordHash,
          role,
          division:           division || null,
          emailVerifyToken:   verifyToken,
          emailVerifyExpires: verifyExpires.toISOString(),
          emailVerified:      false,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error("[INVITE] create error:", createError);
        results.push({ email, status: "error" });
        continue;
      }

      /* Kirim email undangan */
      try {
        await sendInviteEmail({
          to:          email,
          inviterName: auth.user.name,
          role,
          token:       verifyToken,
        });
        results.push({ email, status: "invited" });
      } catch (mailErr) {
        console.error("[INVITE] mail error:", mailErr);
        /* Hapus user yang baru dibuat jika email gagal kirim */
        await supabaseAdmin.from("Profile").delete().eq("id", newUser.id);
        results.push({ email, status: "error" });
      }
    }

    const invited = results.filter((r) => r.status === "invited").length;
    const alreadyExists = results.filter((r) => r.status === "already_exists").length;
    const failed = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      message: `${invited} undangan terkirim.${alreadyExists ? ` ${alreadyExists} email sudah terdaftar.` : ""}${failed ? ` ${failed} gagal.` : ""}`,
      results,
    });
  } catch (err) {
    console.error("[POST /api/admin/invite]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
