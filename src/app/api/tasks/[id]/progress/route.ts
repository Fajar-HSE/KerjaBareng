import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

type Params = { params: { id: string } };

/* ─── POST /api/tasks/:id/progress ──────────────────────────── */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const { data: task } = await supabaseAdmin.from("Task").select("id, assignedToId, assignedById, title").eq("id", params.id).single();
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  if (auth.user.role !== "admin" && task.assignedToId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { progressNote, isChecklist, attachmentUrls } = await req.json();

    const { data: progress, error: createError } = await supabaseAdmin
      .from("TaskProgress")
      .insert({
        taskId:        params.id,
        userId:        auth.user.id,
        progressNote:  progressNote?.trim() ?? null,
        isChecklist:   isChecklist === true,
        attachmentUrls: Array.isArray(attachmentUrls) ? attachmentUrls : [],
      })
      .select("*, user:Profile!userId(id, fullName, avatarUrl)")
      .single();

    if (createError || !progress) throw createError;

    if (isChecklist === true) {
      await supabaseAdmin
        .from("Task")
        .update({ status: "done", updatedAt: new Date().toISOString() })
        .eq("id", params.id);

      if (task.assignedById !== auth.user.id) {
        await supabaseAdmin.from("Notification").insert({
          userId:  task.assignedById,
          title:   "Tugas Selesai",
          message: `${auth.user.name} menandai "${task.title}" sebagai selesai.`,
          type:    "assignment",
        });
      }
    }

    return NextResponse.json(progress, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tasks/:id/progress]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
