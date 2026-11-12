import React, { useState } from 'react';
import {
  Film,
  CalendarPlus,
  QrCode,
  Users,
  Tag,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutDashboard,
  ArrowLeft,
  Shield,
  LogOut,
  TrendingUp,
  Ticket,
  Server,
  KeyRound,
} from 'lucide-react';
import {
  ConfirmedBooking,
  Movie,
  MovieFormat,
  Showtime,
  User,
  Voucher,
  formatVND,
} from '../types';

interface AdminDashboardProps {
  currentUser: User | null;
  isBackendOnline?: boolean;
  movies: Movie[];
  showtimes: Showtime[];
  users: User[];
  vouchers: Voucher[];
  bookings: ConfirmedBooking[];
  onBackToCustomerSite?: () => void;
  onQuickLoginRole?: (email: string, pass: string) => Promise<void>;
  onLogout?: () => void;
  onCreateMovie: (payload: {
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
  }) => Promise<void>;
  onUpdateMovieStatus: (
    movie: Movie,
    status: 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED',
    ageRating: string
  ) => Promise<void>;
  onDeleteMovie: (movieId: string) => Promise<void>;
  onCreateShowtime: (payload: {
    movieId: string;
    roomName: string;
    format: MovieFormat;
    startTime: string;
    basePrice: number;
  }) => Promise<void>;
  onDeleteShowtime: (showtimeId: string) => Promise<void>;
  onToggleUserLock: (userId: string, nextActive: boolean) => Promise<void>;
  onCreateVoucher: (payload: {
    code: string;
    description: string;
    discountType: 'FIXED' | 'PERCENT';
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderValue: number;
    usageLimit: number;
    startDate: string;
    expiryDate: string;
  }) => Promise<void>;
  onDeleteVoucher: (voucherId: string) => Promise<void>;
  onCheckInQr: (qrCode: string) => Promise<any>;
}

type AdminSubTab = 'overview' | 'showtimes' | 'checkin' | 'movies' | 'users' | 'vouchers';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  isBackendOnline = true,
  movies,
  showtimes,
  users,
  vouchers,
  bookings,
  onBackToCustomerSite,
  onQuickLoginRole,
  onLogout,
  onCreateMovie,
  onUpdateMovieStatus,
  onDeleteMovie,
  onCreateShowtime,
  onDeleteShowtime,
  onToggleUserLock,
  onCreateVoucher,
  onDeleteVoucher,
  onCheckInQr,
}) => {
  const [subTab, setSubTab] = useState<AdminSubTab>('overview');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Tạo Suất chiếu
  const [stMovieId, setStMovieId] = useState<string>(movies[0]?.id || '');
  const [stRoom, setStRoom] = useState<string>('Cinema 01');
  const [stFormat, setStFormat] = useState<MovieFormat>('IMAX');
  const [stStartTime, setStStartTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [stBasePrice, setStBasePrice] = useState<number>(90000);

  // Form Soát vé QR
  const [qrInput, setQrInput] = useState<string>('');
  const [checkedInTicketInfo, setCheckedInTicketInfo] = useState<any | null>(null);

  // Form Thêm Phim
  const [mvTitle, setMvTitle] = useState('');
  const [mvDirector, setMvDirector] = useState('');
  const [mvDuration, setMvDuration] = useState<number>(120);
  const [mvAgeRating, setMvAgeRating] = useState<string>('T13');
  const [mvStatus, setMvStatus] = useState<'COMING_SOON' | 'NOW_SHOWING' | 'ENDED'>('NOW_SHOWING');
  const [mvSynopsis, setMvSynopsis] = useState('');
  const [mvPosterUrl, setMvPosterUrl] = useState('');
  const [mvTrailerUrl, setMvTrailerUrl] = useState('');

  // Form Tạo Voucher
  const [vcCode, setVcCode] = useState('');
  const [vcDesc, setVcDesc] = useState('');
  const [vcType, setVcType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [vcValue, setVcValue] = useState<number>(50000);
  const [vcMaxDiscount, setVcMaxDiscount] = useState<number>(60000);
  const [vcMinOrder, setVcMinOrder] = useState<number>(150000);
  const [vcLimit, setVcLimit] = useState<number>(50);
  const [vcStart, setVcStart] = useState<string>('2026-01-01T00:00');
  const [vcExpiry, setVcExpiry] = useState<string>('2027-12-31T23:59');

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Tính endTime = startTime + durationMinutes + 15 phút dọn phòng
  const selectedMovieObj = movies.find((m) => m.id === stMovieId) || movies[0];
  const computedEndTimePreview = (() => {
    if (!stStartTime || !selectedMovieObj) return '';
    const start = new Date(stStartTime);
    if (isNaN(start.getTime())) return '';
    const totalMins = (selectedMovieObj.durationMinutes || 120) + 15;
    const end = new Date(start.getTime() + totalMins * 60000);
    return end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  })();

  // KPIs
  const totalRevenue = bookings
    .filter((b) => b.status === 'PAID' || b.status === 'CHECKED_IN')
    .reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
  const paidBookingsCount = bookings.filter(
    (b) => b.status === 'PAID' || b.status === 'CHECKED_IN'
  ).length;
  const checkedInCount = bookings.filter((b) => b.status === 'CHECKED_IN').length;
  const nowShowingCount = movies.filter((m) => m.status === 'NOW_SHOWING').length;

  const handleCreateShowtimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (stBasePrice < 50000) {
      setErrorMsg('Giá vé gốc (basePrice) tối thiểu là 50.000đ');
      return;
    }
    try {
      const normalizedStart = stStartTime.length === 16 ? `${stStartTime}:00` : stStartTime;
      await onCreateShowtime({
        movieId: stMovieId || movies[0]?.id,
        roomName: stRoom,
        format: stFormat,
        startTime: normalizedStart,
        basePrice: Number(stBasePrice),
      });
      setSuccessMsg(
        `Tạo suất chiếu thành công tại ${stRoom}! Đã tự động sinh 56 ghế (STANDARD A-C, VIP D-F +20k, COUPLE G x2 + phụ thu).`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi tạo suất chiếu (409 Conflict)');
    }
  };

  const handleQrCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setCheckedInTicketInfo(null);
    if (!qrInput.trim()) {
      setErrorMsg('Vui lòng nhập mã QR cần soát vé');
      return;
    }
    try {
      const res = await onCheckInQr(qrInput.trim());
      setCheckedInTicketInfo(res);
      setSuccessMsg(
        `Soát vé QR thành công! Vé "${qrInput.trim()}" đã chuyển sang trạng thái CHECKED_IN.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Mã QR không hợp lệ hoặc đã được soát trước đó');
    }
  };

  const handleCreateMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!mvTitle.trim()) {
      setErrorMsg('Tên phim không được để trống');
      return;
    }
    try {
      await onCreateMovie({
        title: mvTitle.trim(),
        director: mvDirector.trim() || 'Đạo diễn',
        durationMinutes: Number(mvDuration) || 120,
        ageRating: mvAgeRating,
        status: mvStatus,
        synopsis: mvSynopsis.trim() || 'Bộ phim bom tấn chiếu rạp.',
        genres: ['Action', 'Sci-Fi'],
        formats: ['IMAX', 'Dolby Atmos'],
        posterUrl:
          mvPosterUrl.trim() ||
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=85',
        trailerVideoUrl: mvTrailerUrl.trim() || 'https://www.youtube.com/embed/Way9Dexny3w',
      });
      setMvTitle('');
      setMvDirector('');
      setMvSynopsis('');
      setMvPosterUrl('');
      setMvTrailerUrl('');
      setSuccessMsg('Đã thêm phim mới (kèm hình ảnh & trailer) thành công!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể thêm phim');
    }
  };

  const handleCreateVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!vcCode.trim()) {
      setErrorMsg('Mã Voucher không được để trống');
      return;
    }
    try {
      await onCreateVoucher({
        code: vcCode.trim().toUpperCase(),
        description: vcDesc.trim() || `Mã khuyến mãi ${vcCode.toUpperCase()}`,
        discountType: vcType,
        discountValue: Number(vcValue),
        maxDiscountAmount: vcType === 'PERCENT' ? Number(vcMaxDiscount) : Number(vcValue),
        minOrderValue: Number(vcMinOrder),
        usageLimit: Number(vcLimit),
        startDate: vcStart.length === 16 ? `${vcStart}:00` : vcStart,
        expiryDate: vcExpiry.length === 16 ? `${vcExpiry}:00` : vcExpiry,
      });
      setVcCode('');
      setVcDesc('');
      setSuccessMsg('Tạo mã giảm giá (Voucher) mới thành công!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tạo mã giảm giá');
    }
  };

  const navItems: { id: AdminSubTab; label: string; desc: string; icon: React.ReactNode; testId: string }[] = [
    {
      id: 'overview',
      label: 'Tổng quan Hệ thống',
      desc: 'Doanh thu, Đơn vé & Thống kê',
      icon: <LayoutDashboard className="w-4 h-4" />,
      testId: 'tab-admin-overview',
    },
    {
      id: 'showtimes',
      label: 'Quản lý Suất chiếu',
      desc: 'Thuật toán 1: Check Trùng lịch',
      icon: <CalendarPlus className="w-4 h-4" />,
      testId: 'tab-admin-showtimes',
    },
    {
      id: 'checkin',
      label: 'Máy Quét & Soát vé QR',
      desc: 'Staff Check-in 1 lần duy nhất',
      icon: <QrCode className="w-4 h-4" />,
      testId: 'tab-admin-checkin',
    },
    {
      id: 'movies',
      label: 'Quản lý Danh mục Phim',
      desc: 'Thêm/Sửa/Xóa Phim, Poster, Trailer',
      icon: <Film className="w-4 h-4" />,
      testId: 'tab-admin-movies',
    },
    {
      id: 'users',
      label: 'Tài khoản & Phân quyền',
      desc: 'Khóa/Mở User (Test 403 Forbidden)',
      icon: <Users className="w-4 h-4" />,
      testId: 'tab-admin-users',
    },
    {
      id: 'vouchers',
      label: 'Quản lý Kho Voucher',
      desc: 'Thuật toán 4: Capped Discount',
      icon: <Tag className="w-4 h-4" />,
      testId: 'tab-admin-vouchers',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row antialiased">
      {/* LEFT SIDEBAR — GIAO DIỆN QUẢN TRỊ RIÊNG BIỆT */}
      <aside className="w-full lg:w-72 bg-slate-950 text-white shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          {/* Admin Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>CineWave CMS</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Hệ thống Quản trị & Soát vé</div>
              </div>
            </div>
          </div>

          {/* Role Switcher Banner inside Admin Sidebar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/60">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-indigo-400" />
              <span>Chuyển nhanh Quyền (Test RBAC):</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onQuickLoginRole?.('admin@cinema.com', 'Admin@123')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-left ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-[#4F46E5] text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>Admin</div>
                <div className="text-[9px] opacity-75 truncate">Toàn quyền hệ thống</div>
              </button>
              <button
                type="button"
                onClick={() => onQuickLoginRole?.('staff@cinema.com', 'Staff@123')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-left ${
                  currentUser?.role === 'STAFF'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>Staff</div>
                <div className="text-[9px] opacity-75 truncate">Soát vé & Lịch chiếu</div>
              </button>
            </div>
          </div>

          {/* Sidebar Navigation Menu */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = subTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSubTab(item.id);
                    clearFeedback();
                  }}
                  data-testid={item.testId}
                  className={`w-full px-3.5 py-3 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Current Admin Info & Switch back to Customer UI */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950">
          {currentUser && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-extrabold uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onBackToCustomerSite}
            data-testid="btn-switch-to-user-ui"
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-indigo-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#4F46E5]" />
            <span>Về Giao Diện Khách Hàng (User Web)</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE — NỘI DUNG QUẢN TRỊ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                Giao diện Quản trị (Admin Portal)
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isBackendOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <Server className="w-3 h-3" />
                <span>{isBackendOnline ? 'MongoDB + Spring Boot Online' : 'Local Mode'}</span>
              </span>
            </div>
            <h1 className="font-display font-extrabold text-xl text-slate-900 mt-1">
              {navItems.find((i) => i.id === subTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToCustomerSite}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Ticket className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Mở Trang Đặt Vé Khách Hàng</span>
            </button>
          </div>
        </header>

        {/* Admin Content Body */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {/* Feedback Banner */}
          {errorMsg && (
            <div
              data-testid="alert-error-message"
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              data-testid="alert-success-message"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 0: DASHBOARD TỔNG QUAN */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Tổng Doanh Thu Vé</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-slate-900 mt-2 tabular-nums">
                    {formatVND(totalRevenue)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {paidBookingsCount} đơn đã thanh toán (PAID / CHECKED_IN)
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Tổng Bộ Phim Trong Kho</span>
                    <Film className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-slate-900 mt-2 tabular-nums">
                    {movies.length} bộ phim
                  </div>
                  <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                    {nowShowingCount} phim đang mở suất chiếu
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Tổng Suất Chiếu Hoạt Động</span>
                    <CalendarPlus className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-slate-900 mt-2 tabular-nums">
                    {showtimes.length} suất chiếu
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    4 Phòng chiếu (56 ghế / phòng)
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Vé Đã Soát QR (Check-in)</span>
                    <QrCode className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-slate-900 mt-2 tabular-nums">
                    {checkedInCount} / {paidBookingsCount} vé
                  </div>
                  <div className="text-[11px] text-purple-600 font-semibold mt-1">
                    {vouchers.length} mã Voucher đang cấu hình
                  </div>
                </div>
              </div>

              {/* Quick Module Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setSubTab('showtimes')}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#4F46E5] text-left transition-all cursor-pointer shadow-xs group"
                >
                  <div className="font-display font-bold text-sm text-slate-900 group-hover:text-[#4F46E5]">
                    1. Xếp lịch & Kiểm tra Trùng phòng chiếu
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tạo suất chiếu mới, tự tính +15p dọn phòng và sinh 56 ghế tự động.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTab('checkin')}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#4F46E5] text-left transition-all cursor-pointer shadow-xs group"
                >
                  <div className="font-display font-bold text-sm text-slate-900 group-hover:text-[#4F46E5]">
                    2. Máy Quét Mã QR Soát Vé (Staff)
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Quét mã QR chuyển trạng thái PAID sang CHECKED_IN (chặn quét lại lần 2).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTab('users')}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#4F46E5] text-left transition-all cursor-pointer shadow-xs group"
                >
                  <div className="font-display font-bold text-sm text-slate-900 group-hover:text-[#4F46E5]">
                    3. Khóa Tài Khoản Vi Phạm (403 Forbidden)
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Vô hiệu hóa tài khoản ngay cả khi khách đang có JWT Token còn hạn.
                  </p>
                </button>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                  Đơn Đặt Vé Gần Đây Trên Hệ Thống ({bookings.length})
                </h3>
                {bookings.length === 0 ? (
                  <div className="text-xs text-slate-400 py-8 text-center">
                    Chưa có đơn đặt vé nào phát sinh trong phiên hiện tại.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                          <th className="py-2.5 px-3">Mã đơn</th>
                          <th className="py-2.5 px-3">Khách hàng</th>
                          <th className="py-2.5 px-3">Phim & Phòng</th>
                          <th className="py-2.5 px-3">Ghế</th>
                          <th className="py-2.5 px-3">Thành tiền</th>
                          <th className="py-2.5 px-3">Mã QR</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.map((b) => (
                          <tr key={b.bookingId} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">
                              {b.bookingId}
                            </td>
                            <td className="py-3 px-3">{b.customer.email}</td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{b.movie.title}</div>
                              <div className="text-[11px] text-slate-400">
                                {b.showtime.roomName} · {b.showtime.time}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-[#4F46E5]">
                              {b.seatCodes.join(', ')}
                            </td>
                            <td className="py-3 px-3 font-bold tabular-nums">
                              {formatVND(b.pricing.total)}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px]">
                              {b.qrCode || '--'}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  b.status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.status === 'CHECKED_IN'
                                    ? 'bg-purple-100 text-purple-800'
                                    : b.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: TẠO SUẤT CHIẾU & CHECK TRÙNG LỊCH (THUẬT TOÁN 1) */}
          {subTab === 'showtimes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleCreateShowtimeSubmit}
                className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <h3 className="font-display font-bold text-base text-[#0F172A] flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-[#4F46E5]" />
                  <span>Tạo Suất chiếu & Tự động sinh 56 ghế</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Thuật toán 1: Hệ thống tự tính <code>endTime = startTime + duration + 15p</code>{' '}
                  và ném lỗi <strong>409 Conflict</strong> nếu trùng khung giờ tại cùng phòng chiếu.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn Phim
                  </label>
                  <select
                    value={stMovieId}
                    onChange={(e) => setStMovieId(e.target.value)}
                    data-testid="select-showtime-movie"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {movies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.durationMinutes} phút - {m.ageRating})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phòng chiếu
                    </label>
                    <select
                      value={stRoom}
                      onChange={(e) => setStRoom(e.target.value)}
                      data-testid="select-showtime-room"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Cinema 01">Cinema 01</option>
                      <option value="Cinema 02">Cinema 02</option>
                      <option value="Cinema 03">Cinema 03</option>
                      <option value="Cinema 04">Cinema 04</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Định dạng
                    </label>
                    <select
                      value={stFormat}
                      onChange={(e) => setStFormat(e.target.value as MovieFormat)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="IMAX">IMAX</option>
                      <option value="Dolby Atmos">Dolby Atmos</option>
                      <option value="4DX">4DX</option>
                      <option value="3D">3D</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thời gian bắt đầu (startTime)
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={stStartTime}
                      onChange={(e) => setStStartTime(e.target.value)}
                      data-testid="input-showtime-start"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giá vé gốc (basePrice &ge; 50.000đ)
                    </label>
                    <input
                      type="number"
                      required
                      min={50000}
                      step={5000}
                      value={stBasePrice}
                      onChange={(e) => setStBasePrice(Number(e.target.value))}
                      data-testid="input-showtime-price"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Giờ kết thúc dự kiến (+15p dọn phòng):</span>
                    <strong className="text-[#4F46E5]">{computedEndTimePreview || '--:--'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ghế STANDARD (Hàng A-C):</span>
                    <strong>{formatVND(stBasePrice)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ghế VIP (Hàng D-F, +20.000đ):</span>
                    <strong>{formatVND(stBasePrice + 20000)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ghế COUPLE (Hàng G, x2 + 20.000đ):</span>
                    <strong>{formatVND(stBasePrice * 2 + 20000)}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  data-testid="btn-create-showtime"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Tạo Suất chiếu & Sinh Sơ đồ ghế
                </button>
              </form>

              {/* Danh sách suất chiếu hiện tại */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-display font-bold text-base text-[#0F172A] mb-4">
                  Lịch chiếu hiện tại theo Phòng chiếu ({showtimes.length} suất)
                </h3>
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {showtimes.map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-[#4F46E5]">
                            {st.roomName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {st.format}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {st.movieTitle || movies.find((m) => m.id === st.movieId)?.title}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-1 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Bắt đầu: <strong>{st.date} {st.time}</strong>
                            {st.endTime && (
                              <>
                                {' '}
                                · Kết thúc (+15p): <strong>{st.endTime.slice(11, 16)}</strong>
                              </>
                            )}
                          </span>
                          <span>
                            · Giá gốc: <strong>{formatVND(st.basePrice)}</strong>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteShowtime(st.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Xóa suất chiếu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOÁT VÉ QR CODE (STAFF / ADMIN) */}
          {subTab === 'checkin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleQrCheckInSubmit}
                className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <h3 className="font-display font-bold text-base text-[#0F172A] flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#4F46E5]" />
                  <span>Máy Quét & Soát vé QR (Staff / Admin)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Quét mã <code>qrCode</code> để chuyển trạng thái vé từ <strong>PAID</strong> sang{' '}
                  <strong>CHECKED_IN</strong>. Chỉ cho phép quét thành công duy nhất 1 lần (quét lần
                  2 sẽ bị chặn 409 Conflict).
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhập hoặc Quét mã QR trên vé
                  </label>
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="VD: CW-QR-XXXXXX-XXXXXXXX"
                    data-testid="input-qr-code"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5]"
                  />
                </div>

                <button
                  type="submit"
                  data-testid="btn-check-in-qr"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Quét mã QR & Soát vé (Check-in)
                </button>

                {checkedInTicketInfo && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 text-emerald-950">
                    <div className="font-bold text-emerald-800">Thông tin vé hợp lệ:</div>
                    <div>
                      Phim:{' '}
                      <strong>
                        {checkedInTicketInfo.movieTitle || checkedInTicketInfo.movie?.title}
                      </strong>
                    </div>
                    <div>
                      Ghế: <strong>{(checkedInTicketInfo.seatCodes || []).join(', ')}</strong>
                    </div>
                    <div>
                      Trạng thái mới:{' '}
                      <strong className="uppercase text-emerald-700">
                        {checkedInTicketInfo.status}
                      </strong>
                    </div>
                  </div>
                )}
              </form>

              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-display font-bold text-base text-[#0F172A] mb-3">
                  Danh sách Vé đã phát hành (Click để điền nhanh mã QR vào máy quét)
                </h3>
                {bookings.filter((b) => b.qrCode).length === 0 ? (
                  <div className="text-xs text-slate-400 py-8 text-center">
                    Chưa có vé nào ở trạng thái PAID có mã QR. Hãy đặt ghế bên Giao diện Khách hàng
                    và bấm Thanh toán SUCCESS trước!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {bookings
                      .filter((b) => b.qrCode)
                      .map((b) => (
                        <div
                          key={b.bookingId}
                          className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  b.status === 'CHECKED_IN'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {b.status}
                              </span>
                              <span className="font-mono font-bold text-slate-800">{b.qrCode}</span>
                            </div>
                            <div className="text-slate-500 mt-1">
                              {b.movie.title} · Ghế: <strong>{b.seatCodes.join(', ')}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQrInput(b.qrCode || '')}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Điền mã QR này
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ PHIM (ADMIN) */}
          {subTab === 'movies' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleCreateMovieSubmit}
                className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <h3 className="font-display font-bold text-base text-[#0F172A]">
                  Thêm Phim Mới (Admin)
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên phim
                  </label>
                  <input
                    type="text"
                    required
                    value={mvTitle}
                    onChange={(e) => setMvTitle(e.target.value)}
                    placeholder="VD: Doraemon: Nobita và Vùng Đất Lý Tưởng"
                    data-testid="input-movie-title"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thời lượng (phút)
                    </label>
                    <input
                      type="number"
                      min={30}
                      value={mvDuration}
                      onChange={(e) => setMvDuration(Number(e.target.value))}
                      data-testid="input-movie-duration"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Độ tuổi
                    </label>
                    <select
                      value={mvAgeRating}
                      onChange={(e) => setMvAgeRating(e.target.value)}
                      data-testid="select-movie-age"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="P">P (Mọi lứa tuổi)</option>
                      <option value="T13">T13 (13+)</option>
                      <option value="T16">T16 (16+)</option>
                      <option value="T18">T18 (18+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={mvStatus}
                      onChange={(e) => setMvStatus(e.target.value as any)}
                      data-testid="select-movie-status"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="NOW_SHOWING">NOW_SHOWING</option>
                      <option value="COMING_SOON">COMING_SOON</option>
                      <option value="ENDED">ENDED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đạo diễn
                  </label>
                  <input
                    type="text"
                    value={mvDirector}
                    onChange={(e) => setMvDirector(e.target.value)}
                    placeholder="Christopher Nolan"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Hình ảnh Poster (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={mvPosterUrl}
                    onChange={(e) => setMvPosterUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL YouTube Trailer Embed (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={mvTrailerUrl}
                    onChange={(e) => setMvTrailerUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mô tả nội dung
                  </label>
                  <textarea
                    rows={3}
                    value={mvSynopsis}
                    onChange={(e) => setMvSynopsis(e.target.value)}
                    placeholder="Tóm tắt nội dung phim..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  data-testid="btn-create-movie"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs cursor-pointer"
                >
                  Thêm Phim Mới
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-display font-bold text-base text-[#0F172A] mb-4">
                  Danh mục Phim ({movies.length})
                </h3>
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {movies.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {m.posterUrl && (
                          <img
                            src={m.posterUrl}
                            alt={m.title}
                            className="w-11 h-16 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-sm bg-slate-900 text-white font-bold text-[10px]">
                              {m.ageRating}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                m.status === 'NOW_SHOWING'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.status === 'COMING_SOON'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {m.status}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{m.title}</span>
                          </div>
                          <div className="text-slate-500 mt-1 truncate">
                            Thời lượng: {m.durationMinutes} phút · ĐD: {m.director}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={m.status}
                          onChange={(e) =>
                            onUpdateMovieStatus(m, e.target.value as any, m.ageRating)
                          }
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                        >
                          <option value="NOW_SHOWING">NOW_SHOWING</option>
                          <option value="COMING_SOON">COMING_SOON</option>
                          <option value="ENDED">ENDED</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onDeleteMovie(m.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUẢN LÝ TÀI KHOẢN & KHÓA USER (ADMIN RBAC) */}
          {subTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="font-display font-bold text-base text-[#0F172A]">
                  Quản lý Tài khoản & Khóa/Mở khóa User (Kiểm thử Kịch bản 403 Forbidden)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khi Admin khóa tài khoản (<code>isActive = false</code>), nếu tài khoản đó đang có
                  JWT Token hợp lệ và gọi API đặt vé sẽ lập tức bị chặn với mã lỗi{' '}
                  <strong>403 Forbidden</strong>.
                </p>
              </div>

              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    data-testid={`user-row-${u.email}`}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{u.fullName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#4F46E5] font-bold text-[10px]">
                          {u.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {u.isActive ? 'ACTIVE (Hoạt động)' : 'LOCKED (Đã khóa - 403)'}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-1">
                        Email: <strong>{u.email}</strong> · SĐT: {u.phone || '0901000000'}
                      </div>
                    </div>

                    {u.role !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={async () => {
                          clearFeedback();
                          try {
                            await onToggleUserLock(u.id, !u.isActive);
                            setSuccessMsg(
                              `Đã ${!u.isActive ? 'MỞ KHÓA' : 'KHÓA'} tài khoản ${u.email}!`
                            );
                          } catch (err: any) {
                            setErrorMsg(err?.message || 'Không thể cập nhật trạng thái tài khoản');
                          }
                        }}
                        data-testid={`btn-toggle-user-${u.email}`}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                          u.isActive
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Khóa tài khoản (isActive = false)</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Mở khóa tài khoản</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: QUẢN LÝ KHO VOUCHER (THUẬT TOÁN 4) */}
          {subTab === 'vouchers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleCreateVoucherSubmit}
                className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3.5"
              >
                <h3 className="font-display font-bold text-base text-[#0F172A]">
                  Tạo Mã Giảm Giá Mới (Voucher)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã Voucher
                    </label>
                    <input
                      type="text"
                      required
                      value={vcCode}
                      onChange={(e) => setVcCode(e.target.value.toUpperCase())}
                      placeholder="VD: GIAM50K"
                      data-testid="input-admin-voucher-code"
                      className="w-full px-3 py-2 text-xs font-bold uppercase rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Loại giảm giá
                    </label>
                    <select
                      value={vcType}
                      onChange={(e) => setVcType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="FIXED">FIXED (Giảm tiền mặt)</option>
                      <option value="PERCENT">PERCENT (Giảm % có trần)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {vcType === 'FIXED' ? 'Số tiền giảm (đ)' : 'Phần trăm giảm (%)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={vcValue}
                      onChange={(e) => setVcValue(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Trần giảm tối đa (maxDiscount)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={vcMaxDiscount}
                      onChange={(e) => setVcMaxDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Đơn tối thiểu (minOrderValue)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={vcMinOrder}
                      onChange={(e) => setVcMinOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giới hạn lượt (usageLimit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={vcLimit}
                      onChange={(e) => setVcLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả</label>
                  <input
                    type="text"
                    value={vcDesc}
                    onChange={(e) => setVcDesc(e.target.value)}
                    placeholder="Giảm 50.000đ cho đơn từ 150.000đ"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  data-testid="btn-create-voucher"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs cursor-pointer"
                >
                  Lưu Mã Voucher
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-display font-bold text-base text-[#0F172A] mb-4">
                  Kho Mã Giảm Giá Hiện Có ({vouchers.length})
                </h3>
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {vouchers.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-[#4F46E5] bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                            {v.code}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10px]">
                            {v.discountType === 'FIXED'
                              ? `Giảm thẳng ${formatVND(v.discountValue)}`
                              : `Giảm ${v.discountValue}% (Tối đa ${formatVND(
                                  v.maxDiscountAmount || 0
                                )})`}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Đơn tối thiểu: <strong>{formatVND(v.minOrderValue)}</strong>
                          </span>
                        </div>
                        <div className="text-slate-500 mt-1">
                          {v.description} · Đã dùng:{' '}
                          <strong>
                            {v.usedCount}/{v.usageLimit}
                          </strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteVoucher(v.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
