import { NextRequest, NextResponse } from 'next/server';
import { getIncidentById } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const incident = getIncidentById(id);

  if (!incident) {
    return NextResponse.json(
      { error: `Incident '${id}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(incident);
}
