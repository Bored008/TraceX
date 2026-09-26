'use client';

import React from 'react';
import Link from 'next/link';
import { OrderOutcome } from '@/types/store';
import {
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';

interface OrderOutcomeModalProps {
  outcome: OrderOutcome | null;
  onClose: () => void;
  onRetry: () => void;
  onAutoHeal?: () => Promise<void> | void;
}

export default function OrderOutcomeModal({ outcome, onClose, onRetry, onAutoHeal }: OrderOutcomeModalProps) {
  if (!outcome) return null;

  const isConfirmed = outcome.status === 'confirmed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Banner Glow */}
        <div
          className={`h-2 w-full ${
            isConfirmed
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-red-600 via-rose-500 to-orange-500'
          }`}
        />

        <div className="p-6 space-y-6">
          {/* Top Status Icon & Title */}
          <div className="text-center space-y-2">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-xl ${
                isConfirmed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-red-500/10'
              }`}
            >
              {isConfirmed ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <AlertOctagon className="w-8 h-8 animate-bounce" />
              )}
            </div>

            <h3 className="text-xl font-extrabold text-white">
              {isConfirmed ? 'Order Confirmed!' : 'Order Processing Failed'}
            </h3>

            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isConfirmed
                ? 'Your meal is being prepared by our chefs and will be dispatched shortly.'
                : 'A downstream microservice encounter an issue while processing your transaction.'}
            </p>

            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span>Order: #{outcome.orderId}</span>
              <span>•</span>
              <span className="text-indigo-400">Trace: {outcome.traceId}</span>
            </div>
          </div>

          {/* Conditional Body: Success Tracker vs Failure RCA */}
          {isConfirmed ? (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Estimated Delivery</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  ~{outcome.deliveryMinutes || 24} minutes
                </span>
              </div>

              {/* Order Stepper */}
              <div className="relative pl-6 space-y-4 border-l border-slate-800 ml-2 py-1">
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <p className="text-xs font-semibold text-slate-200">Order Placed & Verified</p>
                  <p className="text-[10px] text-slate-500">API Gateway ➔ Auth ➔ Order Service</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <p className="text-xs font-semibold text-slate-200">Payment Captured</p>
                  <p className="text-[10px] text-slate-500">Payment Service ➔ PostgresDB (200 OK)</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                    3
                  </span>
                  <p className="text-xs font-semibold text-orange-400">Kitchen Preparing</p>
                  <p className="text-[10px] text-slate-500">Inventory Service reserved ingredients</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Explanation Card */}
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-200 leading-relaxed">
                <p className="font-semibold text-red-300 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Customer Notice</span>
                </p>
                {outcome.failureDetails?.userMessage ||
                  'Your card was not charged. Please try again or check the system status.'}
              </div>

              {/* Live Developer / SRE Diagnostic Card */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                    TraceX Live MicroRCA Diagnostic
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[10px] font-bold border border-red-500/30">
                    HTTP {outcome.failureDetails?.statusCode || 504}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase">Failed Node</span>
                    <span className="text-red-400 font-bold truncate block">
                      {outcome.failureDetails?.service || 'postgres-db'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase">Anomaly Type</span>
                    <span className="text-amber-400 font-bold truncate block">
                      {outcome.failureDetails?.errorType || 'Latency / Drop'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-mono">
                  {outcome.failureDetails?.technicalMessage}
                </p>

                {/* Direct Action Link to TraceX SRE Dashboard */}
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <span>Open in TraceX SRE Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!isConfirmed && onAutoHeal ? (
              <button
                type="button"
                onClick={async () => {
                  await onAutoHeal();
                  onRetry();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
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
