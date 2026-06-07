import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { transporter } from "@/lib/mailer";

const RESET_EXPIRES_HOURS = 1;

export async function POST(req: NextRequest) {
  /* Rate limit: 3 request per 15 menit per IP */
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `forgot:${ip}`, limit: 3, windowSecs: 900 });
  if (!rl.success) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    /* Anti-enumeration: selalu return 200 */
    const user = await prisma.profile.findUnique({
      where:  { email: normalizedEmail },
      select: { id: true, fullName: true, email: true },
    });

    if (user) {
      const token   = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + RESET_EXPIRES_HOURS * 60 * 60 * 1000);

      await prisma.profile.update({
        where: { id: user.id },
        data:  { resetPasswordToken: token, resetPasswordExpires: expires },
      });

      const baseUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await transporter.sendMail({
        from:    `"KerjaBareng" <${process.env.SMTP_USER}>`,
        to:      user.email,
        subject: "Reset Password – KerjaBareng",
        html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <tr><td style="background:#1a5f7a;padding:28px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">KerjaBareng</h1>
      </td></tr>
      <tr><td style="padding:32px">
        <h2 style="margin:0 0 8px;font-size:17px;color:#0f172a">Reset Password</h2>
        <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
          Halo <strong>${user.fullName}</strong>, kami menerima permintaan reset password untuk akunmu.
          Klik tombol di bawah untuk membuat password baru.
        </p>
        <div style="text-align:center;margin:24px 0">
          <a href="${resetUrl}" style="display:inline-block;background:#1a5f7a;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600">
            Reset Password Saya
          </a>
        </div>
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center">
          Link berlaku <strong>${RESET_EXPIRES_HOURS} jam</strong>. Jika bukan kamu, abaikan email ini.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
        <p style="margin:0;color:#94a3b8;font-size:11px;word-break:break-all">${resetUrl}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
      });
    }

    /* Selalu 200 — cegah email enumeration */
    return NextResponse.json({
      message: "Jika email terdaftar, link reset password akan dikirim.",
    });
  } catch (err) {
    console.error("[FORGOT PASSWORD]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
