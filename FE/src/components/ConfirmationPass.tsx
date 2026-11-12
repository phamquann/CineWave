import React from 'react';
import { CheckCircle2, Download, ArrowLeft, Popcorn, ShieldCheck } from 'lucide-react';
import { ConfirmedBooking, formatVND } from '../types';

interface ConfirmationPassProps {
  booking: ConfirmedBooking;
  onDone: () => void;
}

export const ConfirmationPass: React.FC<ConfirmationPassProps> = ({ booking, onDone }) => {
  const { movie, showtime, seats, seatCodes, concessions, customer, pricing, bookingId, qrCode, status } = booking;
  const displaySeats =
    seatCodes && seatCodes.length > 0
      ? seatCodes.join(', ')
      : seats.map((s) => s.seatCode || `${s.row}${s.number}`).join(', ');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Success Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="flex justify-center mb-2">
          <span
            data-testid="badge-status-confirmed"
            className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
          >
            Trạng thái vé: {status || 'PAID'}
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
          Vé Điện Tử & Mã QR Của Bạn Đã Sẵn Sàng!
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Thông tin vé đã được lưu cho tài khoản{' '}
          <span className="font-semibold text-slate-800">{customer.email}</span>.
        </p>
      </div>

      {/* Modern Boarding Pass Style Digital Ticket Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Pass Header Band */}
        <div className="bg-[#4F46E5] text-white p-6 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-white/20 text-white font-bold flex items-center justify-center text-xs">
                CW
              </span>
              <span className="font-display font-bold text-base tracking-tight">
                CineWave Digital Ticket Pass
              </span>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-white/15 text-white border border-white/20">
              Mã đơn: {bookingId}
            </span>
          </div>

          <div className="mt-6 relative z-10">
            <div className="text-xs uppercase font-semibold text-indigo-200 tracking-wider">
              {showtime.roomName} · {showtime.format}
            </div>
            <h3 className="font-display font-extrabold text-2xl text-white mt-0.5">
              {movie.title}
            </h3>
            <div className="text-xs text-indigo-100 mt-1">
              Phân loại độ tuổi: {movie.ageRating}
            </div>
          </div>

          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* Pass Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Ngày chiếu</div>
              <div className="font-bold text-sm text-[#0F172A] mt-0.5">{showtime.date}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Giờ chiếu</div>
              <div className="font-bold text-sm text-[#0F172A] mt-0.5 tabular-nums">{showtime.time}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Mã Ghế</div>
              <div className="font-bold text-sm text-[#4F46E5] mt-0.5">{displaySeats}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Khách hàng</div>
              <div className="font-bold text-sm text-[#0F172A] mt-0.5 truncate">
                {customer.fullName}
              </div>
            </div>
          </div>

          {/* Scannable Ticket QR & Barcode Section */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col items-center text-center">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 mb-3">
              <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none">
                <rect x="5" y="5" width="26" height="26" rx="4" stroke="#0F172A" strokeWidth="4" />
                <rect x="11" y="11" width="14" height="14" rx="2" fill="#0F172A" />

                <rect x="69" y="5" width="26" height="26" rx="4" stroke="#0F172A" strokeWidth="4" />
                <rect x="75" y="11" width="14" height="14" rx="2" fill="#0F172A" />

                <rect x="5" y="69" width="26" height="26" rx="4" stroke="#0F172A" strokeWidth="4" />
                <rect x="11" y="75" width="14" height="14" rx="2" fill="#0F172A" />

                <rect x="37" y="10" width="6" height="6" fill="#0F172A" />
                <rect x="47" y="14" width="6" height="6" fill="#0F172A" />
                <rect x="57" y="8" width="6" height="6" fill="#0F172A" />

                <rect x="37" y="24" width="6" height="6" fill="#0F172A" />
                <rect x="47" y="28" width="6" height="6" fill="#4F46E5" />
                <rect x="57" y="22" width="6" height="6" fill="#0F172A" />

                <rect x="10" y="37" width="6" height="6" fill="#0F172A" />
                <rect x="22" y="47" width="6" height="6" fill="#0F172A" />
                <rect x="38" y="42" width="8" height="8" rx="2" fill="#4F46E5" />
                <rect x="52" y="38" width="6" height="6" fill="#0F172A" />
                <rect x="68" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="82" y="38" width="6" height="6" fill="#0F172A" />

                <rect x="37" y="58" width="6" height="6" fill="#0F172A" />
                <rect x="48" y="66" width="6" height="6" fill="#0F172A" />
                <rect x="58" y="56" width="6" height="6" fill="#0F172A" />
                <rect x="70" y="68" width="6" height="6" fill="#0F172A" />
                <rect x="84" y="60" width="6" height="6" fill="#0F172A" />
                <rect x="78" y="80" width="6" height="6" fill="#0F172A" />
              </svg>
            </div>

            <div
              data-testid="text-qr-code"
              className="text-xs font-mono font-bold text-[#4F46E5] bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200 tracking-wider"
            >
              {qrCode || bookingId}
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5">
              Đưa mã QR này cho Nhân viên soát vé (Staff / Admin) để Check-in vào phòng chiếu
            </div>
          </div>

          {/* Financial summary receipt */}
          <div className="pt-2 space-y-1 text-xs text-slate-500 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Tổng tiền gốc:</span>
              <span>{formatVND(pricing.seatsSubtotal)}</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Giảm giá Voucher {booking.voucherCode ? `(${booking.voucherCode})` : ''}:</span>
                <span>-{formatVND(pricing.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 text-slate-800">
              <span className="font-bold">Thành tiền đã thanh toán:</span>
              <span className="font-extrabold text-base text-[#0F172A] tabular-nums font-display">
                {formatVND(pricing.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => navigator.clipboard?.writeText(qrCode || bookingId)}
            data-testid="button-primary-download"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Sao chép Mã QR ({qrCode || bookingId})</span>
          </button>

          <button
            onClick={onDone}
            data-testid="button-secondary-done"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Đặt vé</span>
          </button>
        </div>
      </div>
    </div>
  );
};
