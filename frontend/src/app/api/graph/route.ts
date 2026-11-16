import { NextResponse } from 'next/server';
import {
  getServicesSnapshot,
  SERVICE_CONFIG,
  SERVICE_DEPENDENCIES,
} from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const services = getServicesSnapshot();

  const nodes = Object.entries(SERVICE_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    type: config.type,
    icon: config.icon,
    color: config.color,
    description: `${config.name} (${config.type})`,
  }));

  const edges = SERVICE_DEPENDENCIES.map((dep) => ({
    source: dep.source,
    target: dep.target,
    protocol: dep.protocol,
    avgLatency: dep.avgLatency,
    weight: 1.0,
  }));

  return NextResponse.json({
    services,
    dependencies: SERVICE_DEPENDENCIES,
    nodes,
    edges,
  });
}
