import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/dashboard ─────────────────────────────────────── */
export async function GET() {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const isAdmin = auth.user.role === "admin";
  const userId  = auth.user.id;

  const taskWhere = isAdmin ? {} : { assignedToId: userId };
  const today     = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd   = new Date(today.setHours(23, 59, 59, 999));

  const [
    totalTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    doneTodayTasks,
    recentActivity,
    teamMembers,
  ] = await Promise.all([
    /* Stat counts */
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: "pending"     } }),
    prisma.task.count({ where: { ...taskWhere, status: "in_progress" } }),
    prisma.task.count({ where: { ...taskWhere, status: "overdue"     } }),
    prisma.task.count({
      where: {
        ...taskWhere,
        status:    "done",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
    }),

    /* Recent tasks */
    prisma.task.findMany({
      where:   taskWhere,
      orderBy: { updatedAt: "desc" },
      take:    8,
      include: {
        assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    }),

    /* Team members (admin only) */
    isAdmin
      ? prisma.profile.findMany({
          where:   { role: "user" },
          select:  { id: true, fullName: true, avatarUrl: true, division: true },
          orderBy: { fullName: "asc" },
          take:    20,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    stats: {
      total:      totalTasks,
      pending:    pendingTasks,
      inProgress: inProgressTasks,
      overdue:    overdueTasks,
      doneToday:  doneTodayTasks,
    },
    recentTasks:  recentActivity,
    teamMembers:  isAdmin ? teamMembers : [],
  });
}
