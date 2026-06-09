import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* Endpoint debug sementara — HAPUS setelah masalah selesai */
export async function GET() {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  /* 1. Cek apakah ada task sama sekali */
  const { data: allTasks, error: e1 } = await supabaseAdmin
    .from("Task")
    .select("id, title, status, assignedToId, assignedById, createdAt")
    .limit(10);

  /* 2. Cek nama kolom yang tersedia di Task */
  const { data: taskSample, error: e2 } = await supabaseAdmin
    .from("Task")
    .select("*")
    .limit(1);

  /* 3. Cek join ke Profile */
  const { data: taskWithProfile, error: e3 } = await supabaseAdmin
    .from("Task")
    .select("id, title, assignedTo:Profile!assignedToId(id, fullName)")
    .limit(1);

  /* 4. Cek Profile yang ada */
  const { data: profiles, error: e4 } = await supabaseAdmin
    .from("Profile")
    .select("id, fullName, role, email")
    .limit(10);

  return NextResponse.json({
    currentUser: { id: auth.user.id, role: auth.user.role, email: auth.user.email },
    allTasks:        { data: allTasks,        error: e1?.message },
    taskColumns:     { data: taskSample ? Object.keys(taskSample[0] || {}) : [], error: e2?.message },
    taskWithProfile: { data: taskWithProfile, error: e3?.message },
    profiles:        { data: profiles,        error: e4?.message },
  });
}
