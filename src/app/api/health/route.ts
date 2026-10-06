import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { APP_VERSION_CONFIG } from "@/config/version";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" | "error" = "disconnected";
  let dbLatencyMs = 0;

  try {
    const dbPingStart = Date.now();
    await connectToDatabase();
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      dbStatus = "connected";
      dbLatencyMs = Date.now() - dbPingStart;
    }
  } catch (error: any) {
    dbStatus = "error";
  }

  const isHealthy = dbStatus === "connected";
  const totalResponseTime = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: totalResponseTime,
      version: APP_VERSION_CONFIG.version,
      buildNumber: APP_VERSION_CONFIG.buildNumber,
      channel: APP_VERSION_CONFIG.channel,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: "MongoDB Atlas",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
