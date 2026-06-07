import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  /* Rate limit: 5 percobaan per 15 menit per IP */
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
      return NextResponse.json(
        { error: "Password harus antara 8–72 karakter." },
        { status: 400 }
      );
    }

    /* Atomic update — cegah race condition */
    const updated = await prisma.profile.updateMany({
      where: {
        resetPasswordToken:   token,
        resetPasswordExpires: { gt: new Date() }, // belum expired
      },
      data: {
        passwordHash:         await bcrypt.hash(password, 12),
        resetPasswordToken:   null,
        resetPasswordExpires: null,
      },
    });

    if (updated.count === 0) {
      /* Token tidak ditemukan / sudah expired / sudah dipakai */
      return NextResponse.json(
        { error: "Token tidak valid atau sudah kadaluarsa." },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Password berhasil diubah. Silakan login." });
  } catch (err) {
    console.error("[RESET PASSWORD]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

/* GET: validasi token sebelum tampilkan form reset */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length > 128) {
    return NextResponse.json({ valid: false, error: "Token tidak valid." }, { status: 400 });
  }

  const user = await prisma.profile.findFirst({
    where: {
      resetPasswordToken:   token,
      resetPasswordExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ valid: false, error: "Token tidak valid atau sudah kadaluarsa." }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}
