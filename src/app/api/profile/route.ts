import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma }    from "@/lib/prisma";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/profile ───────────────────────────────────────── */
export async function GET() {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const user = await prisma.profile.findUnique({
    where:  { id: auth.user.id },
    select: {
      id:        true,
      fullName:  true,
      email:     true,
      role:      true,
      division:  true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  return NextResponse.json(user);
}

/* ─── PATCH /api/profile ─────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  try {
    const body = await req.json();
    const { fullName, division, currentPassword, newPassword } = body;

    const updateData: Record<string, unknown> = {};

    /* Update nama / divisi */
    if (fullName !== undefined) {
      const name = String(fullName).trim();
      if (!name || name.length > 100) {
        return NextResponse.json({ error: "Nama tidak valid." }, { status: 400 });
      }
      updateData.fullName = name;
    }

    if (division !== undefined) {
      updateData.division = division ? String(division).trim() : null;
    }

    /* Update password */
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Password saat ini wajib diisi." }, { status: 400 });
      }
      if (String(newPassword).length < 8 || String(newPassword).length > 72) {
        return NextResponse.json({ error: "Password baru harus 8–72 karakter." }, { status: 400 });
      }

      const user = await prisma.profile.findUnique({
        where:  { id: auth.user.id },
        select: { passwordHash: true },
      });

      if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

      const valid = await bcrypt.compare(String(currentPassword), user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Password saat ini salah." }, { status: 400 });
      }

      updateData.passwordHash = await bcrypt.hash(String(newPassword), 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
    }

    const updated = await prisma.profile.update({
      where:  { id: auth.user.id },
      data:   updateData,
      select: { id: true, fullName: true, email: true, role: true, division: true, avatarUrl: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
