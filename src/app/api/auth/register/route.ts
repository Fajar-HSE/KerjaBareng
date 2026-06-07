import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password } = await req.json();

    /* ── Validasi input ── */
    if (!fullName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    /* ── Cek email sudah terdaftar ── */
    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 }
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
        fullName:           fullName.trim(),
        email:              email.toLowerCase().trim(),
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

    return NextResponse.json(
      { message: "Registrasi berhasil. Cek email kamu untuk verifikasi." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
