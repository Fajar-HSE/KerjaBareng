import { NextRequest, NextResponse } from "next/server";
import { prisma }      from "@/lib/prisma";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/notifications ────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: auth.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

/* ─── PATCH /api/notifications — mark all read ───────────────── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const { id } = body as { id?: string };

  if (id) {
    /* Mark single */
    await prisma.notification.updateMany({
      where: { id, userId: auth.user.id },
      data:  { isRead: true },
    });
  } else {
    /* Mark all */
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, isRead: false },
      data:  { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}

/* ─── DELETE /api/notifications/:id ─────────────────────────── */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

  await prisma.notification.deleteMany({
    where: { id, userId: auth.user.id },
  });

  return NextResponse.json({ success: true });
}
