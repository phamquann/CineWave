export type MovieFormat = 'IMAX' | 'Dolby Atmos' | '3D' | '4DX' | 'VIP';

export type AgeRatingType = 'P' | 'T13' | 'T16' | 'T18' | string;
export type MovieStatusType = 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';
export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthSession {
  accessToken: string;
  userId: string;
  role: UserRole;
  exp: number;
  user: User;
}

export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export type SeatTier = 'standard' | 'premium' | 'vip';
export type SeatState = 'available' | 'selected' | 'occupied' | 'reserved';

export interface Seat {
  id: string; // e.g. "A1"
  seatCode: string; // e.g. "A1"
  row: string; // "A".."G"
  number: number; // 1..8
  type: SeatType; // STANDARD, VIP, COUPLE
  surcharge: number;
  tier: SeatTier;
  price: number;
  status: SeatStatus; // AVAILABLE, LOCKED, BOOKED
  state: SeatState;
  lockedBy?: string | null;
  lockedUntil?: string | null;
}

export interface Showtime {
  id: string;
  movieId: string;
  movieTitle?: string;
  roomName: string; // e.g. "Cinema 01", "Cinema 02"
  auditorium: string;
  time: string;
  date: string;
  startTime: string;
  endTime?: string;
  format: MovieFormat;
  basePrice: number;
  seats?: Seat[];
}

export interface Movie {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  director: string;
  cast: string[];
  rating: number;
  votesCount: string;
  ageRating: AgeRatingType; // P, T13, T16, T18
  status: MovieStatusType; // COMING_SOON, NOW_SHOWING, ENDED
  durationMinutes: number;
  duration: string;
  genres: string[];
  formats: MovieFormat[];
  themeColor: string;
  accentColor: string;
  featured?: boolean;
  showtimes: Showtime[];
  posterUrl?: string;
  backdropUrl?: string;
  trailerVideoUrl?: string;
}

export interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
}

export interface ConcessionItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'combos' | 'popcorn' | 'beverages' | 'treats';
  badge?: string;
  calories?: string;
}

export type BookingStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'CHECKED_IN';

export interface ConfirmedBooking {
  id?: string;
  bookingId: string;
  movie: Movie;
  showtime: Showtime;
  seatCodes: string[];
  seats: Seat[];
  concessions: { item: ConcessionItem; quantity: number }[];
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  pricing: {
    seatsSubtotal: number;
    concessionsSubtotal: number;
    bookingFee: number;
    tax: number;
    discount: number;
    total: number;
  };
  voucherCode?: string | null;
  status: BookingStatus;
  qrCode?: string | null;
  confirmedAt: string;
  expiresAt?: string | null;
  paidAt?: string | null;
  checkedInAt?: string | null;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';
}
