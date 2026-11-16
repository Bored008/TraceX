import { NextResponse } from 'next/server';
import { getIncidents } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const incidents = getIncidents();
  return NextResponse.json(incidents);
}
