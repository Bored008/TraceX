import { NextResponse } from 'next/server';
import { getActiveScenarios } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const activeScenarios = getActiveScenarios();
  return NextResponse.json({
    status: 'healthy',
    timestamp: Date.now(),
    engine: 'vercel-serverless',
    active_faults: activeScenarios.map((s) => ({ scenario: s })),
    activeScenarios,
  });
}
