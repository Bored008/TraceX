import { NextResponse } from 'next/server';
import { getServicesSnapshot } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const services = getServicesSnapshot();
  return NextResponse.json(services);
}
