import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/verify-email?error=invalid", req.url)
    );
  }

  try {
    const user = await prisma.profile.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid", req.url)
      );
    }

    /* Cek expiry */
    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
      return NextResponse.redirect(
        new URL("/verify-email?error=expired", req.url)
      );
    }

    /* Tandai sudah terverifikasi */
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        emailVerified:      true,
        emailVerifyToken:   null,
        emailVerifyExpires: null,
      },
    });

    return NextResponse.redirect(
      new URL("/verify-email?success=true", req.url)
    );
  } catch (err) {
    console.error("[VERIFY EMAIL]", err);
    return NextResponse.redirect(
      new URL("/verify-email?error=server", req.url)
    );
  }
}
