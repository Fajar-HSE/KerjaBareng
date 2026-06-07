import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

type Params = { params: { id: string } };

/* ─── GET /api/tasks/:id ─────────────────────────────────────── */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const { data: task, error } = await supabaseAdmin
    .from("Task")
    .select(`
      *,
      assignedTo:Profile!assignedToId(id, fullName, avatarUrl, division),
      assignedBy:Profile!assignedById(id, fullName),
      progresses:TaskProgress(*, user:Profile!userId(id, fullName, avatarUrl)),
      messages:ChatMessage(*, sender:Profile!senderId(id, fullName, avatarUrl), receiver:Profile!receiverId(id, fullName))
    `)
    .eq("id", params.id)
    .single();

  if (error || !task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  if (auth.user.role !== "admin" && task.assignedToId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  interface SortableItem {
    createdAt: string;
  }

  // Sort progresses and messages since nested ordering in Supabase JS is limited
  if (task.progresses) {
    (task.progresses as SortableItem[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (task.messages) {
    (task.messages as SortableItem[]).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  return NextResponse.json(task);
}

/* ─── PUT /api/tasks/:id ─────────────────────────────────────── */
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const { data: task } = await supabaseAdmin.from("Task").select("id, assignedToId").eq("id", params.id).single();
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  const isAdmin  = auth.user.role === "admin";
  const isOwner  = task.assignedToId === auth.user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, description, deadline, status, targetType } = body;

    const updateData = isAdmin
      ? {
          ...(title       ? { title: title.trim() }                          : {}),
          ...(description !== undefined ? { description }                    : {}),
          ...(deadline    ? { deadline: new Date(deadline).toISOString() }   : {}),
          ...(status      ? { status }                 : {}),
          ...(targetType  ? { targetType }                                   : {}),
        }
      : {
          ...(status ? { status } : {}),
        };

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada field yang diupdate." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("Task")
      .update(updateData)
      .eq("id", params.id)
      .select("*, assignedTo:Profile!assignedToId(id, fullName), assignedBy:Profile!assignedById(id, fullName)")
      .single();

    if (updateError || !updated) throw updateError;

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

  const { data: task } = await supabaseAdmin.from("Task").select("id").eq("id", params.id).single();
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

  await supabaseAdmin.from("Task").delete().eq("id", params.id);
  return NextResponse.json({ message: "Task berhasil dihapus." });
}
