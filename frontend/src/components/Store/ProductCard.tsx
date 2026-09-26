'use client';

import React from 'react';
import { FoodItem } from '@/types/store';
import { Star, Clock, Flame, Plus, Minus } from 'lucide-react';

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
  return (
    <div className="flex flex-col bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 group">
      {/* Visual Header */}
      <div className="relative h-44 bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/50">
        {/* Glow backdrop */}
        <div className="absolute w-28 h-28 bg-orange-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
        
        {/* Large Food Emoji Icon */}
        <span className="text-6xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300 select-none">
          {item.icon}
        </span>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {item.badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 backdrop-blur-md">
              {item.badge}
            </span>
          )}
          <span
            className={`w-4 h-4 rounded-md border flex items-center justify-center p-0.5 bg-slate-950/80 ${
              item.isVegetarian ? 'border-emerald-500' : 'border-red-500'
            }`}
            title={item.isVegetarian ? 'Pure Vegetarian' : 'Non-Vegetarian'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.isVegetarian ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </span>
        </div>

        {/* Prep time badge */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded-full border border-slate-800 backdrop-blur-md">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{item.prepTime}</span>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-slate-100 text-sm group-hover:text-orange-400 transition-colors line-clamp-1">
              {item.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{item.rating}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        </div>

        {/* Bottom Price & Add Action */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Price</span>
            <span className="text-base font-extrabold text-white font-mono">
              ${item.price.toFixed(2)}
            </span>
          </div>

          {quantityInCart === 0 ? (
            <button
              onClick={onAddToCart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 hover:border-orange-500 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-950 border border-orange-500/40 rounded-xl px-1.5 py-1 text-xs font-semibold text-white">
              <button
                onClick={() => onUpdateQuantity(quantityInCart - 1)}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-4 text-center font-mono">{quantityInCart}</span>
              <button
                onClick={() => onUpdateQuantity(quantityInCart + 1)}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
