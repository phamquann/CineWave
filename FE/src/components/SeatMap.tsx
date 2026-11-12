import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, RefreshCw } from 'lucide-react';
import { Movie, Showtime, Seat, formatVND } from '../types';

interface SeatMapProps {
  movie: Movie;
  showtime: Showtime;
  seats: Seat[];
  selectedSeats: Seat[];
  activePendingSeatCodes?: string[];
  onToggleSeat: (seat: Seat) => void;
  onRefreshSeats?: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  movie,
  showtime,
  seats,
  selectedSeats,
  activePendingSeatCodes = [],
  onToggleSeat,
  onRefreshSeats,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const isSeatSelected = (seatCode: string) => {
    return selectedSeats.some((s) => s.seatCode === seatCode || s.id === seatCode);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(1.4, Math.max(0.8, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const basePrice = showtime.basePrice || 90000;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col relative overflow-hidden">
      {/* Top Hall Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200">
              {showtime.format}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {showtime.roomName || showtime.auditorium}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-white">
              {movie.ageRating}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0F172A]">
            {movie.title}
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Suất chiếu ngày <strong>{showtime.date}</strong> lúc{' '}
            <span className="font-semibold text-slate-800">{showtime.time}</span> · Giá vé gốc:{' '}
            <strong className="text-[#4F46E5]">{formatVND(basePrice)}</strong>
          </div>
        </div>

        {/* Zoom & Refresh Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-xl border border-slate-200">
          {onRefreshSeats && (
            <button
              type="button"
              onClick={onRefreshSeats}
              title="Làm mới trạng thái ghế từ Server (Lazy Check)"
              data-testid="btn-refresh-seats"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-[#4F46E5] transition-colors cursor-pointer text-xs font-medium px-2 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại ghế</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset View"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-xs font-medium px-2 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive Seating Canvas */}
      <div className="my-6 overflow-x-auto overflow-y-hidden py-4 flex flex-col items-center">
        <div
          className="transition-transform duration-200 origin-top flex flex-col items-center min-w-[540px]"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Cinema Screen Curve */}
          <div className="w-full max-w-[500px] mb-10 flex flex-col items-center">
            <div className="w-full screen-curve mb-3 shadow-[0_-12px_28px_rgba(79,70,229,0.3)]" />
            <div className="text-[11px] font-bold tracking-[0.25em] text-slate-400 uppercase flex items-center gap-2">
              <span>Màn Hình Chiếu (Screen)</span>
            </div>
          </div>

          {/* Seating Grid: 7 Hàng (A-G) x 8 Ghế = 56 Ghế */}
          <div className="flex flex-col gap-3">
            {rows.map((row) => {
              const rowSeats = seats
                .filter((s) => s.row === row)
                .sort((a, b) => a.number - b.number);
              const rowType =
                row === 'A' || row === 'B' || row === 'C'
                  ? 'STANDARD'
                  : row === 'D' || row === 'E' || row === 'F'
                  ? 'VIP'
                  : 'COUPLE';

              return (
                <div key={row} className="flex items-center gap-3">
                  {/* Row Letter + Type Badge */}
                  <div className="w-16 flex items-center justify-end gap-1.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {rowType}
                    </span>
                    <span className="w-5 text-xs font-extrabold text-slate-600 text-center">
                      {row}
                    </span>
                  </div>

                  {/* Seats in Row (1..8) */}
                  <div className="flex items-center gap-2.5">
                    {rowSeats.map((seat) => {
                      const code = seat.seatCode || `${seat.row}${seat.number}`;
                      const selected = isSeatSelected(code);
                      const isLockedInCurrentOrder = activePendingSeatCodes.includes(code);
                      const status = (seat.status || 'AVAILABLE').toUpperCase() as
                        | 'AVAILABLE'
                        | 'LOCKED'
                        | 'BOOKED';

                      const isBooked = status === 'BOOKED';
                      const isLocked = status === 'LOCKED';

                      // Class chuẩn theo HD.md: .seat-available, .seat-selected, .seat-locked, .seat-booked
                      let seatClass = 'seat-available';
                      if (isBooked) {
                        seatClass = 'seat-booked';
                      } else if (selected) {
                        seatClass = 'seat-selected';
                      } else if (isLocked) {
                        seatClass = 'seat-locked';
                      }

                      // Viền phân biệt hạng ghế khi còn trống
                      const tierBorderClass =
                        !selected && status === 'AVAILABLE'
                          ? seat.type === 'COUPLE'
                            ? 'border-pink-400 text-pink-900 bg-pink-50/30'
                            : seat.type === 'VIP'
                            ? 'border-indigo-400 text-indigo-900 bg-indigo-50/20'
                            : ''
                          : '';

                      return (
                        <div key={code} className="relative flex items-center">
                          <button
                            type="button"
                            disabled={isBooked || (isLocked && !isLockedInCurrentOrder && !selected)}
                            onClick={() => onToggleSeat(seat)}
                            data-testid={`seat-${code}`}
                            data-status={status}
                            data-seat-type={seat.type}
                            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[11px] font-bold transition-all cursor-pointer relative ${seatClass} ${tierBorderClass}`}
                          >
                            {selected ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span>{code}</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trailing Row Letter */}
                  <span className="w-6 text-xs font-extrabold text-slate-400 text-center">
                    {row}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chú thích Trạng thái & Loại ghế theo HD.md */}
      <div className="pt-5 border-t border-slate-200 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md seat-available flex items-center justify-center text-[9px] font-bold">
              A1
            </div>
            <div>
              <div className="font-bold text-slate-900">AVAILABLE (Trắng)</div>
              <div className="text-[11px] text-slate-500">Ghế còn trống</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md seat-selected flex items-center justify-center text-[9px] font-bold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <div className="font-bold text-emerald-700">SELECTED (Xanh lá)</div>
              <div className="text-[11px] text-slate-500">Đang chọn (1-8 ghế)</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md seat-locked flex items-center justify-center text-[9px] font-bold">
              B5
            </div>
            <div>
              <div className="font-bold text-amber-700">LOCKED (Vàng cam)</div>
              <div className="text-[11px] text-slate-500">Đang giữ chờ thanh toán</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md seat-booked flex items-center justify-center text-[9px] font-bold">
              C2
            </div>
            <div>
              <div className="font-bold text-red-700">BOOKED (Đỏ)</div>
              <div className="text-[11px] text-slate-500">Đã bán (Disabled)</div>
            </div>
          </div>
        </div>

        {/* Chú thích Giá theo Hạng ghế */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <span className="text-slate-600 font-medium">Hàng A–C (STANDARD):</span>
            <strong className="text-slate-900">{formatVND(basePrice)}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-200 flex justify-between items-center">
            <span className="text-indigo-900 font-medium">Hàng D–F (VIP +20k):</span>
            <strong className="text-[#4F46E5]">{formatVND(basePrice + 20000)}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-200 flex justify-between items-center">
            <span className="text-pink-900 font-medium">Hàng G (COUPLE x2 + 20k):</span>
            <strong className="text-pink-700">{formatVND(basePrice * 2 + 20000)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
