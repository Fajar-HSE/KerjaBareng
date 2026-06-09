import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/chat?withUserId=xxx[&after=ISO] ───────────────────
   Ambil pesan DM antara user saat ini dan user lain.
   ?after=ISO  → hanya ambil pesan setelah timestamp (untuk polling)
─────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  const withUserId = req.nextUrl.searchParams.get("withUserId");
  const after      = req.nextUrl.searchParams.get("after"); // ISO string opsional

  if (!withUserId) {
    return NextResponse.json({ error: "withUserId wajib diisi." }, { status: 400 });
  }

  const myId = auth.user.id;

  let query = supabaseAdmin
    .from("DirectMessage")
    .select(`
      id, content, isRead, createdAt,
      sender:Profile!senderId(id, fullName),
      receiver:Profile!receiverId(id, fullName)
    `)
    .or(
      `and(senderId.eq.${myId},receiverId.eq.${withUserId}),` +
      `and(senderId.eq.${withUserId},receiverId.eq.${myId})`
    )
    .order("createdAt", { ascending: true })
    .limit(100);

  if (after) {
    query = query.gt("createdAt", after);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("[GET /api/chat]", error);
    return NextResponse.json({ error: "Gagal mengambil pesan." }, { status: 500 });
  }

  /* Mark pesan dari lawan bicara sebagai sudah dibaca */
  await supabaseAdmin
    .from("DirectMessage")
    .update({ isRead: true })
    .eq("senderId", withUserId)
    .eq("receiverId", myId)
    .eq("isRead", false);

  return NextResponse.json({ messages: messages || [] });
}

/* ─── POST /api/chat ─────────────────────────────────────────────
   Kirim pesan baru ke user lain.
─────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!isAuthSession(auth)) return auth;

  try {
    const { receiverId, content } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId wajib diisi." }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }
    if (content.trim().length > 2000) {
      return NextResponse.json({ error: "Pesan terlalu panjang (maks 2000 karakter)." }, { status: 400 });
    }
    if (receiverId === auth.user.id) {
      return NextResponse.json({ error: "Tidak bisa mengirim pesan ke diri sendiri." }, { status: 400 });
    }

    /* Pastikan receiver ada */
    const { data: receiver } = await supabaseAdmin
      .from("Profile")
      .select("id, fullName")
      .eq("id", receiverId)
      .single();

    if (!receiver) {
      return NextResponse.json({ error: "User tujuan tidak ditemukan." }, { status: 404 });
    }

    const { data: message, error } = await supabaseAdmin
      .from("DirectMessage")
      .insert({
        senderId:   auth.user.id,
        receiverId: receiverId,
        content:    content.trim(),
        isRead:     false,
      })
      .select(`
        id, content, isRead, createdAt,
        sender:Profile!senderId(id, fullName),
        receiver:Profile!receiverId(id, fullName)
      `)
      .single();

    if (error || !message) {
      console.error("[POST /api/chat]", error);
      return NextResponse.json({ error: "Gagal mengirim pesan." }, { status: 500 });
    }

    /* Buat notifikasi untuk receiver */
    await supabaseAdmin
      .from("Notification")
      .insert({
        userId:  receiverId,
        title:   `Pesan dari ${auth.user.name}`,
        message: content.trim().slice(0, 100),
        type:    "mention",
        isRead:  false,
      });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("[POST /api/chat]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
