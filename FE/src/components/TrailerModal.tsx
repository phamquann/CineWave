import React, { useState } from 'react';
import { X, Play, Star, Clock, Film, Users, UserCheck, Ticket, Tv } from 'lucide-react';
import { Movie, Showtime, formatVND } from '../types';
import { MovieArtwork } from './MovieArtwork';

interface TrailerModalProps {
  movie: Movie;
  onClose: () => void;
  onBookNow: (movie: Movie) => void;
  onSelectShowtime?: (movie: Movie, showtime: Showtime) => void;
}

const FALLBACK_YOUTUBE_BY_KEYWORD: Record<string, string> = {
  dune: 'https://www.youtube.com/embed/Way9Dexny3w',
  deadpool: 'https://www.youtube.com/embed/73_1biulkYk',
  oppenheimer: 'https://www.youtube.com/embed/uYPbbksJxIg',
  mai: 'https://www.youtube.com/embed/EX6clvId19s',
  'lật mặt': 'https://www.youtube.com/embed/Q2B7w8t2x9c',
  exhuma: 'https://www.youtube.com/embed/ceb2E811b6U',
  'inside out': 'https://www.youtube.com/embed/LEjhY15eCx0',
  avatar: 'https://www.youtube.com/embed/d9MyW72ELq0',
  'spider-man': 'https://www.youtube.com/embed/cqGjhVJWtEg',
  godzilla: 'https://www.youtube.com/embed/lV1OOlGwExM',
  conan: 'https://www.youtube.com/embed/C4pM3v2tG20',
  interstellar: 'https://www.youtube.com/embed/zSWdZVtXT7E',
  joker: 'https://www.youtube.com/embed/_OKAwz2MsJs',
  venom: 'https://www.youtube.com/embed/__2bjWbetsA',
  wicked: 'https://www.youtube.com/embed/6COmYeLsz4c',
  batman: 'https://www.youtube.com/embed/mqqft2x_Aa4',
};

export const TrailerModal: React.FC<TrailerModalProps> = ({
  movie,
  onClose,
  onBookNow,
  onSelectShowtime,
}) => {
  const [videoMode, setVideoMode] = useState<'youtube' | 'mp4'>('youtube');

  const resolvedYoutubeEmbed = (() => {
    if (movie.trailerVideoUrl && movie.trailerVideoUrl.includes('youtube.com/embed/')) {
      return `${movie.trailerVideoUrl}?autoplay=1&rel=0`;
    }
    if (movie.trailerVideoUrl && movie.trailerVideoUrl.includes('watch?v=')) {
      const vid = movie.trailerVideoUrl.split('watch?v=')[1]?.split('&')[0];
      if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
    }
    const lowerTitle = movie.title.toLowerCase();
    for (const [k, url] of Object.entries(FALLBACK_YOUTUBE_BY_KEYWORD)) {
      if (lowerTitle.includes(k)) {
        return `${url}?autoplay=1&rel=0`;
      }
    }
    return 'https://www.youtube.com/embed/Way9Dexny3w?autoplay=1&rel=0';
  })();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white">
              <Film className="w-4 h-4" />
            </span>
            <div>
              <span className="font-display font-bold text-sm text-white block leading-tight">
                Trailer Chính Thức & Thông Tin Phim · {movie.title}
              </span>
              <span className="text-[11px] text-slate-400">
                Đạo diễn: {movie.director} · Thời lượng: {movie.duration} · Độ tuổi: {movie.ageRating}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVideoMode(videoMode === 'youtube' ? 'mp4' : 'youtube')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Đổi nguồn phát video nếu mạng chặn YouTube"
            >
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span>{videoMode === 'youtube' ? 'Nguồn: YouTube HD' : 'Nguồn: Cinema MP4'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Video Player Container */}
          <div className="relative aspect-video w-full bg-black overflow-hidden">
            {videoMode === 'youtube' ? (
              <iframe
                src={resolvedYoutubeEmbed}
                title={`Trailer - ${movie.title}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
                poster={movie.backdropUrl || movie.posterUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Rich Movie Details & Synopsis Footer */}
          <div className="p-6 bg-slate-950 text-white border-t border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Mini Poster */}
              <div className="hidden md:block md:col-span-3 aspect-[2/3] rounded-xl overflow-hidden border border-slate-800 shadow-lg">
                <MovieArtwork
                  movieId={movie.id}
                  title={movie.title}
                  posterUrl={movie.posterUrl}
                  themeColor={movie.themeColor}
                  accentColor={movie.accentColor}
                  director={movie.director}
                  aspect="poster"
                />
              </div>

              {/* Full Metadata & Synopsis */}
              <div className="md:col-span-9 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        movie.status === 'NOW_SHOWING'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : movie.status === 'COMING_SOON'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {movie.status === 'NOW_SHOWING'
                        ? 'ĐANG KHỞI CHIẾU'
                        : movie.status === 'COMING_SOON'
                        ? 'SẮP KHỞI CHIẾU'
                        : 'ĐÃ KẾT THÚC'}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-red-600 text-white">
                      {movie.ageRating}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{movie.rating}</span>
                      <span className="text-slate-400 font-normal">({movie.votesCount} đánh giá)</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 text-xs">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{movie.duration}</span>
                    </div>
                  </div>

                  <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                    {movie.title}
                  </h3>
                  {movie.tagline && (
                    <p className="text-xs sm:text-sm text-indigo-300 italic mt-0.5">
                      “{movie.tagline}”
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                    {movie.synopsis}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        Đạo diễn: <strong className="text-white">{movie.director}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        Thể loại: <strong className="text-white">{movie.genres.join(', ')}</strong>
                      </span>
                    </div>
                    {movie.cast && movie.cast.length > 0 && (
                      <div className="sm:col-span-2 flex items-start gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>
                          Diễn viên: <strong className="text-white">{movie.cast.join(', ')}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Showtimes Selection inside Trailer Modal */}
                {movie.showtimes && movie.showtimes.length > 0 ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                      Chọn nhanh suất chiếu để đặt ghế:
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {movie.showtimes.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => {
                            onClose();
                            if (onSelectShowtime) {
                              onSelectShowtime(movie, st);
                            } else {
                              onBookNow(movie);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#4F46E5] border border-slate-700 hover:border-[#4F46E5] text-xs transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Ticket className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-bold text-white tabular-nums">{st.time}</span>
                          <span className="text-[10px] text-slate-300">
                            ({st.roomName} · {st.format} · {formatVND(st.basePrice)})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 font-medium">
                    Phim hiện thuộc danh mục {movie.status} — Bạn có thể tạo thêm lịch chiếu cho phim này trong mục Quản trị (Admin).
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
