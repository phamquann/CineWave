import React from 'react';
import { Ticket, Calendar, Clock, MapPin, QrCode, CreditCard, XCircle } from 'lucide-react';
import { ConfirmedBooking, formatVND } from '../types';

interface MyBookingsViewProps {
  bookings: ConfirmedBooking[];
  onSelectBooking: (booking: ConfirmedBooking) => void;
  onBrowseMovies: () => void;
  onPayPendingBooking?: (bookingId: string, status: 'SUCCESS' | 'FAILED') => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  onSelectBooking,
  onBrowseMovies,
  onPayPendingBooking,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CHECKED_IN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
            Lịch Sử Đặt Vé & Mã QR Của Tôi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi trạng thái đơn vé (PENDING, PAID, CANCELLED, EXPIRED, CHECKED_IN) và mã QR Check-in.
          </p>
        </div>

        <button
          onClick={onBrowseMovies}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors cursor-pointer"
        >
          Đặt thêm vé mới
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-lg text-[#0F172A] mb-1">
            Chưa có lịch sử đặt vé
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Hãy chọn suất chiếu, giữ ghế và hoàn tất thanh toán để nhận mã vé QR điện tử.
          </p>
          <button
            onClick={onBrowseMovies}
            className="px-5 py-2.5 rounded-xl bg-[#4F46E5] text-white font-semibold text-xs hover:bg-[#4338CA] transition-colors cursor-pointer shadow-xs"
          >
            Xem Lịch Chiếu Hôm Nay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const seatList =
              booking.seatCodes && booking.seatCodes.length > 0
                ? booking.seatCodes.join(', ')
                : booking.seats.map((s) => s.seatCode || `${s.row}${s.number}`).join(', ');

            return (
              <div
                key={booking.bookingId}
                data-testid={`booking-item-${booking.bookingId}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      data-testid={`booking-status-${booking.bookingId}`}
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      #{booking.bookingId}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5]">
                      {booking.showtime.roomName} · {booking.showtime.format}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                    {booking.movie.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.showtime.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="tabular-nums font-semibold text-slate-700">
                        {booking.showtime.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.showtime.roomName}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 font-medium">
                    Ghế: <span className="text-[#4F46E5] font-bold">{seatList}</span>
                    {booking.voucherCode && (
                      <span className="ml-2 text-emerald-600 font-semibold">
                        · Voucher: {booking.voucherCode} (-{formatVND(booking.pricing.discount)})
                      </span>
                    )}
                  </div>

                  {booking.qrCode && (
                    <div className="text-xs font-mono text-slate-700 bg-slate-50 inline-block px-2.5 py-1 rounded border border-slate-200 mt-1">
                      QR Code: <strong className="text-[#4F46E5]">{booking.qrCode}</strong>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">
                      Thành tiền
                    </span>
                    <div className="font-display font-extrabold text-lg text-[#0F172A] tabular-nums">
                      {formatVND(booking.pricing.total)}
                    </div>
                  </div>

                  {booking.status === 'PENDING' && onPayPendingBooking ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPayPendingBooking(booking.bookingId, 'SUCCESS')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thanh toán</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPayPendingBooking(booking.bookingId, 'FAILED')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectBooking(booking)}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Xem Vé QR</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
