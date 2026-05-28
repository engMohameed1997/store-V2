import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbStatus = "ok";

  try {
    await db.$queryRawUnsafe("SELECT 1");
  } catch {
    dbStatus = "unreachable";
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    responseTime: `${Date.now() - start}ms`,
  }, { status: dbStatus === "ok" ? 200 : 503 });
}
