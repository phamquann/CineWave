import React, { useState, useEffect } from 'react';
import {
  Timer,
  Trash2,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Lock,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { Movie, Showtime, Seat, ConfirmedBooking, formatVND } from '../types';
import { CONCESSIONS } from '../data/mockData';

interface BookingSummaryProps {
  movie: Movie | null;
  showtime: Showtime | null;
  selectedSeats: Seat[];
  concessions: Record<string, number>;
  promoCode: string;
  appliedPromo: string | null;
  discountAmount: number;
  promoError: string | null;
  bookingError: string | null;
  activePendingBooking: ConfirmedBooking | null;
  isProcessingAction?: boolean;
  onRemoveSeat: (seatId: string) => void;
  onApplyPromo: (code: string) => void;
  onHoldSeats: () => void;
  onMockPayment: (status: 'SUCCESS' | 'FAILED') => void;
  onProceedToCheckout: () => void;
  onOpenConcessions: () => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  movie,
  showtime,
  selectedSeats,
  concessions,
  promoCode,
  appliedPromo,
  discountAmount,
  promoError,
  bookingError,
  activePendingBooking,
  isProcessingAction = false,
  onRemoveSeat,
  onApplyPromo,
  onHoldSeats,
  onMockPayment,
}) => {
  const [inputCode, setInputCode] = useState(promoCode);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 minutes hold timer

  useEffect(() => {
    if (activePendingBooking?.expiresAt) {
      const updateRemaining = () => {
        const diffSec = Math.max(
          0,
          Math.floor((new Date(activePendingBooking.expiresAt!).getTime() - Date.now()) / 1000)
        );
        setSecondsRemaining(diffSec);
      };
      updateRemaining();
      const timer = setInterval(updateRemaining, 1000);
      return () => clearInterval(timer);
    } else {
      setSecondsRemaining(600);
    }
  }, [activePendingBooking]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculations theo Thuật toán 4:
  // OriginalAmount = Sum(BasePrice + SeatTypeSurcharge_i)
  const seatsSubtotal = activePendingBooking
    ? activePendingBooking.pricing.seatsSubtotal
    : selectedSeats.reduce((acc, s) => acc + s.price, 0);

  const concessionsSubtotal = Object.entries(concessions).reduce((acc, [id, qty]) => {
    const item = CONCESSIONS.find((c) => c.id === id);
    return acc + (item ? item.price * qty : 0);
  }, 0);

  const originalAmount = seatsSubtotal + concessionsSubtotal;
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  const hasSelections = selectedSeats.length > 0 || Boolean(activePendingBooking);
  const displayError = bookingError || promoError;

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyPromo(inputCode.trim().toUpperCase());
  };

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 lg:p-6 flex flex-col justify-between sticky top-24">
      <div>
        {/* Header with 10:00 Hold Countdown Timer */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="font-display font-bold text-base text-[#0F172A]">
              Giỏ Vé & Thanh Toán
            </h3>
          </div>

          <div
            data-testid="cart-timer"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
              activePendingBooking
                ? secondsRemaining < 120
                  ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-indigo-50 text-[#4F46E5] border border-indigo-200'
            }`}
            title="Thời gian giữ ghế 10 phút"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>
        </div>

        {/* Khu vực hiển thị Thông báo lỗi chuẩn data-testid="alert-error-message" */}
        {displayError && (
          <div
            data-testid="alert-error-message"
            className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Trạng thái đơn hàng PENDING nếu đã bấm Giữ ghế */}
        {activePendingBooking && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Đã khóa ghế nguyên tử (LOCKED)
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 text-[10px]">
                PENDING
              </span>
            </div>
            <div className="text-[11px] text-amber-800">
              Mã đơn: <strong className="font-mono">{activePendingBooking.bookingId}</strong> · Ghế:{' '}
              <strong>{activePendingBooking.seatCodes.join(', ')}</strong>
            </div>
          </div>
        )}

        {/* Movie Details */}
        {movie && showtime ? (
          <div className="py-3.5 border-b border-slate-100">
            <h4 className="font-display font-bold text-sm text-[#0F172A] line-clamp-1">
              {movie.title}
            </h4>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[#4F46E5]">{showtime.roomName}</span>
              <span aria-hidden="true">·</span>
              <span>{showtime.format}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-800">
                {showtime.date} {showtime.time}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-xs text-slate-400 italic text-center">
            Chưa chọn suất chiếu.
          </div>
        )}

        {/* Selected Seats Itemized Chips (1 - 8 ghế) */}
        <div className="py-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ghế đang chọn ({selectedSeats.length}/8)
            </span>
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              {formatVND(seatsSubtotal)}
            </span>
          </div>

          {selectedSeats.length === 0 ? (
            <div className="text-xs text-slate-400 py-2">
              Vui lòng chọn từ 1 đến tối đa 8 ghế trên sơ đồ (không để trống 1 ghế lẻ).
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {selectedSeats.map((seat) => (
                <div
                  key={seat.seatCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold"
                >
                  <span className="text-[#4F46E5]">{seat.seatCode}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({seat.type} · {formatVND(seat.price)})
                  </span>
                  {!activePendingBooking && (
                    <button
                      type="button"
                      onClick={() => onRemoveSeat(seat.seatCode)}
                      data-testid={`button-remove-seat-${seat.seatCode}`}
                      className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-sm cursor-pointer"
                      title={`Bỏ chọn ghế ${seat.seatCode}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Khu vực Voucher & Giỏ hàng với đúng data-testid trong HD.md */}
        <div className="py-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mã Khuyến Mãi (Voucher)
            </span>
            <span className="text-[10px] text-indigo-600 font-medium">
              Thử: GIAM50K, CINEWAVE20, VIP50PT
            </span>
          </div>
          <form onSubmit={handlePromoSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã (VD: GIAM50K)"
              data-testid="input-voucher"
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5] uppercase tracking-wider font-bold placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
            />
            <button
              type="submit"
              data-testid="btn-apply-voucher"
              className="px-3.5 py-2 bg-indigo-50 hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white font-bold text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer shrink-0"
            >
              Áp dụng
            </button>
          </form>

          {appliedPromo && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Đã áp dụng mã <strong>{appliedPromo}</strong> (-{formatVND(discountAmount)})
              </span>
            </div>
          )}
        </div>

        {/* Price Breakdown Calculation */}
        <div className="py-3.5 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Tổng tiền ghế gốc (Original Amount)</span>
            <span
              data-testid="text-original-amount"
              className="tabular-nums font-semibold text-slate-800"
            >
              {formatVND(originalAmount)}
            </span>
          </div>

          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>Số tiền giảm giá (Discount)</span>
            <span data-testid="text-discount-amount" className="tabular-nums">
              {discountAmount > 0 ? `-${formatVND(discountAmount)}` : '0đ'}
            </span>
          </div>
        </div>
      </div>

      {/* Grand Total & Action Buttons (Hold Seats + Mock Payment SUCCESS / FAIL) */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase font-bold text-slate-500">
            Thành tiền cuối cùng
          </span>
          <span
            data-testid="text-final-amount"
            className="font-display font-extrabold text-2xl text-[#0F172A] tabular-nums"
          >
            {formatVND(finalAmount)}
          </span>
        </div>

        {/* Bước 1: Nút Giữ ghế tạm thời 10 phút (data-testid="btn-hold-seats") */}
        <button
          type="button"
          onClick={onHoldSeats}
          disabled={!hasSelections || Boolean(activePendingBooking) || isProcessingAction}
          data-testid="btn-hold-seats"
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
            hasSelections && !activePendingBooking
              ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>
            {activePendingBooking
              ? 'Đã khóa ghế (Đang chờ thanh toán 10:00)'
              : '1. Giữ ghế tạm thời (10 phút)'}
          </span>
        </button>

        {/* Bước 2: Giả lập Cổng Thanh Toán (Mock Payment Gateway: SUCCESS / FAILED) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            2. Giả lập Kết quả Cổng Thanh Toán (Webhook):
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onMockPayment('SUCCESS')}
              disabled={!hasSelections || isProcessingAction}
              data-testid="btn-pay-success"
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                hasSelections
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Thanh toán SUCCESS</span>
            </button>

            <button
              type="button"
              onClick={() => onMockPayment('FAILED')}
              disabled={!hasSelections || isProcessingAction}
              data-testid="btn-pay-fail"
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                hasSelections
                  ? 'bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Thanh toán FAILED</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
