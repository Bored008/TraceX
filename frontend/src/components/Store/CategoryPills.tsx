'use client';

import React from 'react';
import { STORE_CATEGORIES } from '@/lib/store-data';

interface CategoryPillsProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

export default function CategoryPills({ activeCategory, onSelectCategory }: CategoryPillsProps) {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none py-1 select-none">
      {STORE_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border
              ${
                isActive
                  ? 'bg-[#e8f5e9] text-[#0c831f] border-[#0c831f] shadow-xs font-bold'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-2xs'
              }
            `}
          >
            <span className="text-base sm:text-lg">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
