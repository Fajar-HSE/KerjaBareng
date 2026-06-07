import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

/* ─── GET /api/health ────────────────────────────────────────── */
export async function GET() {
  const start = Date.now();

  let dbStatus = "ok";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  const totalLatency = Date.now() - start;

  const status = dbStatus === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status:    dbStatus === "ok" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime:    process.uptime(),
      latency:   { total: totalLatency, db: dbLatency },
      services: {
        database: { status: dbStatus, latencyMs: dbLatency },
        api:      { status: "ok" },
      },
    },
    { status }
  );
}
