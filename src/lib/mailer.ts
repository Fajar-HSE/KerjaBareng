import nodemailer from "nodemailer";

/* ── Env validation ──────────────────────────────────────────── */
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (process.env.NODE_ENV === "production" && (!smtpUser || !smtpPass)) {
  console.error("[MAILER] SMTP_USER dan SMTP_PASS wajib di-set di production.");
}

/** @internal — gunakan fungsi send* di bawah, bukan transporter langsung */
const smtpPort = Number(process.env.SMTP_PORT ?? 587);

export const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST ?? "smtp.gmail.com",
  port:   smtpPort,
  // secure: true untuk port 465 (SSL), false untuk port 587 (STARTTLS)
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendVerificationEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"KerjaBareng" <${process.env.SMTP_USER}>`,
    to,
    subject: "Verifikasi Email Kamu – KerjaBareng",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:#1a5f7a;padding:32px;text-align:center">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;margin-bottom:12px">
              <span style="color:#fff;font-size:24px">💼</span>
            </div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;letter-spacing:-0.02em">KerjaBareng</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px">
            <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">Halo, ${name}! 👋</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
              Terima kasih sudah mendaftar di KerjaBareng. Klik tombol di bawah untuk memverifikasi alamat email kamu dan mengaktifkan akun.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#1a5f7a;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.01em">
                Verifikasi Email Saya
              </a>
            </div>
            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-align:center">
              Link berlaku selama <strong>24 jam</strong>.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5">
              Jika kamu tidak mendaftar di KerjaBareng, abaikan email ini.<br>
              Link verifikasi: <span style="color:#1a5f7a;word-break:break-all">${verifyUrl}</span>
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

export async function sendInviteEmail({
  to,
  inviterName,
  role,
  token,
}: {
  to: string;
  inviterName: string;
  role: "admin" | "user";
  token: string;
}) {
  const baseUrl   = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  // Link langsung ke halaman reset-password agar user bisa set password sendiri
  const inviteUrl = `${baseUrl}/reset-password?token=${token}&invite=1`;
  const roleLabel = role === "admin" ? "Admin" : "Member";

  await transporter.sendMail({
    from: `"KerjaBareng" <${process.env.SMTP_USER}>`,
    to,
    subject: `Kamu diundang ke KerjaBareng sebagai ${roleLabel}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:#1a5f7a;padding:32px;text-align:center">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;margin-bottom:12px">
              <span style="color:#fff;font-size:24px">💼</span>
            </div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;letter-spacing:-0.02em">KerjaBareng</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px">
            <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">Kamu mendapat undangan! 🎉</h2>
            <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6">
              <strong>${inviterName}</strong> mengundangmu bergabung ke <strong>KerjaBareng</strong> sebagai <strong>${roleLabel}</strong>.
            </p>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
              Klik tombol di bawah untuk mengaktifkan akun dan membuat password kamu.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${inviteUrl}"
                 style="display:inline-block;background:#1a5f7a;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.01em">
                Aktifkan Akun Saya
              </a>
            </div>
            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-align:center">
              Link berlaku selama <strong>7 hari</strong>.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5">
              Jika kamu tidak mengenal KerjaBareng atau tidak mengharapkan undangan ini, abaikan email ini.<br>
              Link aktivasi: <span style="color:#1a5f7a;word-break:break-all">${inviteUrl}</span>
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
