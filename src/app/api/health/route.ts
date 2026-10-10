import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'unhealthy';
    console.warn('Database health check probe failed:', error);
  }

  const isHealthy = dbStatus === 'healthy';
  const totalLatencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      latencyMs: totalLatencyMs,
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        application: {
          status: 'healthy',
          memoryUsage: process.memoryUsage(),
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
