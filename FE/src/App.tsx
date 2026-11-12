import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HeroBillboard } from './components/HeroBillboard';
import { DateRail } from './components/DateRail';
import { FormatFilters } from './components/FormatFilters';
import { MovieCard } from './components/MovieCard';
import { SeatMap } from './components/SeatMap';
import { ConcessionsSelector } from './components/ConcessionsSelector';
import { BookingSummary } from './components/BookingSummary';
import { CheckoutModal } from './components/CheckoutModal';
import { ConfirmationPass } from './components/ConfirmationPass';
import { TrailerModal } from './components/TrailerModal';
import { MyBookingsView } from './components/MyBookingsView';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import {
  MOVIES,
  DATES,
  generateSeatingLayout,
  CONCESSIONS,
  INITIAL_USERS,
  INITIAL_VOUCHERS,
} from './data/mockData';
import {
  Movie,
  Showtime,
  Seat,
  ConfirmedBooking,
  User,
  Voucher,
  MovieFormat,
  formatVND,
} from './types';
import {
  apiClient,
  ApiError,
  clearAuthSession,
  getStoredUser,
  mapBackendMovie,
  mapBackendSeat,
  mapBackendShowtime,
  saveAuthSession,
} from './services/api-client';
import {
  checkOrphanSeats,
  checkShowtimeOverlap,
  validateAndComputeVoucher,
} from './services/algorithms';
import { ArrowLeft, Popcorn, Film, ChevronRight, Server } from 'lucide-react';

export default function App() {
  // Navigation tab state (also supports direct path routing e.g. /booking.html, /my-tickets.html, /admin-dashboard.html)
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('booking') || p.includes('seat')) return 'seats';
    if (p.includes('ticket') || p.includes('pass')) return 'passes';
    if (p.includes('admin')) return 'admin';
    return 'browse';
  });

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() =>
    window.location.pathname.toLowerCase().includes('login')
  );
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  // Catalog & Admin State
  const [movies, setMovies] = useState<Movie[]>(MOVIES);
  const [allShowtimes, setAllShowtimes] = useState<Showtime[]>(() =>
    MOVIES.flatMap((m) => m.showtimes)
  );
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [vouchers, setVouchers] = useState<Voucher[]>(INITIAL_VOUCHERS);

  // Filter & Search states
  const [selectedDate, setSelectedDate] = useState<string>(DATES[0].id);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Booking target
  const [selectedMovie, setSelectedMovie] = useState<Movie>(MOVIES[0]);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime>(MOVIES[0].showtimes[0]);

  // Seating State
  const [currentSeats, setCurrentSeats] = useState<Seat[]>(
    () => MOVIES[0].showtimes[0].seats || generateSeatingLayout(MOVIES[0].showtimes[0].id, 80000)
  );
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Active Pending Booking (when seats are held for 10 minutes)
  const [activePendingBooking, setActivePendingBooking] = useState<ConfirmedBooking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Concessions State
  const [concessions, setConcessions] = useState<Record<string, number>>({});

  // Promo Code / Voucher State
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Modals & Overlays
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [activePass, setActivePass] = useState<ConfirmedBooking | null>(null);

  // Bookings list
  const [confirmedBookings, setConfirmedBookings] = useState<ConfirmedBooking[]>([]);

  // Map backend Booking to ConfirmedBooking
  const mapBackendBookingToConfirmed = useCallback(
    (b: any, movieList: Movie[], showtimeList: Showtime[]): ConfirmedBooking => {
      const foundMovie =
        movieList.find((m) => m.id === b.movieId || m.title === b.movieTitle) || movieList[0];
      const foundShowtime =
        showtimeList.find((s) => s.id === b.showtimeId) ||
        foundMovie.showtimes[0] || {
          id: b.showtimeId || 'st-1',
          movieId: foundMovie.id,
          roomName: b.roomName || 'Cinema 01',
          auditorium: `${b.roomName || 'Cinema 01'} · ${b.format || 'IMAX'}`,
          time: b.startTime ? b.startTime.slice(11, 16) : '14:00',
          date: b.startTime ? b.startTime.slice(0, 10) : DATES[0].id,
          startTime: b.startTime || '',
          format: (b.format || 'IMAX') as MovieFormat,
          basePrice: 90000,
        };

      const seats: Seat[] = Array.isArray(b.seats)
        ? b.seats.map((s: any) => mapBackendSeat(s, foundShowtime.basePrice))
        : (b.seatCodes || []).map((code: string) =>
          mapBackendSeat({ seatCode: code }, foundShowtime.basePrice)
        );

      return {
        id: b.id,
        bookingId: b.id || b.bookingId,
        movie: foundMovie,
        showtime: foundShowtime,
        seatCodes: b.seatCodes || seats.map((s) => s.seatCode),
        seats,
        concessions: [],
        customer: {
          fullName: b.customerName || currentUser?.fullName || 'Khách hàng',
          email: b.userEmail || currentUser?.email || 'customer@cinema.com',
          phone: b.customerPhone || currentUser?.phone || '0901234567',
        },
        pricing: {
          seatsSubtotal: b.originalAmount || 0,
          concessionsSubtotal: 0,
          bookingFee: 0,
          tax: 0,
          discount: b.discountAmount || 0,
          total: b.finalAmount ?? b.originalAmount ?? 0,
        },
        voucherCode: b.voucherCode || null,
        status: b.status || 'PENDING',
        qrCode: b.qrCode || null,
        confirmedAt: b.createdAt || new Date().toISOString(),
        expiresAt: b.expiresAt || null,
        paidAt: b.paidAt || null,
        checkedInAt: b.checkedInAt || null,
      };
    },
    [currentUser]
  );

  // Sync Data from Backend
  const fetchBackendData = useCallback(async () => {
    try {
      const [rawMovies, rawShowtimes, rawVouchers] = await Promise.all([
        apiClient.getMovies(),
        apiClient.getShowtimes(),
        apiClient.getVouchers(),
      ]);

      setIsBackendOnline(true);
      const mappedShowtimes = rawShowtimes.map(mapBackendShowtime);
      const mappedMovies = rawMovies.map((m) => mapBackendMovie(m, mappedShowtimes));

      if (mappedMovies.length > 0) {
        setMovies(mappedMovies);
        setAllShowtimes(mappedShowtimes);

        setSelectedMovie((prev) => mappedMovies.find((m) => m.id === prev.id) || mappedMovies[0]);
        setSelectedShowtime((prev) => {
          const match = mappedShowtimes.find((s) => s.id === prev.id) || mappedShowtimes[0];
          if (match && match.seats) {
            setCurrentSeats(match.seats);
          }
          return match || prev;
        });
      }

      if (Array.isArray(rawVouchers) && rawVouchers.length > 0) {
        setVouchers(rawVouchers);
      }

      if (getStoredUser()) {
        try {
          const myBks = await apiClient.getAllBookings();
          setConfirmedBookings(
            myBks.map((b) => mapBackendBookingToConfirmed(b, mappedMovies, mappedShowtimes))
          );
        } catch {
          // ignore if not authorized
        }
        try {
          const allUsrs = await apiClient.getUsers();
          if (Array.isArray(allUsrs) && allUsrs.length > 0) {
            setUsers(allUsrs);
          }
        } catch {
          // ignore if not ADMIN
        }
      }
    } catch {
      setIsBackendOnline(false);
    }
  }, [mapBackendBookingToConfirmed]);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Refresh current showtime seats from server (triggers Lazy Check on Backend)
  const refreshCurrentShowtimeSeats = async (showtimeId?: string) => {
    const targetId = showtimeId || selectedShowtime?.id;
    if (!targetId) return;
    try {
      const rawSt = await apiClient.getShowtimeById(targetId);
      const mappedSt = mapBackendShowtime(rawSt);
      setSelectedShowtime(mappedSt);
      if (mappedSt.seats) {
        setCurrentSeats(mappedSt.seats);
      }
      setIsBackendOnline(true);
    } catch {
      // Fallback local
    }
  };

  // Auth Handlers
  const switchToAdminPortal = useCallback(() => {
    setActivePass(null);
    setActiveTab('admin');
    try {
      window.history.pushState({}, '', '/admin');
    } catch {
      // ignore
    }
  }, []);

  const switchToCustomerSite = useCallback((targetTab: NavTab = 'browse') => {
    setActivePass(null);
    setActiveTab(targetTab);
    try {
      window.history.pushState({}, '', targetTab === 'browse' ? '/' : `/${targetTab}`);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('admin')) {
        setActiveTab('admin');
      } else if (p.includes('booking') || p.includes('seat')) {
        setActiveTab('seats');
      } else if (p.includes('ticket') || p.includes('pass')) {
        setActiveTab('passes');
      } else {
        setActiveTab('browse');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const session = await apiClient.login(email, password);
      saveAuthSession(session);
      setCurrentUser(session.user);
      setIsBackendOnline(true);
      await fetchBackendData();
      if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
        switchToAdminPortal();
      } else if (activeTab === 'admin') {
        switchToCustomerSite('browse');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      // Fallback local when backend is offline
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }
      if (!found.isActive) {
        throw new Error('Tài khoản của bạn đã bị khóa (isActive = false)');
      }
      const mockSession = {
        accessToken: `mock-jwt-token-${found.id}`,
        userId: found.id,
        role: found.role,
        exp: Math.floor(Date.now() / 1000) + 86400,
        user: found,
      };
      saveAuthSession(mockSession);
      setCurrentUser(found);
      if (found.role === 'ADMIN' || found.role === 'STAFF') {
        switchToAdminPortal();
      } else if (activeTab === 'admin') {
        switchToCustomerSite('browse');
      }
    }
  };

  const handleRegister = async (payload: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => {
    try {
      const session = await apiClient.register(payload);
      saveAuthSession(session);
      setCurrentUser(session.user);
      setIsBackendOnline(true);
      await fetchBackendData();
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
        throw new Error('Email đã tồn tại trong hệ thống');
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: payload.email.toLowerCase(),
        fullName: payload.fullName,
        phone: payload.phone,
        role: 'CUSTOMER',
        isActive: true,
      };
      setUsers((prev) => [...prev, newUser]);
      const mockSession = {
        accessToken: `mock-jwt-token-${newUser.id}`,
        userId: newUser.id,
        role: newUser.role,
        exp: Math.floor(Date.now() / 1000) + 86400,
        user: newUser,
      };
      saveAuthSession(mockSession);
      setCurrentUser(newUser);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setActivePendingBooking(null);
  };

  // Handle movie/showtime selection
  const handleSelectShowtime = async (movie: Movie, showtime: Showtime) => {
    setSelectedMovie(movie);
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setActivePendingBooking(null);
    setBookingError(null);
    setPromoError(null);
    setAppliedPromo(null);
    setDiscountAmount(0);

    if (showtime.seats && showtime.seats.length > 0) {
      setCurrentSeats(showtime.seats);
    } else {
      setCurrentSeats(generateSeatingLayout(showtime.id, showtime.basePrice));
    }

    setActiveTab('seats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await refreshCurrentShowtimeSeats(showtime.id);
  };

  // Toggle seat selection (tối đa 8 ghế trong 1 lần giao dịch)
  const handleToggleSeat = (seat: Seat) => {
    setBookingError(null);
    setPromoError(null);

    if (activePendingBooking) {
      setBookingError(
        'Bạn đang có đơn giữ ghế PENDING. Vui lòng hoàn tất thanh toán hoặc bấm Thanh toán FAILED để hủy trước khi chọn lại ghế.'
      );
      return;
    }

    if (seat.status === 'BOOKED' || seat.status === 'LOCKED') {
      return;
    }

    const exists = selectedSeats.some((s) => s.seatCode === seat.seatCode);
    if (exists) {
      const updated = selectedSeats.filter((s) => s.seatCode !== seat.seatCode);
      setSelectedSeats(updated);
      if (appliedPromo) {
        const v = vouchers.find((x) => x.code.toUpperCase() === appliedPromo.toUpperCase());
        const newOrig = updated.reduce((acc, s) => acc + s.price, 0);
        const calc = validateAndComputeVoucher(v, newOrig);
        setDiscountAmount(calc.error ? 0 : calc.discountAmount);
        if (calc.error) setAppliedPromo(null);
      }
    } else {
      if (selectedSeats.length >= 8) {
        setBookingError('Chỉ được chọn từ 1 đến tối đa 8 ghế trong 1 lần giao dịch!');
        return;
      }
      const updated = [...selectedSeats, seat];
      setSelectedSeats(updated);
      if (appliedPromo) {
        const v = vouchers.find((x) => x.code.toUpperCase() === appliedPromo.toUpperCase());
        const newOrig = updated.reduce((acc, s) => acc + s.price, 0);
        const calc = validateAndComputeVoucher(v, newOrig);
        setDiscountAmount(calc.error ? 0 : calc.discountAmount);
      }
    }
  };

  const handleRemoveSeat = (seatCode: string) => {
    if (activePendingBooking) return;
    setBookingError(null);
    setSelectedSeats((prev) => prev.filter((s) => s.seatCode !== seatCode && s.id !== seatCode));
  };

  const handleUpdateConcession = (itemId: string, delta: number) => {
    setConcessions((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: updated };
    });
  };

  // Giữ ghế tạm thời 10 phút (Thuật toán 2: Orphan Seat + Thuật toán 3: Atomic Lock)
  const executeHoldSeats = async (): Promise<ConfirmedBooking | null> => {
    setBookingError(null);
    setPromoError(null);

    if (selectedSeats.length < 1 || selectedSeats.length > 8) {
      setBookingError('Chỉ được chọn từ 1 đến tối đa 8 ghế trong 1 lần giao dịch');
      return null;
    }

    const seatCodes = selectedSeats.map((s) => s.seatCode);

    // Kiểm tra tài khoản bị khóa ở local nếu có
    if (currentUser) {
      const latestUserRecord = users.find((u) => u.id === currentUser.id || u.email === currentUser.email);
      if (latestUserRecord && !latestUserRecord.isActive) {
        setBookingError(
          '403 Forbidden: Tài khoản của bạn đã bị Quản trị viên khóa (isActive = false). Không thể đặt vé!'
        );
        return null;
      }
    }

    setIsProcessingAction(true);
    try {
      if (isBackendOnline) {
        // Nếu chưa đăng nhập trên BE, tự động đăng nhập tài khoản customer mẫu để có JWT hợp lệ
        if (!localStorage.getItem('accessToken')) {
          const session = await apiClient.login('customer@cinema.com', 'Customer@123');
          saveAuthSession(session);
          setCurrentUser(session.user);
        }

        const rawBooking = await apiClient.holdSeats(selectedShowtime.id, seatCodes);
        let mappedBooking = mapBackendBookingToConfirmed(rawBooking, movies, allShowtimes);

        // Nếu khách đã nhập mã giảm giá trước khi bấm Giữ ghế -> áp dụng luôn vào đơn PENDING
        if (appliedPromo) {
          try {
            const voucherRes = await apiClient.applyVoucher({
              bookingId: mappedBooking.bookingId,
              voucherCode: appliedPromo,
            });
            mappedBooking = {
              ...mappedBooking,
              voucherCode: voucherRes.voucherCode,
              pricing: {
                ...mappedBooking.pricing,
                discount: voucherRes.discountAmount,
                total: voucherRes.finalAmount,
              },
            };
            setDiscountAmount(voucherRes.discountAmount);
          } catch (vErr: any) {
            setPromoError(vErr?.message || 'Lỗi áp dụng Voucher');
          }
        }

        setActivePendingBooking(mappedBooking);
        setConfirmedBookings((prev) => [
          mappedBooking,
          ...prev.filter((b) => b.bookingId !== mappedBooking.bookingId),
        ]);
        await refreshCurrentShowtimeSeats(selectedShowtime.id);
        return mappedBooking;
      }

      // Fallback Local khi không bật Backend: Kiểm tra Thuật toán 2 (Orphan Seat) & Thuật toán 3 (Atomic Lock)
      const orphanErr = checkOrphanSeats(currentSeats, seatCodes);
      if (orphanErr) {
        setBookingError(orphanErr);
        return null;
      }

      const conflictSeat = currentSeats.find(
        (s) => seatCodes.includes(s.seatCode) && s.status !== 'AVAILABLE'
      );
      if (conflictSeat) {
        setBookingError(
          `409 Conflict: Ghế ${conflictSeat.seatCode} đã có người đặt hoặc đang được giữ!`
        );
        return null;
      }

      const lockedUntil = new Date(Date.now() + 600 * 1000).toISOString();
      const updatedSeats = currentSeats.map((s) =>
        seatCodes.includes(s.seatCode)
          ? { ...s, status: 'LOCKED' as const, state: 'reserved' as const, lockedUntil }
          : s
      );
      setCurrentSeats(updatedSeats);

      const originalAmount = selectedSeats.reduce((acc, s) => acc + s.price, 0);
      const finalAmount = Math.max(0, originalAmount - discountAmount);

      const pendingBooking: ConfirmedBooking = {
        bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
        movie: selectedMovie,
        showtime: selectedShowtime,
        seatCodes,
        seats: [...selectedSeats],
        concessions: [],
        customer: {
          fullName: currentUser?.fullName || 'Nguyễn Văn Khách',
          email: currentUser?.email || 'customer@cinema.com',
          phone: currentUser?.phone || '0901000003',
        },
        pricing: {
          seatsSubtotal: originalAmount,
          concessionsSubtotal: 0,
          bookingFee: 0,
          tax: 0,
          discount: discountAmount,
          total: finalAmount,
        },
        voucherCode: appliedPromo,
        status: 'PENDING',
        qrCode: null,
        confirmedAt: new Date().toISOString(),
        expiresAt: lockedUntil,
      };

      setActivePendingBooking(pendingBooking);
      setConfirmedBookings((prev) => [pendingBooking, ...prev]);
      return pendingBooking;
    } catch (err: any) {
      setBookingError(err?.message || 'Không thể giữ ghế (Lỗi 400 / 403 / 409)');
      return null;
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Áp dụng Mã giảm giá (Thuật toán 4: Dynamic Pricing & Capped Discount)
  const handleApplyPromo = async (code: string) => {
    setPromoError(null);
    setBookingError(null);
    const trimmed = code.trim().toUpperCase();
    setPromoCode(trimmed);

    if (!trimmed) {
      setPromoError('Vui lòng nhập mã giảm giá');
      return;
    }

    const originalAmount = activePendingBooking
      ? activePendingBooking.pricing.seatsSubtotal
      : selectedSeats.reduce((acc, s) => acc + s.price, 0);

    if (originalAmount <= 0) {
      setPromoError('Vui lòng chọn ít nhất 1 ghế trước khi áp dụng mã giảm giá');
      return;
    }

    try {
      if (isBackendOnline) {
        if (!localStorage.getItem('accessToken')) {
          const session = await apiClient.login('customer@cinema.com', 'Customer@123');
          saveAuthSession(session);
          setCurrentUser(session.user);
        }

        const res = await apiClient.applyVoucher({
          voucherCode: trimmed,
          bookingId: activePendingBooking?.bookingId,
          originalAmount,
        });

        setDiscountAmount(res.discountAmount);
        setAppliedPromo(res.voucherCode);
        setPromoError(null);

        if (activePendingBooking) {
          setActivePendingBooking({
            ...activePendingBooking,
            voucherCode: res.voucherCode,
            pricing: {
              ...activePendingBooking.pricing,
              discount: res.discountAmount,
              total: res.finalAmount,
            },
          });
        }
        return;
      }

      // Fallback Local
      const targetVoucher = vouchers.find((v) => v.code.toUpperCase() === trimmed);
      const calc = validateAndComputeVoucher(targetVoucher, originalAmount);
      if (calc.error) {
        setDiscountAmount(0);
        setAppliedPromo(null);
        setPromoError(calc.error);
      } else {
        setDiscountAmount(calc.discountAmount);
        setAppliedPromo(trimmed);
        setPromoError(null);
        if (activePendingBooking) {
          setActivePendingBooking({
            ...activePendingBooking,
            voucherCode: trimmed,
            pricing: {
              ...activePendingBooking.pricing,
              discount: calc.discountAmount,
              total: calc.finalAmount,
            },
          });
        }
      }
    } catch (err: any) {
      setDiscountAmount(0);
      setAppliedPromo(null);
      setPromoError(err?.message || 'Mã giảm giá không hợp lệ');
    }
  };

  // Giả lập Thanh toán (Mock Payment Gateway: SUCCESS / FAILED)
  const handleMockPayment = async (
    paymentStatus: 'SUCCESS' | 'FAILED',
    explicitBookingId?: string
  ) => {
    setBookingError(null);
    setPromoError(null);

    let targetBooking = activePendingBooking;
    if (explicitBookingId) {
      targetBooking =
        confirmedBookings.find((b) => b.bookingId === explicitBookingId) || activePendingBooking;
    }

    // Nếu khách bấm Thanh toán ngay khi vừa chọn ghế (chưa bấm Giữ ghế trước đó) -> Tự động giữ ghế trước!
    if (!targetBooking) {
      if (selectedSeats.length === 0) {
        setBookingError('Vui lòng chọn ghế trước khi thanh toán');
        return;
      }
      targetBooking = await executeHoldSeats();
      if (!targetBooking) return;
    }

    setIsProcessingAction(true);
    try {
      if (isBackendOnline) {
        const rawUpdated = await apiClient.mockPayment({
          bookingId: targetBooking.bookingId,
          paymentStatus,
          customerName: currentUser?.fullName || 'Nguyễn Văn Khách',
          customerEmail: currentUser?.email || 'customer@cinema.com',
          customerPhone: currentUser?.phone || '0901000003',
        });

        const updatedBooking = mapBackendBookingToConfirmed(rawUpdated, movies, allShowtimes);
        setConfirmedBookings((prev) => [
          updatedBooking,
          ...prev.filter((b) => b.bookingId !== updatedBooking.bookingId),
        ]);
        await fetchBackendData();
        await refreshCurrentShowtimeSeats(selectedShowtime.id);

        setSelectedSeats([]);
        setActivePendingBooking(null);
        setAppliedPromo(null);
        setDiscountAmount(0);
        setPromoCode('');

        if (paymentStatus === 'SUCCESS') {
          setActivePass(updatedBooking);
        }
        return;
      }

      // Fallback Local
      if (paymentStatus === 'FAILED') {
        const releasedSeats = currentSeats.map((s) =>
          targetBooking!.seatCodes.includes(s.seatCode)
            ? { ...s, status: 'AVAILABLE' as const, state: 'available' as const, lockedUntil: null }
            : s
        );
        setCurrentSeats(releasedSeats);

        const cancelledBooking: ConfirmedBooking = {
          ...targetBooking,
          status: 'CANCELLED',
        };
        setConfirmedBookings((prev) => [
          cancelledBooking,
          ...prev.filter((b) => b.bookingId !== cancelledBooking.bookingId),
        ]);
        setSelectedSeats([]);
        setActivePendingBooking(null);
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      // SUCCESS local
      const bookedSeats = currentSeats.map((s) =>
        targetBooking!.seatCodes.includes(s.seatCode)
          ? { ...s, status: 'BOOKED' as const, state: 'occupied' as const, lockedUntil: null }
          : s
      );
      setCurrentSeats(bookedSeats);

      if (targetBooking.voucherCode) {
        setVouchers((prev) =>
          prev.map((v) =>
            v.code.toUpperCase() === targetBooking!.voucherCode!.toUpperCase()
              ? { ...v, usedCount: v.usedCount + 1 }
              : v
          )
        );
      }

      const generatedQr = `CW-QR-${targetBooking.bookingId.slice(-6).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      const paidBooking: ConfirmedBooking = {
        ...targetBooking,
        status: 'PAID',
        qrCode: generatedQr,
        paidAt: new Date().toISOString(),
      };

      setConfirmedBookings((prev) => [
        paidBooking,
        ...prev.filter((b) => b.bookingId !== paidBooking.bookingId),
      ]);
      setActivePass(paidBooking);
      setSelectedSeats([]);
      setActivePendingBooking(null);
      setAppliedPromo(null);
      setDiscountAmount(0);
    } catch (err: any) {
      setBookingError(err?.message || 'Lỗi xử lý thanh toán');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Admin & Staff Handlers
  const ensureAdminTokenIfOnline = async () => {
    if (!isBackendOnline) return;
    if (!currentUser || currentUser.role !== 'ADMIN') {
      const session = await apiClient.login('admin@cinema.com', 'Admin@123');
      saveAuthSession(session);
      setCurrentUser(session.user);
    }
  };

  const handleAdminCreateShowtime = async (payload: {
    movieId: string;
    roomName: string;
    format: MovieFormat;
    startTime: string;
    basePrice: number;
  }) => {
    if (isBackendOnline) {
      await ensureAdminTokenIfOnline();
      await apiClient.createShowtime(payload);
      await fetchBackendData();
      return;
    }

    const movie = movies.find((m) => m.id === payload.movieId) || movies[0];
    const startMs = new Date(payload.startTime).getTime();
    const endIso = new Date(startMs + (movie.durationMinutes + 15) * 60000).toISOString();

    if (checkShowtimeOverlap(payload.roomName, payload.startTime, endIso, allShowtimes)) {
      throw new Error('409 Conflict: Phòng chiếu đã có lịch trong khung giờ này');
    }

    const newSt: Showtime = {
      id: `st-${Date.now()}`,
      movieId: movie.id,
      movieTitle: movie.title,
      roomName: payload.roomName,
      auditorium: `${payload.roomName} · ${payload.format}`,
      time: payload.startTime.slice(11, 16),
      date: payload.startTime.slice(0, 10),
      startTime: payload.startTime,
      endTime: endIso,
      format: payload.format,
      basePrice: payload.basePrice,
      seats: generateSeatingLayout(`st-${Date.now()}`, payload.basePrice),
    };

    setAllShowtimes((prev) => [...prev, newSt]);
    setMovies((prev) =>
      prev.map((m) => (m.id === movie.id ? { ...m, showtimes: [...m.showtimes, newSt] } : m))
    );
  };

  const handleAdminDeleteShowtime = async (showtimeId: string) => {
    if (isBackendOnline) {
      await ensureAdminTokenIfOnline();
      await apiClient.deleteShowtime(showtimeId);
      await fetchBackendData();
      return;
    }
    setAllShowtimes((prev) => prev.filter((s) => s.id !== showtimeId));
    setMovies((prev) =>
      prev.map((m) => ({
        ...m,
        showtimes: m.showtimes.filter((s) => s.id !== showtimeId),
      }))
    );
  };

  const handleAdminCreateMovie = async (payload: {
    title: string;
    synopsis: string;
    director: string;
    durationMinutes: number;
    ageRating: string;
    status: 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';
    genres: string[];
    formats: MovieFormat[];
    posterUrl?: string;
    trailerVideoUrl?: string;
  }) => {
    if (isBackendOnline) {
      await ensureAdminTokenIfOnline();
      await apiClient.createMovie(payload);
      await fetchBackendData();
      return;
    }
    const newMovie: Movie = {
      id: `mv-${Date.now()}`,
      title: payload.title,
      tagline: '',
      synopsis: payload.synopsis,
      director: payload.director,
      cast: ['Diễn viên chính'],
      rating: 9.0,
      votesCount: '10k',
      ageRating: payload.ageRating,
      status: payload.status,
      durationMinutes: payload.durationMinutes,
      duration: `${payload.durationMinutes} phút`,
      genres: payload.genres,
      formats: payload.formats,
      themeColor: '#4F46E5',
      accentColor: '#818CF8',
      posterUrl: payload.posterUrl,
      backdropUrl: payload.posterUrl,
      trailerVideoUrl: payload.trailerVideoUrl,
      showtimes: [],
    };
    setMovies((prev) => [newMovie, ...prev]);
  };

  const handleAdminUpdateMovieStatus = async (
    movie: Movie,
    status: 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED',
    ageRating: string
  ) => {
    if (isBackendOnline) {
      await ensureAdminTokenIfOnline();
      await apiClient.updateMovie(movie.id, {
        title: movie.title,
        synopsis: movie.synopsis,
        director: movie.director,
        durationMinutes: movie.durationMinutes,
        ageRating,
        status,
        genres: movie.genres,
        formats: movie.formats,
      });
      await fetchBackendData();
      return;
    }
    setMovies((prev) =>
      prev.map((m) => (m.id === movie.id ? { ...m, status, ageRating } : m))
    );
  };

  const handleAdminDeleteMovie = async (movieId: string) => {
    if (isBackendOnline) {
      await ensureAdminTokenIfOnline();
      await apiClient.deleteMovie(movieId);
      await fetchBackendData();
      return;
    }
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
  };

  const handleAdminToggleUserLock = async (userId: string, nextActive: boolean) => {
    if (isBackendOnline) {
      // Thực hiện bằng quyền Admin nhưng không làm mất token hiện tại của user đang đăng nhập nếu đang test kịch bản 403
      const savedToken = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('currentUser');
      const adminSession = await apiClient.login('admin@cinema.com', 'Admin@123');
      localStorage.setItem('accessToken', adminSession.accessToken);
      const updatedUser = await apiClient.toggleUserStatus(userId, nextActive);
      const allUsrs = await apiClient.getUsers();
      setUsers(allUsrs);
      if (savedToken && savedUser) {
        localStorage.setItem('accessToken', savedToken);
        localStorage.setItem('currentUser', savedUser);
      }
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: nextActive } : u))
    );
  };

  const handleAdminCreateVoucher = async (payload: any) => {
    if (isBackendOnline) {
      await ensureAdminTokenIfOnline();
      await apiClient.createVoucher(payload);
      await fetchBackendData();
      return;
    }
    setVouchers((prev) => [
      {
        id: `v-${Date.now()}`,
        ...payload,
        usedCount: 0,
        isActive: true,
      },
      ...prev,
    ]);
  };

  const handleAdminDeleteVoucher = async (voucherId: string) => {
    if (isBackendOnline) {
      await ensureAdminTokenIfOnline();
      await apiClient.deleteVoucher(voucherId);
      await fetchBackendData();
      return;
    }
    setVouchers((prev) => prev.filter((v) => v.id !== voucherId));
  };

  const handleStaffCheckInQr = async (qrCode: string) => {
    if (isBackendOnline) {
      if (!currentUser || (currentUser.role !== 'STAFF' && currentUser.role !== 'ADMIN')) {
        const staffSession = await apiClient.login('staff@cinema.com', 'Staff@123');
        saveAuthSession(staffSession);
        setCurrentUser(staffSession.user);
      }
      const res = await apiClient.checkInQr(qrCode);
      await fetchBackendData();
      return res;
    }

    const found = confirmedBookings.find(
      (b) => b.qrCode && b.qrCode.toUpperCase() === qrCode.toUpperCase()
    );
    if (!found) {
      throw new Error('404 Not Found: Không tìm thấy vé với mã QR này');
    }
    if (found.status === 'CHECKED_IN') {
      throw new Error(
        '409 Conflict: Vé này đã được soát (CHECKED_IN) trước đó! Chỉ cho phép quét 1 lần duy nhất.'
      );
    }
    if (found.status !== 'PAID') {
      throw new Error(`400 Bad Request: Vé chưa thanh toán (Trạng thái: ${found.status})`);
    }

    const updated: ConfirmedBooking = {
      ...found,
      status: 'CHECKED_IN',
      checkedInAt: new Date().toISOString(),
    };
    setConfirmedBookings((prev) =>
      prev.map((b) => (b.bookingId === found.bookingId ? updated : b))
    );
    return updated;
  };

  // Filtered movie catalog
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      if (selectedFormat !== 'all' && !movie.formats.includes(selectedFormat as any)) {
        return false;
      }
      if (selectedGenre !== 'All Genres' && !movie.genres.includes(selectedGenre)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(q);
        const matchesCast = movie.cast.some((c) => c.toLowerCase().includes(q));
        const matchesDirector = movie.director.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCast && !matchesDirector) return false;
      }
      return true;
    });
  }, [movies, selectedFormat, selectedGenre, searchQuery]);

  const grandTotal = useMemo(() => {
    const seatsSub = activePendingBooking
      ? activePendingBooking.pricing.seatsSubtotal
      : selectedSeats.reduce((acc, s) => acc + s.price, 0);
    return Math.max(0, seatsSub - discountAmount);
  }, [selectedSeats, activePendingBooking, discountAmount]);

  // GIAO DIỆN 2: CỔNG QUẢN TRỊ ADMIN & STAFF RIÊNG BIỆT (/admin)
  if (activeTab === 'admin') {
    return (
      <>
        <AdminDashboard
          currentUser={currentUser}
          isBackendOnline={isBackendOnline}
          movies={movies}
          showtimes={allShowtimes}
          users={users}
          vouchers={vouchers}
          bookings={confirmedBookings}
          onBackToCustomerSite={() => switchToCustomerSite('browse')}
          onQuickLoginRole={handleLogin}
          onLogout={() => {
            handleLogout();
            switchToCustomerSite('browse');
          }}
          onCreateMovie={handleAdminCreateMovie}
          onUpdateMovieStatus={handleAdminUpdateMovieStatus}
          onDeleteMovie={handleAdminDeleteMovie}
          onCreateShowtime={handleAdminCreateShowtime}
          onDeleteShowtime={handleAdminDeleteShowtime}
          onToggleUserLock={handleAdminToggleUserLock}
          onCreateVoucher={handleAdminCreateVoucher}
          onDeleteVoucher={handleAdminDeleteVoucher}
          onCheckInQr={handleStaffCheckInQr}
        />

        {isAuthModalOpen && (
          <AuthModal
            onClose={() => setIsAuthModalOpen(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </>
    );
  }

  // GIAO DIỆN 1: WEBSITE ĐẶT VÉ KHÁCH HÀNG (/)
  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#0F172A] flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Navigation (Customer Only) */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'admin') {
            switchToAdminPortal();
          } else {
            switchToCustomerSite(tab);
          }
        }}
        onSwitchToAdminPortal={switchToAdminPortal}
        selectedSeatsCount={selectedSeats.length}
        confirmedBookingsCount={confirmedBookings.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport Container */}
      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {activePass ? (
          <ConfirmationPass
            booking={activePass}
            onDone={() => {
              setActivePass(null);
              setActiveTab('passes');
            }}
          />
        ) : activeTab === 'browse' ? (
          <div>
            {movies[0] && (
              <HeroBillboard
                movie={movies[0]}
                movies={movies}
                onSelectShowtime={handleSelectShowtime}
                onWatchTrailer={(movie) => setActiveTrailerMovie(movie)}
              />
            )}

            <div className="mb-6">
              <DateRail
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(d)}
              />
            </div>

            <FormatFilters
              selectedFormat={selectedFormat}
              onSelectFormat={(f) => setSelectedFormat(f)}
              selectedGenre={selectedGenre}
              onSelectGenre={(g) => setSelectedGenre(g)}
              searchQuery={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
            />

            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-[#0F172A]">
                    Danh Sách Phim & Lịch Chiếu Rạp
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chọn suất chiếu để mở sơ đồ ghế thời gian thực (AVAILABLE, LOCKED, BOOKED).
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isBackendOnline
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>
                      {isBackendOnline
                        ? 'Đã kết nối Backend (localhost:8080)'
                        : 'Chế độ giả lập Local'}
                    </span>
                  </span>
                </div>
              </div>

              {filteredMovies.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Film className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-base text-slate-800">
                    Không tìm thấy phim phù hợp
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedFormat('all');
                      setSelectedGenre('All Genres');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      selectedDate={selectedDate}
                      onSelectShowtime={handleSelectShowtime}
                      onWatchTrailer={(m) => setActiveTrailerMovie(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'seats' ? (
          <div>
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
              <button
                onClick={() => setActiveTab('browse')}
                className="hover:text-[#4F46E5] flex items-center gap-1 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại Danh sách Phim</span>
              </button>
              <span>/</span>
              <span className="font-semibold text-slate-800">{selectedMovie.title}</span>
              <span>/</span>
              <span className="text-[#4F46E5] font-semibold">
                {selectedShowtime.roomName} ({selectedShowtime.time})
              </span>
            </div>

            {/* Seating Layout + Sticky Summary Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <SeatMap
                  movie={selectedMovie}
                  showtime={selectedShowtime}
                  seats={currentSeats}
                  selectedSeats={selectedSeats}
                  activePendingSeatCodes={activePendingBooking?.seatCodes || []}
                  onToggleSeat={handleToggleSeat}
                  onRefreshSeats={() => refreshCurrentShowtimeSeats(selectedShowtime.id)}
                />
              </div>

              <div className="lg:col-span-4">
                <BookingSummary
                  movie={selectedMovie}
                  showtime={selectedShowtime}
                  selectedSeats={selectedSeats}
                  concessions={concessions}
                  promoCode={promoCode}
                  appliedPromo={appliedPromo}
                  discountAmount={discountAmount}
                  promoError={promoError}
                  bookingError={bookingError}
                  activePendingBooking={activePendingBooking}
                  isProcessingAction={isProcessingAction}
                  onRemoveSeat={handleRemoveSeat}
                  onApplyPromo={handleApplyPromo}
                  onHoldSeats={executeHoldSeats}
                  onMockPayment={(status) => handleMockPayment(status)}
                  onProceedToCheckout={() => setIsCheckoutOpen(true)}
                  onOpenConcessions={() => setActiveTab('concessions')}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'concessions' ? (
          <div>
            <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
              <button
                onClick={() => setActiveTab('seats')}
                className="hover:text-[#4F46E5] flex items-center gap-1 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại Sơ đồ Ghế</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                <ConcessionsSelector
                  concessions={concessions}
                  onUpdateQuantity={handleUpdateConcession}
                />
              </div>

              <div className="lg:col-span-4">
                <BookingSummary
                  movie={selectedMovie}
                  showtime={selectedShowtime}
                  selectedSeats={selectedSeats}
                  concessions={concessions}
                  promoCode={promoCode}
                  appliedPromo={appliedPromo}
                  discountAmount={discountAmount}
                  promoError={promoError}
                  bookingError={bookingError}
                  activePendingBooking={activePendingBooking}
                  isProcessingAction={isProcessingAction}
                  onRemoveSeat={handleRemoveSeat}
                  onApplyPromo={handleApplyPromo}
                  onHoldSeats={executeHoldSeats}
                  onMockPayment={(status) => handleMockPayment(status)}
                  onProceedToCheckout={() => setIsCheckoutOpen(true)}
                  onOpenConcessions={() => setActiveTab('concessions')}
                />
              </div>
            </div>
          </div>
        ) : (
          <MyBookingsView
            bookings={confirmedBookings}
            onSelectBooking={(b) => setActivePass(b)}
            onBrowseMovies={() => setActiveTab('browse')}
            onPayPendingBooking={(bookingId, status) => handleMockPayment(status, bookingId)}
          />
        )}
      </main>

      {/* Auth Login / Register Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          movie={selectedMovie}
          showtime={selectedShowtime}
          selectedSeats={selectedSeats}
          concessions={concessions}
          totalAmount={grandTotal}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirmOrder={() => {
            setIsCheckoutOpen(false);
            handleMockPayment('SUCCESS');
          }}
        />
      )}

      {/* Trailer Modal */}
      {activeTrailerMovie && (
        <TrailerModal
          movie={activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
          onSelectShowtime={handleSelectShowtime}
          onBookNow={(movie) => {
            if (movie.showtimes[0]) {
              handleSelectShowtime(movie, movie.showtimes[0]);
            }
          }}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-900">CineWave</span>
            <span>·</span>
            <span>Hệ thống Đặt Vé Rạp Phim & Kiểm Thử Tự Động</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('browse')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Lịch chiếu
            </button>
            <button
              onClick={() => setActiveTab('passes')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Vé của tôi
            </button>
            <button
              onClick={switchToAdminPortal}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cổng Quản trị (Admin CMS)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
