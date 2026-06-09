import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/chat/contacts ─────────────────────────────────────
   Ambil semua user selain diri sendiri + unread count per user.
─────────────────────────────────────────────────────────────── */
export async function GET() {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const myId = auth.user.id;

  /* Semua user lain */
  const { data: users, error } = await supabaseAdmin
    .from("Profile")
    .select("id, fullName, division, role")
    .neq("id", myId)
    .order("fullName", { ascending: true });

  if (error) {
    console.error("[GET /api/chat/contacts]", error);
    return NextResponse.json({ error: "Gagal mengambil kontak." }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ contacts: [] });
  }

  /* Unread count: pesan masuk yang belum dibaca, per sender */
  const { data: unreadRows } = await supabaseAdmin
    .from("DirectMessage")
    .select("senderId")
    .eq("receiverId", myId)
    .eq("isRead", false);

  const unreadMap: Record<string, number> = {};
  for (const row of unreadRows ?? []) {
    unreadMap[row.senderId] = (unreadMap[row.senderId] ?? 0) + 1;
  }

  /* Pesan terakhir per konversasi */
  const userIds = users.map((u) => u.id);

  const { data: lastMessages } = await supabaseAdmin
    .from("DirectMessage")
    .select("id, senderId, receiverId, content, createdAt")
    .or(
      `and(senderId.eq.${myId},receiverId.in.(${userIds.join(",")})),` +
      `and(receiverId.eq.${myId},senderId.in.(${userIds.join(",")}))`
    )
    .order("createdAt", { ascending: false });

  /* Petakan pesan terakhir per user */
  const lastMsgMap: Record<string, { content: string; createdAt: string }> = {};
  for (const msg of lastMessages ?? []) {
    const otherId = msg.senderId === myId ? msg.receiverId : msg.senderId;
    if (!lastMsgMap[otherId]) {
      lastMsgMap[otherId] = { content: msg.content, createdAt: msg.createdAt };
    }
  }

  const contacts = users.map((u) => ({
    id:          u.id,
    fullName:    u.fullName,
    initial:     (u.fullName || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    division:    u.division ?? null,
    role:        u.role,
    unread:      unreadMap[u.id] ?? 0,
    lastMessage: lastMsgMap[u.id]?.content ?? null,
    lastTime:    lastMsgMap[u.id]?.createdAt ?? null,
  }));

  /* Urutkan: ada riwayat pesan dulu (terbaru di atas), lalu sisanya alfabet */
  contacts.sort((a, b) => {
    if (a.lastTime && b.lastTime) return b.lastTime.localeCompare(a.lastTime);
    if (a.lastTime) return -1;
    if (b.lastTime) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  return NextResponse.json({ contacts });
}
