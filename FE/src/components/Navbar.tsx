import React from 'react';
import { Ticket, LogOut, Shield, KeyRound, Popcorn, Film } from 'lucide-react';
import { User } from '../types';

export type NavTab = 'browse' | 'seats' | 'concessions' | 'passes' | 'admin';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedSeatsCount: number;
  confirmedBookingsCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchToAdminPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  selectedSeatsCount,
  confirmedBookingsCount,
  currentUser,
  onOpenAuth,
  onLogout,
  onSwitchToAdminPortal,
}) => {
  const isAdminOrStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Customer Brand Wordmark */}
        <button
          onClick={() => onSelectTab('browse')}
          className="text-left group cursor-pointer focus:outline-hidden"
          title="CineWave - Giao diện Đặt vé Khách hàng"
        >
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <span className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-[#4338CA] transition-colors">
              <Film className="w-5 h-5" />
            </span>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-[#0F172A] group-hover:text-[#4F46E5] transition-colors block leading-none">
                CineWave
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Rạp Chiếu Phim
              </span>
            </div>
          </div>
        </button>

        {/* Zone 2: Customer-Only Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('browse')}
            data-testid="nav-browse"
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'browse'
                ? 'text-[#4F46E5] border-[#4F46E5] font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Lịch chiếu & Phim
          </button>

          <button
            onClick={() => onSelectTab('concessions')}
            data-testid="nav-concessions"
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'concessions'
                ? 'text-[#4F46E5] border-[#4F46E5] font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Popcorn className="w-3.5 h-3.5 text-amber-500" />
            <span>Bắp nước & Combo</span>
          </button>

          <button
            onClick={() => onSelectTab('passes')}
            data-testid="nav-passes"
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'passes'
                ? 'text-[#4F46E5] border-[#4F46E5] font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Vé của tôi (QR)
            {confirmedBookingsCount > 0 && (
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-indigo-50 text-[#4F46E5] font-bold tabular-nums">
                {confirmedBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (onSwitchToAdminPortal) {
                onSwitchToAdminPortal();
              } else {
                onSelectTab('admin');
              }
            }}
            data-testid="nav-admin-link"
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'text-[#4F46E5] border-[#4F46E5] font-semibold'
                : 'text-[#4F46E5] border-transparent hover:text-indigo-800 font-semibold'
            }`}
          >
            <Shield className="w-4 h-4 text-[#4F46E5]" />
            <span>Admin Dashboard</span>
          </button>
        </nav>

        {/* Zone 3: User Auth & Portal Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Nút chuyển sang Giao diện Admin riêng biệt */}
          <button
            type="button"
            onClick={() => {
              if (onSwitchToAdminPortal) {
                onSwitchToAdminPortal();
              } else {
                onSelectTab('admin');
              }
            }}
            data-testid="nav-admin"
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-slate-900 text-white hover:bg-[#4F46E5] shadow-xs"
            title="Chuyển sang Giao diện Quản trị viên & Nhân viên Soát vé (Admin Dashboard)"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Dashboard</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{currentUser.fullName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md uppercase font-extrabold ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-red-100 text-red-700'
                        : currentUser.role === 'STAFF'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-[#4F46E5]'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">{currentUser.email}</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                data-testid="btn-logout"
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              data-testid="btn-open-auth"
              className="px-3.5 py-2 text-xs font-bold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đăng nhập / Đăng ký</span>
            </button>
          )}

          <button
            onClick={() => {
              if (selectedSeatsCount > 0) {
                onSelectTab('seats');
              } else {
                onSelectTab('browse');
              }
            }}
            data-testid="button-primary-tickets"
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Ticket className="w-4 h-4" />
            <span>{selectedSeatsCount > 0 ? `${selectedSeatsCount} ghế đã chọn` : 'Đặt vé'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
