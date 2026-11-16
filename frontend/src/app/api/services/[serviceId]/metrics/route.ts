import { NextRequest, NextResponse } from 'next/server';
import { getServiceHistory, getServiceById } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await context.params;
  const service = getServiceById(serviceId);

  if (!service) {
    return NextResponse.json(
      { error: `Service '${serviceId}' not found` },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric') || undefined;
  const seconds = parseInt(searchParams.get('seconds') || '60', 10);

  const historyData = getServiceHistory(serviceId, metric, seconds);

  return NextResponse.json(historyData);
}
