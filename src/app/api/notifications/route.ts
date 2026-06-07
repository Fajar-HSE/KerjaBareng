import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/notifications ────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

  let query = supabaseAdmin
    .from("Notification")
    .select("*")
    .eq("userId", auth.user.id)
    .order("createdAt", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("isRead", false);
  }

  const { data: notifications } = await query;

  const { count: unreadCount } = await supabaseAdmin
    .from("Notification")
    .select("*", { count: "exact", head: true })
    .eq("userId", auth.user.id)
    .eq("isRead", false);

  return NextResponse.json({ notifications: notifications || [], unreadCount: unreadCount || 0 });
}

/* ─── PATCH /api/notifications — mark all read ───────────────── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const { id } = body as { id?: string };

  if (id) {
    await supabaseAdmin
      .from("Notification")
      .update({ isRead: true })
      .eq("id", id)
      .eq("userId", auth.user.id);
  } else {
    await supabaseAdmin
      .from("Notification")
      .update({ isRead: true })
      .eq("userId", auth.user.id)
      .eq("isRead", false);
  }

  return NextResponse.json({ success: true });
}

/* ─── DELETE /api/notifications/:id ─────────────────────────── */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

  await supabaseAdmin
    .from("Notification")
    .delete()
    .eq("id", id)
    .eq("userId", auth.user.id);

  return NextResponse.json({ success: true });
}
