import { NextRequest, NextResponse } from 'next/server';
import { stopChaosScenario } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario = body?.scenario;

    if (!scenario || typeof scenario !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing scenario parameter' },
        { status: 400 }
      );
    }

    const result = stopChaosScenario(scenario);

    return NextResponse.json({
      status: 'stopped',
      scenario: result.scenario,
      activeScenarios: result.activeScenarios,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to stop chaos scenario' },
      { status: 500 }
    );
  }
}
