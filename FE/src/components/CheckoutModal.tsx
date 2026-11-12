import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Lock, CheckCircle2, Smartphone, Loader2 } from 'lucide-react';
import { Movie, Showtime, Seat, ConcessionItem, formatVND } from '../types';
import { CONCESSIONS } from '../data/mockData';

interface CheckoutModalProps {
  movie: Movie;
  showtime: Showtime;
  selectedSeats: Seat[];
  concessions: Record<string, number>;
  totalAmount: number;
  onClose: () => void;
  onConfirmOrder: (customer: { fullName: string; email: string; phone: string }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  movie,
  showtime,
  selectedSeats,
  concessions,
  totalAmount,
  onClose,
  onConfirmOrder,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay' | 'google-pay'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setValidationError('Please enter your full name for ticket identification.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please provide a valid email address for digital pass delivery.');
      return;
    }
    if (!phone.trim()) {
      setValidationError('Please provide your mobile number for SMS screening updates.');
      return;
    }

    setValidationError(null);
    setIsProcessing(true);

    // Simulate swift, realistic payment confirmation
    setTimeout(() => {
      setIsProcessing(false);
      onConfirmOrder({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="font-display font-bold text-lg text-[#0F172A]">
              Secure Checkout & Ticket Issuance
            </h3>
          </div>
          <button
            onClick={onClose}
            data-testid="button-secondary-cancel"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Snapshot */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start justify-between">
            <div>
              <div className="text-xs uppercase font-semibold text-[#4F46E5] tracking-wider mb-0.5">
                {showtime.format} Experience
              </div>
              <h4 className="font-display font-bold text-base text-[#0F172A]">
                {movie.title}
              </h4>
              <div className="text-xs text-slate-600 mt-1">
                {showtime.auditorium} · {showtime.date} at {showtime.time}
              </div>
              <div className="text-xs text-indigo-900 font-medium mt-1">
                Seats: {selectedSeats.map((s) => `${s.row}-${s.number}`).join(', ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Total Charge</div>
              <div className="font-display font-extrabold text-xl text-[#0F172A] tabular-nums mt-0.5">
                {formatVND(totalAmount)}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              1. Guest Ticket Holder Info
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alexander Bell"
                  data-testid="input-name"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5] focus:ring-3 focus:ring-indigo-100 transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email for Digital Passes
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alexander@example.com"
                    data-testid="input-email"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5] focus:ring-3 focus:ring-indigo-100 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mobile Phone (SMS Entry Pass)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    data-testid="input-phone"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5] focus:ring-3 focus:ring-indigo-100 transition-all text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              2. Payment Method
            </h4>

            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Credit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('apple-pay')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'apple-pay'
                    ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span> Apple Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('google-pay')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'google-pay'
                    ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>G Pay</span>
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Expires
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center text-xs text-emerald-800">
                <Smartphone className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span>Express biometric authorization ready on your device.</span>
              </div>
            )}
          </div>

          {validationError && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 font-medium">
              {validationError}
            </div>
          )}

          {/* Submission CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              data-testid="button-primary-pay"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:bg-indigo-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing & Reserving Seats...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Pay {formatVND(totalAmount)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
              <Lock className="w-3 h-3" />
              <span>256-Bit SSL Encrypted Cinema Reservation</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
