'use client';

import React from 'react';
import { CartItem } from '@/types/store';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

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
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
              <h2 className="text-base font-bold text-white">Your Order</h2>
              <span className="text-xs text-slate-400 font-mono">
                ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 divide-y divide-slate-800/60">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <span className="text-5xl mb-3">🛒</span>
                <p className="font-semibold text-slate-200 text-sm mb-1">Your cart is empty</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Browse through our chef-curated burgers, artisan pizzas and bowls to add your favorite meal!
                </p>
              </div>
            ) : (
              cartItems.map(({ item, quantity }) => (
                <div key={item.id} className="pt-3.5 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl p-2 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-100 truncate">{item.name}</h4>
                      <p className="text-xs font-mono font-medium text-orange-400 mt-0.5">
                        ${(item.price * quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                    <button
                      onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center font-mono font-bold text-white">{quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary & Checkout Button */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-slate-200">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-semibold">FREE</span>
                    ) : (
                      `$${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax</span>
                  <span className="font-mono text-slate-200">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="font-mono text-orange-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected by TraceX Autonomous Circuit Breakers</span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
