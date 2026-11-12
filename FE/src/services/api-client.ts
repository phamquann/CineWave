import {
  AuthSession,
  ConfirmedBooking,
  Movie,
  MovieFormat,
  Seat,
  Showtime,
  User,
  Voucher,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('currentUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem('accessToken', session.accessToken);
  localStorage.setItem('currentUser', JSON.stringify(session.user));
}

export function clearAuthSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('currentUser');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Lỗi HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return (payload?.data !== undefined ? payload.data : payload) as T;
}

export function mapBackendSeat(s: any, basePrice: number = 90000): Seat {
  const seatCode = s.seatCode || s.id || `${s.row}${s.number}`;
  const row = s.row || seatCode.charAt(0);
  const number = s.number || parseInt(seatCode.slice(1), 10) || 1;
  const type = (s.type || (row >= 'A' && row <= 'C' ? 'STANDARD' : row <= 'F' ? 'VIP' : 'COUPLE')) as
    | 'STANDARD'
    | 'VIP'
    | 'COUPLE';
  const surcharge =
    s.surcharge !== undefined
      ? s.surcharge
      : type === 'STANDARD'
      ? 0
      : type === 'VIP'
      ? 20000
      : basePrice + 20000;
  const price = s.price || basePrice + surcharge;
  const status = (s.status || 'AVAILABLE').toUpperCase() as 'AVAILABLE' | 'LOCKED' | 'BOOKED';

  return {
    id: seatCode,
    seatCode,
    row,
    number,
    type,
    surcharge,
    tier: type === 'STANDARD' ? 'standard' : type === 'VIP' ? 'premium' : 'vip',
    price,
    status,
    state: status === 'BOOKED' ? 'occupied' : status === 'LOCKED' ? 'reserved' : 'available',
    lockedBy: s.lockedBy || null,
    lockedUntil: s.lockedUntil || null,
  };
}

export function mapBackendShowtime(st: any): Showtime {
  const startStr: string = st.startTime || `${st.date || '2026-10-28'}T${st.time || '14:00'}:00`;
  const datePart = startStr.includes('T') ? startStr.split('T')[0] : st.date || '2026-10-28';
  const timePart = startStr.includes('T')
    ? startStr.split('T')[1].slice(0, 5)
    : st.time || '14:00';
  const roomName = st.roomName || st.auditorium?.split('·')[0]?.trim() || 'Cinema 01';
  const format = (st.format || 'IMAX') as MovieFormat;
  const basePrice = st.basePrice || 90000;

  return {
    id: st.id,
    movieId: st.movieId,
    movieTitle: st.movieTitle,
    roomName,
    auditorium: `${roomName} · ${format}`,
    time: timePart,
    date: datePart,
    startTime: startStr,
    endTime: st.endTime,
    format,
    basePrice,
    seats: Array.isArray(st.seats)
      ? st.seats.map((s: any) => mapBackendSeat(s, basePrice))
      : undefined,
  };
}

export function mapBackendMovie(m: any, showtimes: Showtime[] = []): Movie {
  const durationMinutes = m.durationMinutes || 120;
  const movieShowtimes = showtimes.filter((st) => st.movieId === m.id);
  return {
    id: m.id,
    title: m.title,
    tagline: m.tagline || '',
    synopsis: m.synopsis || '',
    director: m.director || 'Đạo diễn',
    cast: Array.isArray(m.cast) ? m.cast : [],
    rating: m.rating || 9.0,
    votesCount: m.votesCount || '15.2k',
    ageRating: m.ageRating || 'T13',
    status: m.status || 'NOW_SHOWING',
    durationMinutes,
    duration: `${durationMinutes} phút`,
    genres: Array.isArray(m.genres) && m.genres.length > 0 ? m.genres : ['Action', 'Sci-Fi'],
    formats:
      Array.isArray(m.formats) && m.formats.length > 0
        ? (m.formats as MovieFormat[])
        : (['IMAX', 'Dolby Atmos'] as MovieFormat[]),
    themeColor: m.themeColor || '#4F46E5',
    accentColor: m.accentColor || '#818CF8',
    featured: Boolean(m.featured),
    showtimes: movieShowtimes,
    posterUrl: m.posterUrl || undefined,
    backdropUrl: m.backdropUrl || m.posterUrl || undefined,
    trailerVideoUrl: m.trailerVideoUrl || undefined,
  };
}

export const apiClient = {
  // 1. Auth & RBAC
  login: (email: string, password: string) =>
    request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    role?: string;
  }) =>
    request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getUsers: () => request<User[]>('/auth/users'),

  toggleUserStatus: (userId: string, isActive: boolean) =>
    request<User>(`/auth/users/${userId}/status?isActive=${isActive}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // 2. Movies & Showtimes
  getMovies: (status?: string) =>
    request<any[]>(status ? `/movies?status=${encodeURIComponent(status)}` : '/movies'),

  createMovie: (payload: any) =>
    request<any>('/movies', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMovie: (id: string, payload: any) =>
    request<any>(`/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMovie: (id: string) =>
    request<void>(`/movies/${id}`, {
      method: 'DELETE',
    }),

  getShowtimes: (movieId?: string) =>
    request<any[]>(movieId ? `/showtimes?movieId=${encodeURIComponent(movieId)}` : '/showtimes'),

  getShowtimeById: (id: string) => request<any>(`/showtimes/${id}`),

  createShowtime: (payload: {
    movieId: string;
    roomName: string;
    format?: string;
    startTime: string;
    basePrice: number;
  }) =>
    request<any>('/showtimes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteShowtime: (id: string) =>
    request<void>(`/showtimes/${id}`, {
      method: 'DELETE',
    }),

  // 3. Core Booking & Voucher
  holdSeats: (showtimeId: string, seatCodes: string[]) =>
    request<any>('/bookings/hold', {
      method: 'POST',
      body: JSON.stringify({ showtimeId, seatCodes }),
    }),

  applyVoucher: (payload: {
    voucherCode: string;
    bookingId?: string;
    originalAmount?: number;
  }) =>
    request<{
      id?: string;
      bookingId?: string;
      originalAmount: number;
      voucherCode: string;
      discountAmount: number;
      finalAmount: number;
      status: string;
    }>('/bookings/apply-voucher', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cancelBooking: (bookingId: string) =>
    request<any>(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    }),

  getMyBookings: () => request<any[]>('/bookings/my-bookings'),

  getAllBookings: () => request<any[]>('/bookings'),

  // 4. Vouchers
  getVouchers: () => request<Voucher[]>('/vouchers'),

  createVoucher: (payload: any) =>
    request<Voucher>('/vouchers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteVoucher: (id: string) =>
    request<void>(`/vouchers/${id}`, {
      method: 'DELETE',
    }),

  // 5. Payments & QR Check-in
  mockPayment: (payload: {
    bookingId: string;
    paymentStatus: 'SUCCESS' | 'FAILED';
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) =>
    request<any>('/payments/mock', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  checkInQr: (qrCode: string) =>
    request<any>('/payments/check-in', {
      method: 'POST',
      body: JSON.stringify({ qrCode }),
    }),
};

