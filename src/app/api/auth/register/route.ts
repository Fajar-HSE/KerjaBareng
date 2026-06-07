import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/* ─── Rate limit config ─────────────────────────────────────── */
const REGISTER_LIMIT  = 5;   // max 5 percobaan
const REGISTER_WINDOW = 900; // per 15 menit per IP

export async function POST(req: NextRequest) {
  /* ── Rate limiting — cegah abuse & email spam ── */
  const ip     = getClientIp(req);
  const rl     = rateLimit({
    key:        `register:${ip}`,
    limit:      REGISTER_LIMIT,
    windowSecs: REGISTER_WINDOW,
  });

  if (!rl.success) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      {
        status: 429,
        headers: {
          "Retry-After":      String(rl.retryAfter),
          "X-RateLimit-Limit": String(REGISTER_LIMIT),
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const fullName = String(body?.fullName ?? "").trim();
    const email    = String(body?.email    ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");

    /* ── Validasi input ── */
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }

    if (fullName.length > 100) {
      return NextResponse.json({ error: "Nama terlalu panjang." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: "Password harus antara 8–72 karakter." },
        { status: 400 }
      );
    }

    /* ── Cek email sudah terdaftar ──────────────────────────────────
     * EMAIL ENUMERATION MITIGATION:
     * Kita TIDAK membedakan response antara email sudah terdaftar vs belum.
     * Selalu return 200 dengan pesan generik agar attacker tidak bisa enumerate
     * email valid melalui perbedaan response.
     * ─────────────────────────────────────────────────────────────── */
    const existing = await prisma.profile.findUnique({
      where:  { email },
      select: { id: true, emailVerified: true },
    });

    if (existing) {
      /* Kirim email "sudah terdaftar" secara silent — user yang legitimate
       * akan tau karena dapat email notifikasi, attacker tidak dapat sinyal */
      try {
        await sendAlreadyRegisteredEmail(email);
      } catch {
        /* Silent — jangan bocorkan error email ke response */
      }

      /* Return 200 identik — attacker tidak bisa bedakan */
      return NextResponse.json(
        { message: "Jika email valid dan belum terdaftar, link verifikasi akan dikirim." },
        { status: 200 }
      );
    }

    /* ── Hash password ── */
    const passwordHash = await bcrypt.hash(password, 12);

    /* ── Token verifikasi (expire 24 jam) ── */
    const verifyToken   = crypto.randomBytes(32).toString("hex");
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    /* ── Simpan ke DB ── */
    const user = await prisma.profile.create({
      data: {
        fullName,
        email,
        passwordHash,
        role:               "user",
        emailVerifyToken:   verifyToken,
        emailVerifyExpires: verifyExpires,
        emailVerified:      false,
      },
    });

    /* ── Kirim email verifikasi ── */
    await sendVerificationEmail({
      to:    user.email,
      name:  user.fullName,
      token: verifyToken,
    });

    /* Return 200 (bukan 201) — konsisten untuk cegah enumeration */
    return NextResponse.json(
      { message: "Jika email valid dan belum terdaftar, link verifikasi akan dikirim." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

/* ── Email notifikasi untuk email yang sudah terdaftar ── */
async function sendAlreadyRegisteredEmail(email: string) {
  const { transporter } = await import("@/lib/mailer");
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  await transporter.sendMail({
    from:    `"KerjaBareng" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: "Percobaan Pendaftaran – KerjaBareng",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0">
        <tr>
          <td style="background:#1a5f7a;padding:28px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">KerjaBareng</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6">
              Seseorang mencoba mendaftar menggunakan alamat email ini di KerjaBareng,
              tetapi akun dengan email ini sudah ada.
            </p>
            <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6">
              Jika ini kamu, silakan <a href="${baseUrl}/login" style="color:#1a5f7a;font-weight:600">login di sini</a>.
              Jika lupa password, gunakan fitur "Lupa password?" di halaman login.
            </p>
            <p style="margin:0;color:#94a3b8;font-size:12px">
              Jika bukan kamu yang melakukan ini, abaikan email ini. Tidak ada perubahan pada akunmu.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}
