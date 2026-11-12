import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { MovieFormat } from '../types';

interface FormatFiltersProps {
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FORMAT_OPTIONS = [
  { id: 'all', label: 'All Formats' },
  { id: 'IMAX', label: 'IMAX 70mm' },
  { id: 'Dolby Atmos', label: 'Dolby Atmos' },
  { id: '3D', label: '3D RealD' },
  { id: '4DX', label: '4DX Motion' },
  { id: 'VIP', label: 'VIP Lounge' },
];

const GENRE_OPTIONS = [
  'All Genres',
  'Sci-Fi',
  'Action',
  'Animation',
  'Horror',
  'Romance',
  'Family',
  'Comedy',
  'Drama',
  'Mystery',
  'Thriller',
  'Adventure',
  'Fantasy',
];

export const FormatFilters: React.FC<FormatFiltersProps> = ({
  selectedFormat,
  onSelectFormat,
  selectedGenre,
  onSelectGenre,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 border-b border-slate-200 mb-8">
      {/* Segmented Format Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FORMAT_OPTIONS.map((opt) => {
          const isActive = selectedFormat === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectFormat(opt.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Search Input & Genre Dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative min-w-[220px] sm:min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search movie title or cast..."
            data-testid="input-search"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 focus:outline-hidden focus:border-[#4F46E5] focus:ring-3 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Genre Selector */}
        <select
          value={selectedGenre}
          onChange={(e) => onSelectGenre(e.target.value)}
          className="text-xs py-1.5 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium cursor-pointer focus:outline-hidden focus:border-[#4F46E5]"
        >
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
