import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/* ─── GET /api/health ────────────────────────────────────────── */
export async function GET() {
  const start = Date.now();

  let dbStatus = "ok";
  let dbLatency = 0;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    const { error } = await supabaseAdmin.from("Profile").select("id").limit(1);
    if (error) {
      dbError = `${error.code}: ${error.message}`;
      throw error;
    }
    dbLatency = Date.now() - dbStart;
  } catch (err: unknown) {
    dbStatus = "error";
    if (!dbError && err instanceof Error) dbError = err.message;
  }

  const totalLatency = Date.now() - start;
  const status = dbStatus === "ok" ? 200 : 503;

  // Log ke server console agar bisa dilihat di terminal
  if (dbError) console.error("[health] DB error:", dbError);

  return NextResponse.json(
    {
      status:    dbStatus === "ok" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime:    process.uptime(),
      latency:   { total: totalLatency, db: dbLatency },
      services: {
        database: { status: dbStatus, latencyMs: dbLatency, error: dbError },
        api:      { status: "ok" },
      },
    },
    { status }
  );
}
