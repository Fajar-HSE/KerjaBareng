import { NextRequest, NextResponse } from "next/server";
import { prisma }      from "@/lib/prisma";
import { requireAuth, isAuthSession } from "@/lib/api-auth";
import { TaskStatus }  from "@prisma/client";

type Params = { params: { id: string } };

/* ─── GET /api/tasks/:id ─────────────────────────────────────── */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const task = await prisma.task.findUnique({
    where:   { id: params.id },
    include: {
      assignedTo: { select: { id: true, fullName: true, avatarUrl: true, division: true } },
      assignedBy: { select: { id: true, fullName: true } },
      progresses: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender:   { select: { id: true, fullName: true, avatarUrl: true } },
          receiver: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  /* User hanya boleh lihat tugasnya sendiri */
  if (auth.user.role !== "admin" && task.assignedToId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(task);
}

/* ─── PUT /api/tasks/:id ─────────────────────────────────────── */
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  /* Hanya admin atau assignee yang bisa update */
  const isAdmin  = auth.user.role === "admin";
  const isOwner  = task.assignedToId === auth.user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, description, deadline, status, targetType } = body;

    /* User biasa hanya boleh update status */
    const updateData = isAdmin
      ? {
          ...(title       ? { title: title.trim() }                          : {}),
          ...(description !== undefined ? { description }                    : {}),
          ...(deadline    ? { deadline: new Date(deadline) }                 : {}),
          ...(status      ? { status: status as TaskStatus }                 : {}),
          ...(targetType  ? { targetType }                                   : {}),
        }
      : {
          ...(status ? { status: status as TaskStatus } : {}),
        };

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada field yang diupdate." }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data:  updateData,
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        assignedBy: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/tasks/:id]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

/* ─── DELETE /api/tasks/:id ─── admin only ───────────────────── */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Task berhasil dihapus." });
}
