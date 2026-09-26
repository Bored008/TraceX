'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin, Activity, Search, Sparkles } from 'lucide-react';

interface StoreNavbarProps {
  itemCount: number;
  onOpenCart: () => void;
  systemStatus?: 'healthy' | 'incident';
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function StoreNavbar({
  itemCount,
  onOpenCart,
  systemStatus = 'healthy',
  searchQuery,
  onSearchChange,
}: StoreNavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Address */}
        <div className="flex items-center gap-6">
          <Link href="/store" className="flex items-center gap-2.5 group">
            <span className="text-2xl p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              🍕
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">TraceBites</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide">Microservices Powered</p>
            </div>
          </Link>

          {/* Delivery Location Selector */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">Deliver to:</span>
            <span className="font-medium text-slate-200">742 Evergreen Terrace</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search burgers, artisan pizza, ramen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all font-sans"
            />
          </div>
        </div>

        {/* Right Action Controls: SRE Monitor Badge & Cart */}
        <div className="flex items-center gap-3">
          {/* Link to SRE Observability Console */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/50 hover:border-indigo-400/50 text-indigo-300 text-xs font-medium transition-all group shadow-sm"
            title="Inspect Live Microservices & RCA Topology"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400 group-hover:animate-pulse" />
            <span className="hidden lg:inline">TraceX Observability</span>
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus === 'healthy' ? 'bg-emerald-400' : 'bg-red-400 animate-ping'
              }`}
            />
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">My Cart</span>
            {itemCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-white text-orange-600 font-extrabold text-[11px] shadow">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
