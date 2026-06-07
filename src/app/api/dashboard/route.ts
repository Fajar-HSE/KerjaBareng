import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/dashboard ─────────────────────────────────────── */
export async function GET() {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const isAdmin = auth.user.role === "admin";
  const userId  = auth.user.id;

  const today     = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd   = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const getTaskCount = async (status?: string, doneToday?: boolean) => {
    let q = supabaseAdmin.from("Task").select("*", { count: "exact", head: true });
    if (!isAdmin) q = q.eq("assignedToId", userId);
    if (status) q = q.eq("status", status);
    if (doneToday) {
      q = q.gte("updatedAt", todayStart).lte("updatedAt", todayEnd);
    }
    const { count } = await q;
    return count || 0;
  };

  const getRecentTasks = async () => {
    let q = supabaseAdmin
      .from("Task")
      .select("*, assignedTo:Profile!assignedToId(id, fullName, avatarUrl)")
      .order("updatedAt", { ascending: false })
      .limit(8);
    if (!isAdmin) q = q.eq("assignedToId", userId);
    const { data } = await q;
    return data || [];
  };

  const getTeamMembers = async () => {
    if (!isAdmin) return [];
    const { data } = await supabaseAdmin
      .from("Profile")
      .select("id, fullName, avatarUrl, division")
      .eq("role", "user")
      .order("fullName", { ascending: true })
      .limit(20);
    return data || [];
  };

  const [
    totalTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    doneTodayTasks,
    recentActivity,
    teamMembers,
  ] = await Promise.all([
    getTaskCount(),
    getTaskCount("pending"),
    getTaskCount("in_progress"),
    getTaskCount("overdue"),
    getTaskCount("done", true),
    getRecentTasks(),
    getTeamMembers(),
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
    teamMembers:  teamMembers,
  });
}
