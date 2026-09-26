'use client';

import React, { useState } from 'react';
import { X, CreditCard, Zap, CheckCircle2, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { CHAOS_SCENARIOS } from '@/lib/constants';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  isSubmitting: boolean;
  onPlaceOrder: (simulateFault?: string) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  total,
  isSubmitting,
  onPlaceOrder,
}: CheckoutModalProps) {
  const [selectedFault, setSelectedFault] = useState<string>('none');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="font-bold text-base text-white">Complete Your Order</h3>
            <p className="text-xs text-slate-400 font-mono">TraceBites Microservice Gateway</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Order Summary Pill */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs text-slate-400">Total Payable</span>
              <p className="text-xl font-extrabold text-orange-400 font-mono">${total.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>TLS 1.3 Encrypted</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-orange-400" />
                <span>Credit / Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-sm font-bold text-orange-400">⚡</span>
                <span>Instant UPI / Apple Pay</span>
              </button>
            </div>
          </div>

          {/* TraceX Prototype Chaos / Fault Simulation Controller */}
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                  Live RCA Demo Simulator
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Interactive Test
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Test how TraceX responds when an order triggers a microservice failure in the pipeline:
            </p>

            <div className="space-y-1.5">
              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedFault === 'none'
                    ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="fault"
                    checked={selectedFault === 'none'}
                    onChange={() => setSelectedFault('none')}
                    className="accent-emerald-500"
                  />
                  <span>Normal Order (All microservices healthy)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">200 OK</span>
              </label>

              {CHAOS_SCENARIOS.slice(0, 3).map((scenario) => (
                <label
                  key={scenario.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedFault === scenario.id
                      ? 'border-red-500/60 bg-red-950/30 text-red-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="fault"
                      checked={selectedFault === scenario.id}
                      onChange={() => setSelectedFault(scenario.id)}
                      className="accent-red-500"
                    />
                    <span>
                      {scenario.icon} Simulate: {scenario.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-red-400 font-mono">504 Drop</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onPlaceOrder(selectedFault === 'none' ? undefined : selectedFault)}
            disabled={isSubmitting}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-lg active:scale-95 cursor-pointer
              ${
                selectedFault !== 'none'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/25'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Routing Request...</span>
              </>
            ) : selectedFault !== 'none' ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Place Order with Simulated Bug</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Place Order (${total.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
