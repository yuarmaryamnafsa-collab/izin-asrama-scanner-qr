import React, { useState } from 'react';
import {
  ArrowRight,
  Delete,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

interface LoginPinScreenProps {
  onLogin: (pin: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const LoginPinScreen: React.FC<LoginPinScreenProps> = ({
  onLogin,
  isLoading,
  errorMessage,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = pin.trim();
    if (!cleaned || isLoading) return;
    await onLogin(cleaned);
  };

  const appendDigit = (digit: string) => {
    if (isLoading || pin.length >= 12) return;
    setPin((prev) => prev + digit);
  };

  const handleBackspace = () => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isLoading) return;
    setPin('');
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col justify-between">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <span className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Izin Asrama
            </span>
          </div>
          <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap shrink-0">
            Sistem Scanner QR Petugas
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Desktop / Tablet Institutional Context */}
          <section className="hidden lg:block lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-800 tracking-tight">
                Portal Piket Asrama
              </p>
              <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
                Pencatatan izin keluar dan masuk asrama lebih cepat dan akurat.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-lg">
                Pindai kartu QR siswa menggunakan kamera perangkat untuk memeriksa status
                keberadaan, mencatat alasan izin keluar, serta memantau daftar siswa di luar
                asrama secara langsung.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-slate-600 leading-relaxed">
                  Akses dibatasi menggunakan PIN petugas atau guru piket yang terdaftar di
                  sistem asrama.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <QrCode
                  className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mendukung kamera belakang Android secara langsung maupun input kode QR manual.
                </p>
              </div>
            </div>
          </section>

          {/* Login Card */}
          <section className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="space-y-1.5 mb-6 text-center lg:text-left">
                <div className="inline-flex lg:hidden items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 mb-2">
                  <KeyRound className="w-5 h-5" aria-hidden="true" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Login Petugas / Guru
                </h2>
                <p className="text-sm text-slate-500">
                  Masukkan PIN guru untuk membuka pemindai QR asrama.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="inputPin"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    PIN Guru
                  </label>
                  <div className="relative">
                    <input
                      id="inputPin"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      autoComplete="current-password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Masukkan PIN"
                      disabled={isLoading}
                      className="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-slate-300 bg-white text-slate-900 text-center font-mono text-lg tracking-[0.25em] placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-shadow disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((v) => !v)}
                      aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                    >
                      {showPin ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm text-rose-800 text-center"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Tactile Android Numeric Keypad for one-handed input */}
                <div className="grid grid-cols-3 gap-2 pt-1" aria-label="Papan angka PIN">
                  {KEYPAD_DIGITS.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => appendDigit(digit)}
                      disabled={isLoading}
                      className="min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.97] text-slate-900 font-mono text-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isLoading || pin.length === 0}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-100 active:scale-[0.97] text-slate-600 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-40"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => appendDigit('0')}
                    disabled={isLoading}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.97] text-slate-900 font-mono text-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    disabled={isLoading || pin.length === 0}
                    aria-label="Hapus satu digit"
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-100 active:scale-[0.97] text-slate-700 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-40"
                  >
                    <Delete className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || pin.trim().length === 0}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Memeriksa PIN...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Scanner</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-4 px-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        Izin Keluar &amp; Masuk Asrama · Verifikasi Kartu QR Siswa
      </footer>
    </div>
  );
};
