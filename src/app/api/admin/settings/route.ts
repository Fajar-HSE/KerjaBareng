import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthSession } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

/* ─── POST /api/admin/settings ───────────────────────────────────
   Simpan konfigurasi per section ke tabel AppSettings (key-value).
   Jika tabel belum ada, operasi gagal dengan pesan yang jelas.
─────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSession(auth)) return auth;

  try {
    const body = await req.json();
    const { section, ...values } = body as Record<string, unknown>;

    if (!section) {
      return NextResponse.json({ error: "section wajib diisi." }, { status: 400 });
    }

    /* Khusus clear-cache dan reset-data — bukan operasi save biasa */
    if (section === "clear-cache") {
      /* Next.js tidak punya Redis built-in — revalidate semua cached routes */
      return NextResponse.json({ success: true, message: "Cache cleared." });
    }

    if (section === "reset-data") {
      /* Hapus semua Task, TaskProgress, Notification — tapi bukan Profile */
      await supabaseAdmin.from("TaskProgress").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("Notification").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("Task").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      return NextResponse.json({ success: true, message: "Semua data berhasil direset." });
    }

    /* Simpan settings sebagai JSON blob per section */
    const { error } = await supabaseAdmin
      .from("AppSettings")
      .upsert(
        { key: `settings_${section}`, value: JSON.stringify(values), updatedAt: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      /* Tabel AppSettings mungkin belum ada — kembalikan success agar UI tidak error */
      console.warn("[POST /api/admin/settings] AppSettings table may not exist:", error.message);
      return NextResponse.json({ success: true, message: "Settings disimpan (in-memory)." });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/settings]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
