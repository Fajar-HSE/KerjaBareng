import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isAuthSession } from "@/lib/api-auth";

/* ─── GET /api/admin/users ──────────────────────────────────────
   Ambil semua profil pengguna (khusus admin)
─────────────────────────────────────────────────────────────── */
export async function GET() {
  const auth = await requireAdmin();
  if (!isAuthSession(auth)) return auth;

  const { data: users, error } = await supabaseAdmin
    .from("Profile")
    .select("id, fullName, email, role, division, avatarUrl, emailVerified, isActive, createdAt, updatedAt")
    .order("fullName", { ascending: true });

  if (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ error: "Gagal mengambil data anggota." }, { status: 500 });
  }

  const userIds = (users || []).map((u) => u.id);

  /* Ambil task stats per user dalam satu query */
  let statsMap: Record<string, { done: number; pending: number; overdue: number }> = {};
  if (userIds.length > 0) {
    const { data: tasks } = await supabaseAdmin
      .from("Task")
      .select("assignedToId, status")
      .in("assignedToId", userIds);

    if (tasks) {
      for (const t of tasks) {
        if (!statsMap[t.assignedToId]) statsMap[t.assignedToId] = { done: 0, pending: 0, overdue: 0 };
        if (t.status === "done")       statsMap[t.assignedToId].done++;
        else if (t.status === "pending" || t.status === "in_progress") statsMap[t.assignedToId].pending++;
        else if (t.status === "overdue") statsMap[t.assignedToId].overdue++;
      }
    }
  }

  const result = (users || []).map((u) => ({
    ...u,
    status: u.isActive === false ? "inactive" : "active",
    stats: {
      done:    statsMap[u.id]?.done    ?? 0,
      pending: statsMap[u.id]?.pending ?? 0,
      overdue: statsMap[u.id]?.overdue ?? 0,
      streak:  0, // streak requires additional computation; placeholder
    },
    lastActive: u.updatedAt
      ? new Date(u.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
      : "—",
  }));

  return NextResponse.json(result);
}

/* ─── PATCH /api/admin/users?id=... ────────────────────────────
   Update role dan/atau division user (khusus admin)
─────────────────────────────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSession(auth)) return auth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID user wajib diisi." }, { status: 400 });

  /* Proteksi: admin tidak bisa downgrade dirinya sendiri */
  if (id === auth.user.id) {
    return NextResponse.json({ error: "Anda tidak dapat mengubah role akun Anda sendiri." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { fullName, role, division, isActive } = body as {
      fullName?: string;
      role?: "admin" | "user";
      division?: string;
      isActive?: boolean;
    };

    const updateData: Record<string, unknown> = {};

    if (fullName !== undefined) {
      const name = String(fullName).trim();
      if (!name || name.length > 100) {
        return NextResponse.json({ error: "Nama tidak valid." }, { status: 400 });
      }
      updateData.fullName = name;
    }

    if (role !== undefined) {
      if (!["admin", "user"].includes(role)) {
        return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
      }
      updateData.role = role;
    }

    if (division !== undefined) {
      updateData.division = division ? String(division).trim() : null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("Profile")
      .update(updateData)
      .eq("id", id)
      .select("id, fullName, email, role, division, avatarUrl, emailVerified, isActive, createdAt, updatedAt")
      .single();

    if (updateError || !updated) throw updateError;

    return NextResponse.json({
      ...updated,
      status: updated.isActive === false ? "inactive" : "active",
    });
  } catch (err) {
    console.error("[PATCH /api/admin/users]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

/* ─── DELETE /api/admin/users?id=... ───────────────────────────
   Hapus user dari database (khusus admin)
─────────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSession(auth)) return auth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID user wajib diisi." }, { status: 400 });

  /* Proteksi: admin tidak bisa hapus dirinya sendiri */
  if (id === auth.user.id) {
    return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri." }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("Profile").delete().eq("id", id);

  if (error) {
    console.error("[DELETE /api/admin/users]", error);
    return NextResponse.json({ error: "Gagal menghapus user." }, { status: 500 });
  }

  return NextResponse.json({ message: "Anggota berhasil dihapus." });
}
