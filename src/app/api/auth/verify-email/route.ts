import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length > 128) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  try {
    /* Atomic update — cegah race condition dari double-click */
    const updated = await prisma.profile.updateMany({
      where: {
        emailVerifyToken:   token,
        emailVerifyExpires: { gt: new Date() },   // belum expired
        emailVerified:      false,                 // belum terverifikasi
      },
      data: {
        emailVerified:      true,
        emailVerifyToken:   null,
        emailVerifyExpires: null,
      },
    });

    if (updated.count === 0) {
      /* Token tidak ditemukan atau sudah dipakai atau expired — bersihkan expired token */
      await prisma.profile.updateMany({
        where: {
          emailVerifyToken:   token,
          emailVerifyExpires: { lt: new Date() },
        },
        data: {
          emailVerifyToken:   null,
          emailVerifyExpires: null,
        },
      });

      /* Cek apakah user sudah terverifikasi (klik ulang link valid) */
      const alreadyVerified = await prisma.profile.findFirst({
        where: { emailVerified: true, emailVerifyToken: null },
        select: { id: true },
      });

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
