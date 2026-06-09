import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/tasks ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const status     = searchParams.get("status");
  const assignedTo = searchParams.get("assignedTo");
  const search     = searchParams.get("search");
  const page       = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit      = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const isAdmin    = auth.user.role === "admin";
  const userId     = auth.user.id;

  let query = supabaseAdmin
    .from("Task")
    .select("*, assignedTo:Profile!assignedToId(id, fullName, avatarUrl), assignedBy:Profile!assignedById(id, fullName), progresses:TaskProgress(count)", { count: "exact" });

  if (!isAdmin) {
    query = query.eq("assignedToId", userId);
  } else if (assignedTo) {
    query = query.eq("assignedToId", assignedTo);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: tasksData, count, error } = await query
    .order("status", { ascending: true })
    .order("deadline", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Gagal mengambil data tugas." }, { status: 500 });
  }

  interface SupabaseTask {
    progresses?: Array<{ count: number }> | null;
    [key: string]: unknown;
  }

  const tasks = (tasksData as SupabaseTask[] | null)?.map((t) => ({
    ...t,
    _count: { progresses: t.progresses?.[0]?.count || 0 },
  })) || [];

  const total = count || 0;

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
    const { title, description, assignedToId, deadline, targetType, priority, tags } = body;

    if (!title?.trim())    return NextResponse.json({ error: "Judul wajib diisi." },       { status: 400 });
    if (!assignedToId)     return NextResponse.json({ error: "Assignee wajib dipilih." },   { status: 400 });
    if (!deadline)         return NextResponse.json({ error: "Deadline wajib diisi." },     { status: 400 });

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ error: "Format deadline tidak valid." }, { status: 400 });
    }

    const VALID_PRIORITIES = ["high", "medium", "low"];
    const finalPriority = VALID_PRIORITIES.includes(priority) ? priority : "medium";

    /* Sanitasi tags: pastikan array of string, max 10 item, masing-masing max 50 karakter */
    let finalTags: string[] = [];
    if (Array.isArray(tags)) {
      finalTags = tags
        .map((t: unknown) => String(t ?? "").trim())
        .filter((t) => t.length > 0)
        .slice(0, 10)
        .map((t) => t.slice(0, 50));
    }

    const isAdmin = auth.user.role === "admin";
    const finalAssignee = isAdmin ? assignedToId : auth.user.id;

    const { data: assignee } = await supabaseAdmin
      .from("Profile")
      .select("id")
      .eq("id", finalAssignee)
      .single();

    if (!assignee) return NextResponse.json({ error: "Assignee tidak ditemukan." }, { status: 404 });

    const { data: task, error: createError } = await supabaseAdmin
      .from("Task")
      .insert({
        title:        title.trim(),
        description:  description?.trim() ?? null,
        assignedToId: finalAssignee,
        assignedById: auth.user.id,
        deadline:     deadlineDate.toISOString(),
        targetType:   targetType ?? "daily",
        status:       "pending",
        priority:     finalPriority,
        ...(finalTags.length > 0 ? { tags: finalTags } : {}),
      })
      .select("*, assignedTo:Profile!assignedToId(id, fullName), assignedBy:Profile!assignedById(id, fullName)")
      .single();

    if (createError || !task) {
      console.error("[POST /api/tasks] createError:", createError);
      return NextResponse.json(
        { error: createError?.message ?? "Gagal membuat tugas." },
        { status: 500 }
      );
    }

    if (finalAssignee !== auth.user.id) {
      await supabaseAdmin.from("Notification").insert({
        userId:  finalAssignee,
        title:   "Tugas Baru Ditugaskan",
        message: `${auth.user.name} menugaskan "${task.title}" kepadamu.`,
        type:    "assignment",
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tasks]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
