import React from 'react';
import { Star, Clock, Play, Ticket, Users } from 'lucide-react';
import { Movie, Showtime, formatVND } from '../types';
import { MovieArtwork } from './MovieArtwork';

interface MovieCardProps {
  movie: Movie;
  selectedDate: string;
  onSelectShowtime: (movie: Movie, showtime: Showtime) => void;
  onWatchTrailer: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  selectedDate,
  onSelectShowtime,
  onWatchTrailer,
}) => {
  const dateShowtimes = movie.showtimes.filter((st) => st.date === selectedDate);
  const displayShowtimes = dateShowtimes.length > 0 ? dateShowtimes : movie.showtimes.slice(0, 4);

  const statusLabel =
    movie.status === 'NOW_SHOWING'
      ? 'ĐANG CHIẾU'
      : movie.status === 'COMING_SOON'
      ? 'SẮP CHIẾU'
      : 'ĐÃ KẾT THÚC';

  return (
    <div
      data-testid={`card-movie-${movie.id}`}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
    >
      {/* 2:3 Poster Ratio Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <MovieArtwork
          movieId={movie.id}
          title={movie.title}
          posterUrl={movie.posterUrl}
          backdropUrl={movie.backdropUrl}
          themeColor={movie.themeColor}
          accentColor={movie.accentColor}
          director={movie.director}
          tagline={movie.tagline}
          aspect="poster"
        />

        {/* Hover Trailer Overlay Button */}
        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={() => onWatchTrailer(movie)}
            data-testid={`button-secondary-trailer-${movie.id}`}
            className="px-5 py-2.5 rounded-full bg-white text-[#0F172A] font-bold text-xs shadow-xl hover:bg-indigo-600 hover:text-white transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Xem Trailer & Chi Tiết</span>
          </button>
        </div>

        {/* Top Floating Tag / Formats & Age Rating */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap gap-1">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                movie.status === 'NOW_SHOWING'
                  ? 'bg-emerald-500 text-white'
                  : movie.status === 'COMING_SOON'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {statusLabel}
            </span>
            {movie.formats.slice(0, 2).map((fmt) => (
              <span
                key={fmt}
                data-testid={`badge-tag-${fmt}`}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-[#4F46E5] border border-indigo-100 shadow-xs backdrop-blur-xs"
              >
                {fmt}
              </span>
            ))}
          </div>
          <span
            className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md text-white shadow-sm ${
              movie.ageRating === 'T18'
                ? 'bg-red-600'
                : movie.ageRating === 'T16'
                ? 'bg-orange-500'
                : movie.ageRating === 'T13'
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
          >
            {movie.ageRating}
          </span>
        </div>

        {/* Bottom Scrim with duration & rating */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1 font-semibold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">{movie.rating}</span>
            <span className="text-[10px] text-slate-400 font-normal">({movie.votesCount})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{movie.duration}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between gap-1.5">
            <span className="font-semibold text-indigo-600 truncate">
              {movie.genres.slice(0, 3).join(' · ')}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0">ĐD: {movie.director}</span>
          </div>

          <h3
            onClick={() => onWatchTrailer(movie)}
            className="font-display font-bold text-base text-[#0F172A] leading-snug line-clamp-1 group-hover:text-[#4F46E5] transition-colors mb-1.5 cursor-pointer"
          >
            {movie.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mb-2.5 leading-relaxed">
            {movie.synopsis}
          </p>

          {movie.cast && movie.cast.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 truncate">
              <Users className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">Diễn viên: {movie.cast.slice(0, 3).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Showtime Slots Section */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Suất chiếu ({displayShowtimes.length})
            </span>
            <button
              type="button"
              onClick={() => onWatchTrailer(movie)}
              className="text-[11px] font-semibold text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Trailer</span>
            </button>
          </div>

          {displayShowtimes.length === 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 italic py-2.5 px-3 text-center bg-slate-50 rounded-lg border border-slate-100">
                {movie.status === 'COMING_SOON'
                  ? 'Phim sắp khởi chiếu — Xem trước Trailer chính thức'
                  : 'Đã kết thúc đợt chiếu tại rạp'}
              </div>
              <button
                type="button"
                onClick={() => onWatchTrailer(movie)}
                className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Xem Trailer & Nội Dung Phim</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {displayShowtimes.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onSelectShowtime(movie, st)}
                    data-testid={`slot-showtime-${st.id}`}
                    className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-[#4F46E5] hover:bg-indigo-50/50 transition-all text-left group/slot cursor-pointer flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0F172A] group-hover/slot:text-[#4F46E5] tabular-nums">
                        {st.time}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover/slot:text-[#4F46E5] font-semibold uppercase">
                        {st.format}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5">
                      {st.roomName} · {formatVND(st.basePrice)}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => onSelectShowtime(movie, displayShowtimes[0])}
                data-testid={`button-primary-select-${movie.id}`}
                className="w-full mt-3 py-2.5 px-3 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Đặt vé ngay · Từ {formatVND(displayShowtimes[0]?.basePrice || 80000)}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
