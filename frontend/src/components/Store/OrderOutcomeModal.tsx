'use client';

import React from 'react';
import Link from 'next/link';
import { OrderOutcome } from '@/types/store';
import {
  CheckCircle2,
  AlertOctagon,
  Clock,
  ExternalLink,
  ShieldAlert,
  RotateCcw,
  Check,
  Sparkles,
  Zap,
} from 'lucide-react';

interface OrderOutcomeModalProps {
  outcome: OrderOutcome | null;
  onClose: () => void;
  onRetry: () => void;
  onAutoHeal?: () => Promise<void> | void;
}

export default function OrderOutcomeModal({
  outcome,
  onClose,
  onRetry,
  onAutoHeal,
}: OrderOutcomeModalProps) {
  if (!outcome) return null;

  const isConfirmed = outcome.status === 'confirmed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden z-10 text-gray-900 font-sans">
        {/* Top Accent Strip */}
        <div
          className={`h-2.5 w-full ${
            isConfirmed
              ? 'bg-gradient-to-r from-[#0c831f] via-emerald-500 to-[#f8cb46]'
              : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500'
          }`}
        />

        <div className="p-6 sm:p-7 space-y-6">
          {/* Header Icon & Message */}
          <div className="text-center space-y-2">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg ${
                isConfirmed
                  ? 'bg-emerald-50 text-[#0c831f] border border-emerald-200 shadow-emerald-700/10'
                  : 'bg-rose-50 text-rose-600 border border-rose-200 shadow-rose-700/10'
              }`}
            >
              {isConfirmed ? (
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              ) : (
                <AlertOctagon className="w-9 h-9 animate-bounce" />
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {isConfirmed ? 'Order Placed in 8 Mins! ⚡' : 'Order Processing Disrupted'}
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
              {isConfirmed
                ? 'Your groceries are being packed right now at our nearest dark store.'
                : 'A downstream microservice timed out while processing your checkout request.'}
            </p>

            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-mono text-gray-600">
              <span className="font-bold text-gray-900">Order: #{outcome.orderId}</span>
              <span>•</span>
              <span className="text-indigo-600 font-semibold">Trace: {outcome.traceId}</span>
            </div>
          </div>

          {/* Body: Delivery Stepper vs Failure RCA */}
          {isConfirmed ? (
            <div className="p-5 rounded-2xl bg-[#f8f9fc] border border-gray-200 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Zap className="w-4 h-4 fill-[#0c831f] text-[#0c831f]" />
                  <span>Delivery Estimate</span>
                </span>
                <span className="text-[#0c831f] font-black text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~8 minutes
                </span>
              </div>

              {/* Blinkit Order Stepper */}
              <div className="relative pl-6 space-y-4 border-l-2 border-emerald-200 ml-2 py-1">
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-[#0c831f] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <p className="text-xs font-bold text-gray-900">Order Verified & Inventory Reserved</p>
                  <p className="text-[11px] text-gray-500">API Gateway ➔ Auth ➔ Order Service (200 OK)</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-[#0c831f] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <p className="text-xs font-bold text-gray-900">Payment Captured & Reconciled</p>
                  <p className="text-[11px] text-gray-500">Payment Service ➔ Ledger (200 OK)</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-[#f8cb46] text-amber-950 flex items-center justify-center text-[10px] font-black animate-pulse shadow-xs">
                    3
                  </span>
                  <p className="text-xs font-bold text-amber-900">Packing at Dark Store</p>
                  <p className="text-[11px] text-gray-500">Delivery partner arriving at store bay in 2 mins</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Friendly Notice */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
                <p className="font-bold text-rose-950 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Customer Notice</span>
                </p>
                {outcome.failureDetails?.userMessage ||
                  'Your card was not debited. Please try again or check system status.'}
              </div>

              {/* SRE / TraceX Root Cause Analysis Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px]">
                    TraceX Autonomous MicroRCA Diagnostic
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono text-[10px] font-bold border border-rose-200">
                    HTTP {outcome.failureDetails?.statusCode || 504}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Failed Node</span>
                    <span className="text-rose-600 font-black truncate block">
                      {outcome.failureDetails?.service || 'postgres-db'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Anomaly Type</span>
                    <span className="text-amber-700 font-black truncate block">
                      {outcome.failureDetails?.errorType || 'Latency / Drop'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-indigo-900 font-mono bg-white p-2.5 rounded-xl border border-indigo-100">
                  {outcome.failureDetails?.technicalMessage}
                </p>

                {/* Direct Action Link to TraceX SRE Dashboard */}
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <span>Open in TraceX SRE Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Modal Action Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!isConfirmed && onAutoHeal ? (
              <button
                type="button"
                onClick={async () => {
                  await onAutoHeal();
                  onRetry();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Reset active chaos faults back to baseline and open checkout to retry"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Heal & Retry</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {!isConfirmed && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
