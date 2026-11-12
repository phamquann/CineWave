import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface MovieArtworkProps {
  movieId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  themeColor?: string;
  accentColor?: string;
  director?: string;
  tagline?: string;
  aspect?: 'poster' | 'billboard';
  className?: string;
}

const FALLBACK_POSTERS_BY_KEYWORD: { keyword: string; poster: string; backdrop: string; gradient: string }[] = [
  {
    keyword: 'dune',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-amber-900 via-orange-950 to-slate-950',
  },
  {
    keyword: 'deadpool',
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-red-900 via-rose-950 to-slate-950',
  },
  {
    keyword: 'oppenheimer',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-orange-800 via-amber-950 to-slate-950',
  },
  {
    keyword: 'mai',
    poster: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-rose-800 via-pink-950 to-slate-950',
  },
  {
    keyword: 'lật mặt',
    poster: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-emerald-800 via-teal-950 to-slate-950',
  },
  {
    keyword: 'exhuma',
    poster: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-slate-800 via-zinc-900 to-black',
  },
  {
    keyword: 'inside out',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-purple-800 via-indigo-950 to-slate-950',
  },
  {
    keyword: 'avatar',
    poster: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-cyan-800 via-blue-950 to-slate-950',
  },
  {
    keyword: 'spider-man',
    poster: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-rose-700 via-indigo-950 to-slate-950',
  },
  {
    keyword: 'godzilla',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-fuchsia-900 via-purple-950 to-slate-950',
  },
  {
    keyword: 'conan',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-blue-800 via-indigo-950 to-slate-950',
  },
  {
    keyword: 'interstellar',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-indigo-900 via-slate-900 to-black',
  },
  {
    keyword: 'joker',
    poster: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-red-900 via-amber-950 to-black',
  },
  {
    keyword: 'venom',
    poster: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-slate-800 via-blue-950 to-black',
  },
  {
    keyword: 'wicked',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-emerald-800 via-pink-950 to-slate-950',
  },
  {
    keyword: 'batman',
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=85',
    backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=85',
    gradient: 'from-red-950 via-neutral-900 to-black',
  },
];

export const MovieArtwork: React.FC<MovieArtworkProps> = ({
  movieId,
  title,
  posterUrl,
  backdropUrl,
  themeColor = '#4F46E5',
  accentColor = '#818CF8',
  director,
  tagline,
  aspect = 'poster',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const lowerTitle = (title || '').toLowerCase();
  const matchedPreset = FALLBACK_POSTERS_BY_KEYWORD.find(
    (item) => lowerTitle.includes(item.keyword) || (movieId || '').toLowerCase().includes(item.keyword)
  );

  const resolvedUrl =
    aspect === 'billboard'
      ? backdropUrl || posterUrl || matchedPreset?.backdrop || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=85'
      : posterUrl || matchedPreset?.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=85';

  const gradientClass = matchedPreset?.gradient || 'from-indigo-900 via-slate-900 to-slate-950';

  return (
    <div className={`relative overflow-hidden w-full h-full bg-slate-950 select-none ${className}`}>
      {/* Rich Color Gradient Base */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />

      {/* High-Resolution Movie Poster / Backdrop Image */}
      {!imgError && resolvedUrl && (
        <img
          src={resolvedUrl}
          alt={title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      )}

      {/* Ambient Color Glow Overlay matching Movie Theme */}
      <div
        className="absolute inset-0 opacity-35 mix-blend-overlay pointer-events-none"
        style={{
          background: `radial-gradient(circle at 70% 25%, ${accentColor}, ${themeColor}, transparent 75%)`,
        }}
      />

      {/* Poster Stylized Typography & Studio Credit Overlay (Only for Poster cards) */}
      {aspect === 'poster' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/20 pointer-events-none" />
          <div className="absolute bottom-10 inset-x-0 px-3.5 pointer-events-none flex flex-col justify-end">
            {director && (
              <span className="text-[9px] uppercase tracking-[0.2em] text-amber-300/90 font-bold drop-shadow-xs">
                A {director} Film
              </span>
            )}
            <h4 className="font-display font-black text-white text-base leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] line-clamp-2 mt-0.5">
              {title}
            </h4>
            {tagline && (
              <p className="text-[10px] text-slate-200/90 italic line-clamp-1 mt-0.5 drop-shadow-xs">
                “{tagline}”
              </p>
            )}
          </div>
        </>
      )}

      {/* Fallback Decorative Cinema Emblem if offline */}
      {imgError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-xl">
            <Film className="w-8 h-8 text-amber-400" />
          </div>
        </div>
      )}
    </div>
  );
};
