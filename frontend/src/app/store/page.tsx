'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import StoreNavbar from '@/components/Store/StoreNavbar';
import CategoryPills from '@/components/Store/CategoryPills';
import ProductCard from '@/components/Store/ProductCard';
import CartDrawer from '@/components/Store/CartDrawer';
import CheckoutModal from '@/components/Store/CheckoutModal';
import OrderOutcomeModal from '@/components/Store/OrderOutcomeModal';
import { MENU_ITEMS } from '@/lib/store-data';
import { useCart } from '@/hooks/useCart';
import { useDashboard } from '@/hooks/useDashboard';
import { Sparkles, Utensils, ShieldCheck, ArrowRight, Zap, ShoppingBag } from 'lucide-react';

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    isSubmittingOrder,
    orderOutcome,
    setOrderOutcome,
    addToCart,
    removeFromCart,
    updateQuantity,
    itemCount,
    subtotal,
    deliveryFee,
    tax,
    total,
    placeOrder,
    resetSystem,
  } = useCart();

  const { systemStatus } = useDashboard();

  // Filter items by category & search query
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-orange-500/30">
      {/* Navigation Header */}
      <StoreNavbar
        itemCount={itemCount}
        onOpenCart={() => setIsCartOpen(true)}
        systemStatus={systemStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 border border-orange-500/30 p-8 sm:p-10 shadow-2xl shadow-orange-500/10">
          {/* Decorative ambient elements */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-12 bottom-6 text-8xl opacity-30 select-none hidden md:block">
            🍔 🍕 🍜
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/40 border border-white/20 text-xs font-semibold text-white backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>TraceX Autonomous Microservice Demo Storefront</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Gourmet Eats, Delivered Fast & Observably.
            </h1>

            <p className="text-sm sm:text-base text-slate-100/90 leading-relaxed">
              Order your favorite artisan burgers, Napoli pizzas, and fresh bowls. Every checkout request
              is simulated across the live TraceX microservice topology.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-white/90 bg-slate-950/30 px-3 py-1.5 rounded-lg border border-white/10">
                <Utensils className="w-4 h-4 text-amber-300" />
                <span>16+ Artisan Dishes</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-white/90 bg-slate-950/30 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>MicroRCA Failure Detection Active</span>
              </div>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white transition-colors underline underline-offset-4"
              >
                <span>View Live SRE Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Category Filters Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide">Explore Categories</h2>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}
            </span>
          </div>

          <CategoryPills activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
        </section>

        {/* Product Menu Grid */}
        <section className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
              <span className="text-4xl">🔍</span>
              <h3 className="font-bold text-slate-200 text-base">No dishes found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No items match your filter. Try searching for &ldquo;pizza&rdquo;, &ldquo;burger&rdquo;, or &ldquo;ramen&rdquo;.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredItems.map((item) => {
                const cartEntry = cartItems.find((ci) => ci.item.id === item.id);
                return (
                  <ProductCard
                    key={item.id}
                    item={item}
                    quantityInCart={cartEntry?.quantity || 0}
                    onAddToCart={() => addToCart(item)}
                    onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating Mobile Cart Bar */}
      {itemCount > 0 && (
        <div className="sm:hidden fixed bottom-4 inset-x-4 z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-2xl shadow-orange-500/40 active:scale-95 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">${total.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-base">🍕</span>
            <span className="font-bold text-slate-300">TraceBites</span>
            <span>— The Observable Food Storefront</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link href="/" className="hover:text-orange-400 transition-colors flex items-center gap-1">
              <span>SRE Observability Dashboard</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <span>•</span>
            <span className="text-slate-400">Next.js 16 • Turbopack • FastAPI</span>
          </div>
        </div>
      </footer>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        tax={tax}
        total={total}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutModalOpen(true);
        }}
      />

      {/* Checkout Modal with Normal & Chaos options */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        total={total}
        isSubmitting={isSubmittingOrder}
        onPlaceOrder={(fault) => placeOrder(fault)}
      />

      {/* Order Outcome Modal (Success vs Bug Diagnostic) */}
      <OrderOutcomeModal
        outcome={orderOutcome}
        onClose={() => setOrderOutcome(null)}
        onRetry={() => {
          setOrderOutcome(null);
          setIsCheckoutModalOpen(true);
        }}
        onAutoHeal={resetSystem}
      />
    </div>
  );
}
