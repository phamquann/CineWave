import React, { useState, useEffect } from 'react';
import { Play, Calendar, Star, ChevronLeft, ChevronRight, Users, Film } from 'lucide-react';
import { Movie, Showtime, formatVND } from '../types';
import { MovieArtwork } from './MovieArtwork';

interface HeroBillboardProps {
  movie: Movie;
  movies?: Movie[];
  onSelectShowtime: (movie: Movie, showtime: Showtime) => void;
  onWatchTrailer: (movie: Movie) => void;
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({
  movie,
  movies = [],
  onSelectShowtime,
  onWatchTrailer,
}) => {
  const featuredList =
    movies.filter((m) => m.featured || m.status === 'NOW_SHOWING').slice(0, 6).length > 0
      ? movies.filter((m) => m.featured || m.status === 'NOW_SHOWING').slice(0, 6)
      : [movie];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (featuredList.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredList.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredList.length]);

  const currentMovie = featuredList[activeIndex] || movie;
  const primaryShowtimes = currentMovie.showtimes.slice(0, 4);

  return (
    <section className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl border border-slate-800/80 mb-10">
      {/* Backdrop Image & Gradients */}
      <div className="absolute inset-0">
        <MovieArtwork
          movieId={currentMovie.id}
          title={currentMovie.title}
          posterUrl={currentMovie.posterUrl}
          backdropUrl={currentMovie.backdropUrl}
          themeColor={currentMovie.themeColor}
          accentColor={currentMovie.accentColor}
          aspect="billboard"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent max-w-4xl" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end min-h-[440px]">
        {/* Left Content Column */}
        <div className="lg:col-span-8 flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#4F46E5] text-white shadow-md flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span>BOM TẤN TÂM ĐIỂM ({currentMovie.status === 'NOW_SHOWING' ? 'ĐANG CHIẾU' : currentMovie.status})</span>
            </span>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full text-white ${
                currentMovie.ageRating === 'T18'
                  ? 'bg-red-600'
                  : currentMovie.ageRating === 'T16'
                  ? 'bg-orange-500'
                  : currentMovie.ageRating === 'T13'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            >
              {currentMovie.ageRating}
            </span>
            {currentMovie.formats.map((fmt) => (
              <span
                key={fmt}
                data-testid={`badge-tag-${fmt}`}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20 backdrop-blur-xs"
              >
                {fmt}
              </span>
            ))}
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight text-balance mb-2 drop-shadow-md">
            {currentMovie.title}
          </h1>

          {currentMovie.tagline && (
            <p className="text-sm sm:text-base text-indigo-300 italic font-medium mb-3">
              “{currentMovie.tagline}”
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-300 mb-3">
            <div className="flex items-center gap-1 font-semibold text-amber-400">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{currentMovie.rating}</span>
              <span className="text-slate-400 font-normal">({currentMovie.votesCount})</span>
            </div>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>{currentMovie.duration}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>Đạo diễn: <strong className="text-white">{currentMovie.director}</strong></span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-indigo-200 font-medium">{currentMovie.genres.join(', ')}</span>
          </div>

          <p className="text-sm text-slate-200/95 line-clamp-3 max-w-2xl mb-4 leading-relaxed">
            {currentMovie.synopsis}
          </p>

          {currentMovie.cast && currentMovie.cast.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-6">
              <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                Diễn viên: <strong className="text-white">{currentMovie.cast.join(', ')}</strong>
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {primaryShowtimes[0] && (
                <button
                  onClick={() => onSelectShowtime(currentMovie, primaryShowtimes[0])}
                  data-testid="button-primary-book-featured"
                  className="px-6 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt vé ngay ({formatVND(primaryShowtimes[0].basePrice)})</span>
                </button>
              )}

              <button
                onClick={() => onWatchTrailer(currentMovie)}
                data-testid="button-secondary-trailer"
                className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-sm border border-white/30 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Xem Trailer Chính Thức</span>
              </button>
            </div>

            {primaryShowtimes.length > 0 && (
              <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-white/20">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mr-1">
                  Suất chiếu:
                </span>
                {primaryShowtimes.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onSelectShowtime(currentMovie, st)}
                    data-testid={`slot-showtime-${st.id}`}
                    className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-[#4F46E5] text-white font-medium text-xs border border-white/20 transition-all hover:border-[#4F46E5] cursor-pointer"
                    title={`${st.roomName} - ${st.format}`}
                  >
                    <span className="tabular-nums font-semibold">{st.time}</span>
                    <span className="ml-1 text-[10px] text-indigo-200 uppercase">{st.roomName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Floating Poster Preview & Carousel Switcher */}
        <div className="hidden lg:flex lg:col-span-4 flex-col items-end justify-end gap-4">
          <div
            onClick={() => onWatchTrailer(currentMovie)}
            className="w-52 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl relative group cursor-pointer"
          >
            <MovieArtwork
              movieId={currentMovie.id}
              title={currentMovie.title}
              posterUrl={currentMovie.posterUrl}
              themeColor={currentMovie.themeColor}
              accentColor={currentMovie.accentColor}
              director={currentMovie.director}
              aspect="poster"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              </div>
            </div>
          </div>

          {/* Slide Navigation Controls */}
          {featuredList.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length)
                }
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
                title="Phim trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                {featuredList.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeIndex ? 'w-6 bg-[#4F46E5]' : 'w-2 bg-white/35 hover:bg-white/60'
                    }`}
                    title={m.title}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % featuredList.length)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
                title="Phim tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
