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
import { Zap, Clock, ShieldCheck, ArrowRight, ShoppingCart, Sparkles, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f4f6fb] text-gray-900 flex flex-col font-sans selection:bg-[#0c831f]/20">
      {/* Navigation Header */}
      <StoreNavbar
        itemCount={itemCount}
        totalPrice={total}
        onOpenCart={() => setIsCartOpen(true)}
        systemStatus={systemStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* Blinkit Quick-Commerce Promo Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c831f] via-[#109626] to-[#0c831f] p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10">
          {/* Ambient decorative badges */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#f8cb46]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-8 bottom-4 text-7xl select-none opacity-20 hidden md:block">
            🥛 🍞 🍎 🍫
          </div>

          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/20 text-xs font-bold backdrop-blur-xs">
              <Zap className="w-3.5 h-3.5 fill-[#f8cb46] text-[#f8cb46]" />
              <span>India&apos;s Last Minute App • Delivering in 8 Mins</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Instant Groceries, <br />
              <span className="text-[#f8cb46]">Supercharged with TraceX.</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-medium">
              Daily milk, fresh vegetables, snacks, and chilled drinks at your door in 8 minutes.
              Every checkout runs live telemetry through the TraceX distributed microservice mesh.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold">
              <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-[#f8cb46]" />
                <span>8-10 Mins Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>TraceX Live Observability</span>
              </div>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-white hover:text-[#f8cb46] font-bold underline underline-offset-4 transition-colors"
              >
                <span>Live SRE Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Category Horizontal Filter Bar */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
              Explore Categories
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <CategoryPills activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
        </section>

        {/* Product Menu Grid */}
        <section className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-gray-200 bg-white space-y-3 shadow-xs">
              <span className="text-4xl">🔍</span>
              <h3 className="font-bold text-gray-800 text-base">No products found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No items match your filter. Try searching for &ldquo;milk&rdquo;, &ldquo;bread&rdquo;, &ldquo;chips&rdquo;, or &ldquo;apples&rdquo;.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#0c831f] hover:bg-[#0a6f1a] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0c831f] text-white font-extrabold text-sm shadow-xl shadow-emerald-900/30 active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5" />
              <span>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">₹{Math.round(total)}</span>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <span>View Cart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Blinkit Style Clean Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl text-black">
              blink<span className="text-[#0c831f]">it</span>
            </span>
            <span>•</span>
            <span className="font-semibold text-gray-700">India&apos;s Last Minute App</span>
            <span className="hidden md:inline text-gray-400">| Integrated with TraceX Autonomous Observability</span>
          </div>

          <div className="flex items-center gap-5 text-xs font-semibold">
            <Link href="/" className="text-[#0c831f] hover:underline flex items-center gap-1">
              <span>SRE Observability Dashboard</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 font-mono text-[11px]">Next.js 16 • Turbopack • FastAPI</span>
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
