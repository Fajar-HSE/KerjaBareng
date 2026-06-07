import { NextRequest, NextResponse } from "next/server";
import { prisma }      from "@/lib/prisma";
import { requireAuth, isAuthSession } from "@/lib/api-auth";
import { TaskStatus, TargetType }     from "@prisma/client";

/* ─── GET /api/tasks ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const status     = searchParams.get("status")   as TaskStatus | null;
  const assignedTo = searchParams.get("assignedTo");
  const search     = searchParams.get("search");
  const page       = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit      = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  /* User hanya lihat tugasnya sendiri; admin lihat semua */
  const isAdmin    = auth.user.role === "admin";
  const userId     = auth.user.id;

  const where = {
    ...(isAdmin ? {} : { assignedToId: userId }),
    ...(assignedTo && isAdmin ? { assignedToId: assignedTo } : {}),
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { title:       { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
        assignedBy: { select: { id: true, fullName: true } },
        _count:     { select: { progresses: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return NextResponse.json({
    tasks,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

/* ─── POST /api/tasks ────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  try {
    const body = await req.json();
    const { title, description, assignedToId, deadline, targetType } = body;

    /* Validasi */
    if (!title?.trim())    return NextResponse.json({ error: "Judul wajib diisi." },       { status: 400 });
    if (!assignedToId)     return NextResponse.json({ error: "Assignee wajib dipilih." },   { status: 400 });
    if (!deadline)         return NextResponse.json({ error: "Deadline wajib diisi." },     { status: 400 });

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ error: "Format deadline tidak valid." }, { status: 400 });
    }

    /* User hanya boleh assign ke diri sendiri */
    const isAdmin = auth.user.role === "admin";
    const finalAssignee = isAdmin ? assignedToId : auth.user.id;

    /* Cek assignee exists */
    const assignee = await prisma.profile.findUnique({
      where:  { id: finalAssignee },
      select: { id: true },
    });
    if (!assignee) return NextResponse.json({ error: "Assignee tidak ditemukan." }, { status: 404 });

    const task = await prisma.task.create({
      data: {
        title:       title.trim(),
        description: description?.trim() ?? null,
        assignedToId: finalAssignee,
        assignedById: auth.user.id,
        deadline:    deadlineDate,
        targetType:  (targetType as TargetType) ?? TargetType.daily,
        status:      "pending",
      },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        assignedBy: { select: { id: true, fullName: true } },
      },
    });

    /* Buat notifikasi untuk assignee */
    if (finalAssignee !== auth.user.id) {
      await prisma.notification.create({
        data: {
          userId:  finalAssignee,
          title:   "Tugas Baru Ditugaskan",
          message: `${auth.user.name} menugaskan "${task.title}" kepadamu.`,
          type:    "assignment",
        },
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tasks]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
