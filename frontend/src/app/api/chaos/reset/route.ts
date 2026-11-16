import { NextResponse } from 'next/server';
import { resetChaosState } from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function POST() {
  const result = resetChaosState();
  return NextResponse.json(result);
}
