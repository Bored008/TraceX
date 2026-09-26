'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, MapPin, ChevronDown, Search, Activity, Zap } from 'lucide-react';

interface StoreNavbarProps {
  itemCount: number;
  totalPrice?: number;
  onOpenCart: () => void;
  systemStatus?: 'healthy' | 'incident';
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function StoreNavbar({
  itemCount,
  totalPrice = 0,
  onOpenCart,
  systemStatus = 'healthy',
  searchQuery,
  onSearchChange,
}: StoreNavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 sm:gap-6">
        {/* Brand & Delivery Address */}
        <div className="flex items-center gap-5 sm:gap-8 flex-shrink-0">
          <Link href="/store" className="flex items-center gap-1.5 group">
            <span className="font-black text-2xl sm:text-3xl tracking-tighter text-black select-none">
              blink<span className="text-[#0c831f]">it</span>
            </span>
            <span className="hidden xl:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f8cb46]/30 text-amber-900 border border-amber-300">
              8 mins
            </span>
          </Link>

          {/* Blinkit Location Selector */}
          <div className="hidden md:flex flex-col cursor-pointer group">
            <div className="flex items-center gap-1 text-xs font-black text-gray-900">
              <Zap className="w-3.5 h-3.5 fill-[#0c831f] text-[#0c831f]" />
              <span>Delivery in 8 minutes</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:translate-y-0.5 transition-transform" />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 max-w-[200px] truncate">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">Plot 42, Tech Park, Indiranagar, Bengaluru</span>
            </div>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder='Search "milk", "bread", "chips", "paneer", "eggs"...'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#f4f6fb] hover:bg-[#ebf0f8] focus:bg-white border border-gray-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#0c831f] focus:ring-2 focus:ring-[#0c831f]/20 transition-all font-sans"
            />
          </div>
        </div>

        {/* Right Action Controls: SRE Monitor Badge & Cart */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {/* Link to TraceX SRE Observability Console */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 hover:text-emerald-900 text-xs font-semibold transition-all group shadow-2xs"
            title="Inspect Live Microservices & RCA Topology"
          >
            <Activity className="w-4 h-4 text-emerald-600 group-hover:animate-pulse" />
            <span className="hidden lg:inline">TraceX Observability</span>
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus === 'healthy' ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-red-500 animate-ping'
              }`}
            />
          </Link>

          {/* Signature Blinkit Green Cart Button */}
          <button
            onClick={onOpenCart}
            className={`
              flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-95
              ${
                itemCount > 0
                  ? 'bg-[#0c831f] hover:bg-[#0a6f1a] text-white shadow-emerald-700/20'
                  : 'bg-[#f4f6fb] hover:bg-gray-200 text-gray-700 border border-gray-200'
              }
            `}
          >
            <ShoppingCart className={`w-4 h-4 sm:w-5 sm:h-5 ${itemCount > 0 ? 'text-white' : 'text-gray-600'}`} />
            {itemCount > 0 ? (
              <div className="flex items-center gap-1.5 font-bold">
                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                <span>•</span>
                <span className="font-extrabold">₹{Math.round(totalPrice)}</span>
              </div>
            ) : (
              <span className="font-semibold text-gray-700">My Cart</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
