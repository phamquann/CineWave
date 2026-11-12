import React from 'react';
import { Calendar } from 'lucide-react';
import { DATES } from '../data/mockData';

interface DateRailProps {
  selectedDate: string;
  onSelectDate: (dateId: string) => void;
}

export const DateRail: React.FC<DateRailProps> = ({ selectedDate, onSelectDate }) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none py-1">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-200 shrink-0 text-slate-500 text-xs font-semibold uppercase tracking-wider">
        <Calendar className="w-4 h-4 text-[#4F46E5]" />
        <span>Date</span>
      </div>

      <div className="flex items-center gap-2">
        {DATES.map((date) => {
          const isSelected = selectedDate === date.id;
          return (
            <button
              key={date.id}
              onClick={() => onSelectDate(date.id)}
              className={`px-4 py-2 rounded-xl text-center transition-all cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80 leading-tight">
                {date.dayName}
              </div>
              <div className="text-base font-bold tabular-nums font-display leading-tight">
                {date.dayNumber}
              </div>
              <div className="text-[10px] mt-0.5 font-medium">
                {date.isToday ? 'Today' : date.label.split(' ')[0]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
