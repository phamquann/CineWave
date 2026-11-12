import React, { useState } from 'react';
import { Plus, Minus, Popcorn, Sparkles, Coffee, UtensilsCrossed } from 'lucide-react';
import { ConcessionItem, formatVND } from '../types';
import { CONCESSIONS } from '../data/mockData';

interface ConcessionsSelectorProps {
  concessions: Record<string, number>;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

export const ConcessionsSelector: React.FC<ConcessionsSelectorProps> = ({
  concessions,
  onUpdateQuantity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Concessions' },
    { id: 'combos', label: 'Combos' },
    { id: 'popcorn', label: 'Gourmet Popcorn' },
    { id: 'beverages', label: 'Craft Drinks' },
    { id: 'treats', label: 'Snacks & Sweets' },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? CONCESSIONS
      : CONCESSIONS.filter((item) => item.category === selectedCategory);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Popcorn className="w-4 h-4 text-[#4F46E5]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4F46E5]">
              CineWave Kitchen & Bar
            </span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0F172A]">
            Artisanal Concessions & Treats
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-order freshly prepared snacks delivered to your theater seat or express counter pickup.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none self-start sm:self-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${selectedCategory === cat.id
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of concession items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
        {filteredItems.map((item) => {
          const qty = concessions[item.id] || 0;

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${qty > 0
                  ? 'border-[#4F46E5] bg-indigo-50/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-display font-semibold text-sm text-[#0F172A] leading-snug">
                    {item.name}
                  </h4>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {item.description}
                </p>

                {item.calories && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.calories}
                  </span>
                )}
              </div>

              {/* Price and Quantity Stepper */}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                <span className="font-bold text-base text-[#0F172A] tabular-nums font-display">
                  {formatVND(item.price)}
                </span>

                <div className="flex items-center gap-2">
                  {qty > 0 ? (
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 transition-colors cursor-pointer shadow-2xs"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-slate-900">
                        {qty}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] flex items-center justify-center text-white transition-colors cursor-pointer shadow-2xs"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#4F46E5] text-slate-700 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
