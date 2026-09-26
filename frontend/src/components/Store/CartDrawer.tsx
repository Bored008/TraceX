'use client';

import React from 'react';
import { CartItem } from '@/types/store';
import { X, Plus, Minus, ArrowRight, ShoppingCart, Zap, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  deliveryFee,
  tax,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#f4f6fb] border-l border-gray-200 shadow-2xl flex flex-col text-gray-900 font-sans">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#e8f5e9] flex items-center justify-center text-[#0c831f]">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">My Cart</h2>
                <p className="text-xs text-gray-500 font-medium">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in basket
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Promise Banner */}
          <div className="bg-[#e8f5e9] border-b border-emerald-100 px-5 py-2.5 flex items-center justify-between text-xs text-[#0c831f] font-bold">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-[#0c831f]" />
              <span>Superfast Delivery in 8 minutes</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-white px-2 py-0.5 rounded font-black border border-emerald-200">
              Live
            </span>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <span className="text-6xl mb-3">🛒</span>
                <p className="font-extrabold text-gray-800 text-base mb-1">Your cart is empty</p>
                <p className="text-xs text-gray-500 max-w-xs mb-4">
                  Add milk, bread, snacks, or fresh veggies to experience lightning fast 8-minute delivery!
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#0c831f] text-white font-bold text-xs shadow-xs hover:bg-[#0a6f1a] transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs divide-y divide-gray-100">
                {cartItems.map(({ item, quantity }) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[#f8f9fc] border border-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-[11px] text-gray-500 font-medium">{item.unit || '1 unit'}</p>
                        <p className="text-xs font-black text-gray-900 mt-0.5">
                          ₹{item.price * quantity}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between bg-[#0c831f] rounded-lg px-2 py-1 text-xs font-bold text-white shadow-xs min-w-[70px]">
                      <button
                        onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                        className="w-4 h-4 flex items-center justify-center hover:bg-black/20 rounded cursor-pointer"
                      >
                        <Minus className="w-3 h-3 stroke-[3]" />
                      </button>
                      <span className="px-1 font-mono font-extrabold">{quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                        className="w-4 h-4 flex items-center justify-center hover:bg-black/20 rounded cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Details & Proceed to Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-200 space-y-3 shadow-lg">
              {/* Bill breakdown */}
              <div className="bg-[#f8f9fc] rounded-xl p-3.5 border border-gray-200/80 space-y-2 text-xs">
                <div className="font-extrabold text-gray-800 text-[11px] uppercase tracking-wider">
                  Bill Summary
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Item Total</span>
                  <span className="font-semibold text-gray-900">₹{Math.round(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    Delivery Partner Fee
                    {subtotal > 199 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                        FREE
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {deliveryFee === 0 || subtotal > 199 ? (
                      <span className="text-[#0c831f] font-bold">FREE</span>
                    ) : (
                      `₹15`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Handling & Packaging</span>
                  <span className="font-semibold text-gray-900">₹4</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>Grand Total</span>
                  <span className="text-base text-[#0c831f] font-black">
                    ₹{Math.round(subtotal + (subtotal > 199 ? 0 : 15) + 4)}
                  </span>
                </div>
              </div>

              {/* TraceX Assurance */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium px-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0c831f] flex-shrink-0" />
                <span>Zero cancellation fee within 1 min • TraceX live verified</span>
              </div>

              {/* Big Blinkit Green Button */}
              <button
                onClick={onCheckout}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-extrabold text-sm shadow-md shadow-emerald-800/25 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-medium opacity-90">Total Payable</span>
                  <span className="text-base font-black">
                    ₹{Math.round(subtotal + (subtotal > 199 ? 0 : 15) + 4)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Proceed to Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
