import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Định dạng Email không hợp lệ');
      return;
    }

    if (mode === 'register') {
      if (!PASSWORD_REGEX.test(password)) {
        setError('Mật khẩu phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số');
        return;
      }
    } else if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onRegister({
          email: email.trim(),
          password,
          fullName: fullName.trim() || email.split('@')[0],
          phone: phone.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập / Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (demoEmail: string, demoPass: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await onLogin(demoEmail, demoPass);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể đăng nhập tài khoản mẫu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="font-display font-bold text-base text-[#0F172A]">
              {mode === 'login' ? 'Đăng nhập Hệ thống (JWT)' : 'Đăng ký Tài khoản (Customer)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            data-testid="tab-auth-login"
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng nhập (Customer / Staff / Admin)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            data-testid="tab-auth-register"
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng ký (Customer)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              data-testid="alert-error-message"
              className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và Tên
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    data-testid="input-fullname"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    data-testid="input-phone"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email đăng nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@cinema.com"
                data-testid="input-email"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu {mode === 'register' && '(>= 8 ký tự, Hoa, thường, số)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="input-password"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="btn-login"
            className="w-full py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading
              ? 'Đang xử lý...'
              : mode === 'login'
              ? 'Đăng nhập ngay'
              : 'Đăng ký tài khoản'}
          </button>

          {/* Quick Test Accounts */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tài khoản mẫu phục vụ Kiểm thử (1-Click Login):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('customer@cinema.com', 'Customer@123')}
                data-testid="btn-demo-customer"
                className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800">Customer</div>
                <div className="text-[10px] text-slate-500 truncate">customer@cinema.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@cinema.com', 'Admin@123')}
                data-testid="btn-demo-admin"
                className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#4F46E5]">Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin@cinema.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff@cinema.com', 'Staff@123')}
                data-testid="btn-demo-staff"
                className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-700">Staff (Soát vé)</div>
                <div className="text-[10px] text-slate-500 truncate">staff@cinema.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('testlock@cinema.com', 'Test@1234')}
                data-testid="btn-demo-testlock"
                className="p-2 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-amber-700">User Test Khóa</div>
                <div className="text-[10px] text-slate-500 truncate">testlock@cinema.com</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

