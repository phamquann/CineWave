import { Seat, Showtime, Voucher } from '../types';

/**
 * Thuật toán 1: Kiểm tra Trùng lịch Phòng chiếu (Interval Overlap Algorithm)
 * isOverlapping = (NewStart < ExistingEnd) && (NewEnd > ExistingStart)
 */
export function checkShowtimeOverlap(
  roomName: string,
  newStartIso: string,
  newEndIso: string,
  existingShowtimes: Showtime[]
): boolean {
  const newStart = new Date(newStartIso).getTime();
  const newEnd = new Date(newEndIso).getTime();

  return existingShowtimes
    .filter((s) => s.roomName.toLowerCase() === roomName.trim().toLowerCase())
    .some((s) => {
      const exStart = new Date(s.startTime).getTime();
      const exEnd = s.endTime
        ? new Date(s.endTime).getTime()
        : exStart + 135 * 60 * 1000;
      return newStart < exEnd && newEnd > exStart;
    });
}

/**
 * Thuật toán 2: Thuật toán Chống ghế trống lẻ ("Orphan Seat" Rule Algorithm)
 * Duyệt qua từng hàng ghế có ghế được chọn.
 * Nếu phát hiện mẫu [BOOKED/LOCKED/SELECTED/WALL] - [AVAILABLE (1 ghế duy nhất)] - [BOOKED/LOCKED/SELECTED/WALL]
 * -> Trả về thông báo lỗi 400 Bad Request ("Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa")
 */
export function checkOrphanSeats(
  allSeats: Seat[],
  selectedSeatCodes: string[]
): string | null {
  const selectedSet = new Set(selectedSeatCodes.map((c) => c.toUpperCase()));
  const affectedRows = new Set(
    allSeats
      .filter((s) => selectedSet.has(s.seatCode.toUpperCase()))
      .map((s) => s.row)
  );

  for (const row of affectedRows) {
    const rowSeats = allSeats
      .filter((s) => s.row === row)
      .sort((a, b) => a.number - b.number);

    let availableStreak = 0;
    for (const seat of rowSeats) {
      const isTaken =
        selectedSet.has(seat.seatCode.toUpperCase()) ||
        seat.status === 'BOOKED' ||
        seat.status === 'LOCKED';

      if (!isTaken) {
        availableStreak++;
      } else {
        if (availableStreak === 1) {
          return `Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa (Hàng ${row})`;
        }
        availableStreak = 0;
      }
    }

    if (availableStreak === 1) {
      return `Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa (Hàng ${row})`;
    }
  }

  return null;
}

/**
 * Thuật toán 4: Tính giá vé Động & Khuyến mãi có Trần (Dynamic Pricing & Capped Discount)
 */
export function validateAndComputeVoucher(
  voucher: Voucher | undefined,
  originalAmount: number
): { discountAmount: number; finalAmount: number; error: string | null } {
  if (!voucher) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      error: 'Mã giảm giá không tồn tại',
    };
  }

  const now = Date.now();
  const start = new Date(voucher.startDate).getTime();
  const end = new Date(voucher.expiryDate).getTime();

  if (!voucher.isActive) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      error: 'Mã giảm giá đang bị khóa hoặc ngừng kích hoạt',
    };
  }
  if (now < start) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      error: 'Mã giảm giá chưa tới ngày áp dụng',
    };
  }
  if (now > end) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      error: 'Mã giảm giá đã hết hạn sử dụng',
    };
  }
  if (voucher.usedCount >= voucher.usageLimit) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      error: 'Mã giảm giá đã hết lượt sử dụng',
    };
  }
  if (originalAmount < voucher.minOrderValue) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      error: `Tổng tiền ghế (${originalAmount.toLocaleString('vi-VN')}đ) chưa đạt mức tối thiểu (${voucher.minOrderValue.toLocaleString('vi-VN')}đ)`,
    };
  }

  let discount = 0;
  if (voucher.discountType === 'FIXED') {
    discount = voucher.discountValue;
  } else {
    const rawPercent = (originalAmount * voucher.discountValue) / 100;
    discount =
      voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0
        ? Math.min(rawPercent, voucher.maxDiscountAmount)
        : rawPercent;
  }

  discount = Math.min(originalAmount, Math.max(0, discount));
  const finalAmount = Math.max(0, originalAmount - discount);

  return {
    discountAmount: discount,
    finalAmount,
    error: null,
  };
}

