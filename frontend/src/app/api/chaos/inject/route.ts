import { NextRequest, NextResponse } from 'next/server';
import { injectChaosScenario } from '@/lib/server-state';

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

    const result = injectChaosScenario(scenario);

    return NextResponse.json({
      status: 'injected',
      scenario: result.scenario,
      activeScenarios: result.activeScenarios,
      rcaResult: result.rcaResult,
      affectedServices: result.affectedServices,
      fault: {
        target_service: result.rcaResult.rootCause.serviceId,
        scenario: result.scenario,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to inject chaos scenario' },
      { status: 500 }
    );
  }
}
