import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthSession } from "@/lib/api-auth";

/* ─── POST /api/admin/test-smtp ──────────────────────────────────
   Test koneksi SMTP dengan kredensial yang diberikan.
─────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSession(auth)) return auth;

  try {
    const { host, port, user, pass, fromName, secure } = await req.json();

    if (!host || !port || !user || !pass) {
      return NextResponse.json({ error: "host, port, user, dan pass wajib diisi." }, { status: 400 });
    }

    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host:   String(host),
      port:   Number(port),
      secure: Boolean(secure),
      auth:   { user: String(user), pass: String(pass) },
    });

    /* Verify koneksi */
    await transporter.verify();

    /* Kirim email test ke admin sendiri */
    await transporter.sendMail({
      from:    `"${fromName ?? "KerjaBareng"}" <${user}>`,
      to:      auth.user.email,
      subject: "✅ Test Email — KerjaBareng",
      html: `
        <div style="font-family:sans-serif;padding:20px;background:#f8fafc">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0">
            <h2 style="color:#1a5f7a;margin:0 0 12px">Konfigurasi SMTP Berhasil!</h2>
            <p style="color:#475569;font-size:14px">Email test ini dikirim dari pengaturan SMTP KerjaBareng.</p>
            <p style="color:#475569;font-size:14px">Host: <strong>${host}:${port}</strong></p>
            <p style="color:#94a3b8;font-size:12px;margin-top:20px">Dikirim otomatis oleh KerjaBareng Admin</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: `Email test berhasil dikirim ke ${auth.user.email}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal terhubung ke server SMTP.";
    console.error("[POST /api/admin/test-smtp]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
