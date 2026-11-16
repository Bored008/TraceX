import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveScenarios,
  injectChaosScenario,
  resetChaosState,
} from '@/lib/server-state';

export const dynamic = 'force-dynamic';

interface CheckoutItem {
  id: string;
  quantity: number;
  price: number;
}

interface CheckoutBody {
  items?: CheckoutItem[];
  customerName?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  simulateFaultScenario?: string;
  traceId?: string;
  autoHeal?: boolean;
}

const SCENARIO_MESSAGES: Record<
  string,
  { service: string; statusCode: number; errorType: string; technicalMessage: string }
> = {
  db_overload: {
    service: 'postgres-db',
    statusCode: 504,
    errorType: 'Connection Pool Timeout',
    technicalMessage: 'Database connection pool saturated (100/100 connections); transaction rolled back.',
  },
  payment_crash: {
    service: 'payment-service',
    statusCode: 502,
    errorType: 'Bad Gateway',
    technicalMessage: 'Payment gateway unresponsive; socket disconnected.',
  },
  network_partition: {
    service: 'payment-service',
    statusCode: 504,
    errorType: 'Payment Gateway Unreachable',
    technicalMessage: 'Network partition between order service and payment gateway; socket timed out.',
  },
  auth_crash: {
    service: 'auth-service',
    statusCode: 401,
    errorType: 'Authentication Service Failure',
    technicalMessage: 'User authorization token validation failed. Service unavailable.',
  },
  cdn_latency: {
    service: 'cdn',
    statusCode: 504,
    errorType: 'Gateway Timeout',
    technicalMessage: 'Asset caching layer exceeded SLA threshold (P99 latency > 800ms).',
  },
  cdn_spike: {
    service: 'cdn',
    statusCode: 504,
    errorType: 'Gateway Timeout',
    technicalMessage: 'Asset caching layer exceeded SLA threshold.',
  },
  memory_leak: {
    service: 'inventory-service',
    statusCode: 503,
    errorType: 'Service Unavailable',
    technicalMessage: 'Out of memory error in inventory verification; GC pause timeout.',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json().catch(() => ({}));
    const traceId = body.traceId || `tr-${Math.random().toString(36).substring(2, 9)}`;
    const orderId = `TB-${Math.floor(100000 + Math.random() * 900000)}`;

    if (body.simulateFaultScenario && body.simulateFaultScenario !== 'none') {
      try {
        injectChaosScenario(body.simulateFaultScenario);
      } catch (e) {
        console.error('[Checkout] Failed to inject fault scenario:', e);
      }
    } else if (body.autoHeal) {
      resetChaosState();
    }

    const activeScenarios = getActiveScenarios();

    if (activeScenarios.length > 0) {
      const primaryScenario = activeScenarios[0];
      const faultInfo = SCENARIO_MESSAGES[primaryScenario] || {
        service: 'postgres-db',
        statusCode: 504,
        errorType: 'Internal Dependency Timeout',
        technicalMessage: `Cascading microservice failure downstream from order gateway (${primaryScenario}).`,
      };

      const failureDetails = {
        service: faultInfo.service,
        statusCode: faultInfo.statusCode,
        errorType: faultInfo.errorType,
        userMessage:
          'Your order could not be completed due to a temporary system issue. No funds have been deducted.',
        technicalMessage: faultInfo.technicalMessage,
      };

      return NextResponse.json(
        {
          status: 'failed',
          orderId,
          traceId,
          failedService: faultInfo.service,
          statusCode: faultInfo.statusCode,
          errorType: faultInfo.errorType,
          userMessage: failureDetails.userMessage,
          technicalMessage: failureDetails.technicalMessage,
          failureDetails,
        },
        { status: 504 }
      );
    }

    const items = body.items || [];
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    return NextResponse.json({
      status: 'confirmed',
      orderId,
      traceId,
      totalAmount: Math.round(totalAmount * 100) / 100,
      deliveryMinutes: 8,
      message: 'Order confirmed and dispatched to kitchen.',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'failed',
        error: err?.message || 'Internal checkout processing error',
      },
      { status: 500 }
    );
  }
}
