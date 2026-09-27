'use client';

import React, { useState } from 'react';
import { X, CreditCard, Zap, CheckCircle2, AlertTriangle, ShieldCheck, Loader2, Smartphone, MapPin } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] text-gray-900 font-sans">
        {/* Header */}
        <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-[#f8f9fc]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-black">blink<span className="text-[#0c831f]">it</span></span>
              <span className="text-xs bg-[#e8f5e9] text-[#0c831f] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Checkout
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Delivery in 8 minutes to your doorstep</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Delivery Address Pill */}
          <div className="p-3.5 rounded-2xl bg-[#f4f6fb] border border-gray-200 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0c831f] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">Delivering to Home</span>
                  <span className="text-[10px] bg-[#0c831f] text-white px-1.5 py-0.2 rounded font-extrabold">
                    8 MINS
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Plot 42, Tech Park, Indiranagar, Bengaluru, 560038
                </p>
              </div>
            </div>
          </div>

          {/* Payable Amount Summary */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
            <div>
              <span className="text-xs text-gray-500 font-medium">Total Amount Payable</span>
              <p className="text-3xl font-black text-gray-900">₹{Math.round(total)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-[#0c831f]" />
              <span>100% Safe Payments</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-[#0c831f] bg-[#e8f5e9] text-[#0c831f] shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-4 h-4 flex-shrink-0" />
                <span>Instant UPI (GPay / PhonePe)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-[#0c831f] bg-[#e8f5e9] text-[#0c831f] shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span>Credit / Debit Card</span>
              </button>
            </div>
          </div>

          {/* TraceX Prototype Chaos / Fault Simulation Controller */}
          <div className="p-4 rounded-2xl border border-indigo-200 bg-[#f6f7ff] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                  TraceX Live Microservice Simulator
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                Chaos Testing
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Test how TraceX autonomously isolates anomalies and diagnoses root causes across microservices:
            </p>

            <div className="space-y-1.5">
              <label
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedFault === 'none'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="fault"
                    checked={selectedFault === 'none'}
                    onChange={() => setSelectedFault('none')}
                    className="accent-[#0c831f]"
                  />
                  <span>Normal Order (All microservices healthy)</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded">
                  200 OK
                </span>
              </label>

              {CHAOS_SCENARIOS.slice(0, 3).map((scenario) => (
                <label
                  key={scenario.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedFault === scenario.id
                      ? 'border-rose-400 bg-rose-50 text-rose-950 font-bold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="fault"
                      checked={selectedFault === scenario.id}
                      onChange={() => setSelectedFault(scenario.id)}
                      className="accent-rose-600"
                    />
                    <span>
                      {scenario.icon} Simulate: {scenario.name}
                    </span>
                  </div>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-mono font-bold px-2 py-0.5 rounded">
                    Fault
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-gray-150 bg-[#f8f9fc] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onPlaceOrder(selectedFault === 'none' ? undefined : selectedFault)}
            disabled={isSubmitting}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs text-white transition-all shadow-md active:scale-95 cursor-pointer
              ${
                selectedFault !== 'none'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/25'
                  : 'bg-[#0c831f] hover:bg-[#0a6f1a] shadow-emerald-800/25'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Routing Order...</span>
              </>
            ) : selectedFault !== 'none' ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Fault & Pay ₹{Math.round(total)}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Pay ₹{Math.round(total)} • Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
