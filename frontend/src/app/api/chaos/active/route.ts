import { NextResponse } from 'next/server';
import { getActiveScenarios, isChaosActive } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const activeScenarios = getActiveScenarios();
  const active = isChaosActive();

  return NextResponse.json({
    active,
    activeScenarios,
    faults: activeScenarios.map((s) => ({
      scenario: s,
    })),
  });
}
