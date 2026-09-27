'use client';

import React from 'react';
import { FoodItem } from '@/types/store';
import { Clock, Plus, Minus, Star } from 'lucide-react';

interface ProductCardProps {
  item: FoodItem;
  quantityInCart: number;
  onAddToCart: () => void;
  onUpdateQuantity: (qty: number) => void;
}

export default function ProductCard({
  item,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
}: ProductCardProps) {
  const discountPercent =
    item.originalPrice && item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : null;

  return (
    <div className="flex flex-col bg-white border border-gray-200/90 rounded-2xl p-3 shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-200 group">
      {/* Visual Product Showcase */}
      <div className="relative h-36 bg-[#f8f9fc] rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
        {/* Delivery Time Badge (Top Left) */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md shadow-xs border border-gray-150">
          <Clock className="w-2.5 h-2.5 text-[#0c831f]" />
          <span className="text-[10px] font-extrabold text-gray-800 tracking-tight">
            {item.prepTime || '8 MINS'}
          </span>
        </div>

        {/* Veg / Non-Veg Indicator & Badges (Top Right) */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {discountPercent && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight bg-blue-50 text-blue-700 border border-blue-200">
              {discountPercent}% OFF
            </span>
          )}
          <span
            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 bg-white shadow-2xs ${
              item.isVegetarian ? 'border-emerald-600' : 'border-red-600'
            }`}
            title={item.isVegetarian ? 'Pure Vegetarian' : 'Non-Vegetarian'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.isVegetarian ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            />
          </span>
        </div>

        {/* Real Food Image or Food Emoji Icon Fallback */}
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
          />
        ) : (
          <span className="text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-200 select-none">
            {item.icon}
          </span>
        )}
      </div>

      {/* Item Details */}
      <div className="pt-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[36px] group-hover:text-[#0c831f] transition-colors">
            {item.name}
          </h3>

          {/* Unit Size */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium mt-1">
            <span>{item.unit || '1 unit'}</span>
            <div className="flex items-center gap-0.5 text-xs text-amber-700 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{item.rating}</span>
            </div>
          </div>
        </div>

        {/* Bottom Price & Blinkit ADD Button */}
        <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-gray-900">
                ₹{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{item.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Blinkit ADD / Stepper Button */}
          {quantityInCart === 0 ? (
            <button
              onClick={onAddToCart}
              className="px-4 py-1.5 rounded-lg border border-[#0c831f] bg-[#f7fff9] hover:bg-[#0c831f] text-[#0c831f] hover:text-white font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center justify-between bg-[#0c831f] rounded-lg px-2 py-1 text-xs font-bold text-white shadow-xs min-w-[74px]">
              <button
                onClick={() => onUpdateQuantity(quantityInCart - 1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded transition-colors cursor-pointer"
                title="Decrease quantity"
              >
                <Minus className="w-3 h-3 stroke-[3]" />
              </button>
              <span className="px-1 font-mono font-extrabold">{quantityInCart}</span>
              <button
                onClick={() => onUpdateQuantity(quantityInCart + 1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded transition-colors cursor-pointer"
                title="Increase quantity"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
