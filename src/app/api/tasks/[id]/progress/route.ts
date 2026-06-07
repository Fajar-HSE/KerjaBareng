import { NextRequest, NextResponse } from "next/server";
import { prisma }      from "@/lib/prisma";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

type Params = { params: { id: string } };

/* ─── POST /api/tasks/:id/progress ──────────────────────────── */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  /* Hanya assignee atau admin yang bisa tambah progress */
  if (auth.user.role !== "admin" && task.assignedToId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { progressNote, isChecklist, attachmentUrls } = await req.json();

    const progress = await prisma.taskProgress.create({
      data: {
        taskId:        params.id,
        userId:        auth.user.id,
        progressNote:  progressNote?.trim() ?? null,
        isChecklist:   isChecklist === true,
        attachmentUrls: Array.isArray(attachmentUrls) ? attachmentUrls : [],
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    /* Jika checklist selesai, update status task → done */
    if (isChecklist === true) {
      await prisma.task.update({
        where: { id: params.id },
        data:  { status: "done" },
      });

      /* Notifikasi untuk admin/assignedBy */
      if (task.assignedById !== auth.user.id) {
        await prisma.notification.create({
          data: {
            userId:  task.assignedById,
            title:   "Tugas Selesai",
            message: `${auth.user.name} menandai "${task.title}" sebagai selesai.`,
            type:    "assignment",
          },
        });
      }
    }

    return NextResponse.json(progress, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tasks/:id/progress]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
