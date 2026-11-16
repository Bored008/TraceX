import { NextResponse } from 'next/server';
import { CHAOS_SCENARIOS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const scenarioDict: Record<string, any> = {};
  for (const s of CHAOS_SCENARIOS) {
    scenarioDict[s.id] = s;
  }
  return NextResponse.json(scenarioDict);
}
