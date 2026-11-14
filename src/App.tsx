import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  LogOut,
  QrCode,
  ScanLine,
  Users,
  X,
} from 'lucide-react';
import { LoginPinScreen } from './components/LoginPinScreen';
import { OutsideListPanel } from './components/OutsideListPanel';
import { QrScannerCard } from './components/QrScannerCard';
import { StudentPermissionSheet } from './components/StudentPermissionSheet';
import {
  cekSiswaByQr,
  getSiswaDiLuar,
  loginPetugas,
  playScanBeep,
  simpanIzinSiswa,
  triggerHapticFeedback,
} from './services/asramaApi';
import type { ScanLogItem, Siswa, SiswaDiLuar, ToastNotice } from './types/asrama';

type MobileTab = 'scanner' | 'outside';

export default function App() {
  const [pinGuru, setPinGuru] = useState<string>(
    () => sessionStorage.getItem('pin_guru') || ''
  );
  const [namaGuru, setNamaGuru] = useState<string>(
    () => sessionStorage.getItem('nama_guru') || ''
  );

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [mobileTab, setMobileTab] = useState<MobileTab>('scanner');

  const [currentSiswa, setCurrentSiswa] = useState<Siswa | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [isSavingIzin, setIsSavingIzin] = useState(false);

  const [outsideList, setOutsideList] = useState<SiswaDiLuar[]>([]);
  const [isLoadingOutside, setIsLoadingOutside] = useState(false);
  const [outsideError, setOutsideError] = useState<string | null>(null);

  const [sessionLogs, setSessionLogs] = useState<ScanLogItem[]>([]);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  const isAuthenticated = Boolean(pinGuru && namaGuru);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const showToast = useCallback(
    (type: ToastNotice['type'], message: string) => {
      setToast({ id: Date.now(), type, message });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadDiLuar = useCallback(
    async (activePin: string) => {
      if (!activePin) return;
      setIsLoadingOutside(true);
      setOutsideError(null);

      try {
        const res = await getSiswaDiLuar(activePin);
        if (res.status === 'success' && Array.isArray(res.data)) {
          setOutsideList(res.data);
        } else {
          setOutsideError(res.message || 'Gagal memuat daftar siswa di luar.');
        }
      } catch {
        setOutsideError('Tidak dapat terhubung ke server untuk memuat data.');
      } finally {
        setIsLoadingOutside(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAuthenticated) {
      void loadDiLuar(pinGuru);
    }
  }, [isAuthenticated, pinGuru, loadDiLuar]);

  const handleLogin = async (enteredPin: string) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const data = await loginPetugas(enteredPin);
      if (data.status === 'success' && data.nama_guru) {
        sessionStorage.setItem('pin_guru', enteredPin);
        sessionStorage.setItem('nama_guru', data.nama_guru);
        setPinGuru(enteredPin);
        setNamaGuru(data.nama_guru);
        showToast('success', `Selamat bertugas, ${data.nama_guru}`);
      } else {
        setLoginError(data.message || 'PIN tidak valid. Silakan coba lagi.');
      }
    } catch {
      setLoginError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pin_guru');
    sessionStorage.removeItem('nama_guru');
    setPinGuru('');
    setNamaGuru('');
    setCurrentSiswa(null);
    setOutsideList([]);
    setSessionLogs([]);
    setLoginError(null);
    setMobileTab('scanner');
  };

  const handleCheckStudentQr = useCallback(
    async (kodeQr: string) => {
      if (!pinGuru || isProcessingScan || currentSiswa) return;

      playScanBeep();
      triggerHapticFeedback();
      setIsProcessingScan(true);

      try {
        const res = await cekSiswaByQr(pinGuru, kodeQr);
        if (res.status === 'success' && res.siswa) {
          setCurrentSiswa(res.siswa);
        } else {
          showToast('error', res.message || `QR "${kodeQr}" tidak ditemukan.`);
        }
      } catch {
        showToast('error', 'Terjadi kesalahan koneksi saat memeriksa data siswa.');
      } finally {
        setIsProcessingScan(false);
      }
    },
    [pinGuru, isProcessingScan, currentSiswa, showToast]
  );

  const handleConfirmIzin = async (alasan: string) => {
    if (!currentSiswa || !pinGuru) return;

    setIsSavingIzin(true);
    const aksi: 'KELUAR' | 'MASUK' =
      currentSiswa.status === 'DI_DALAM' ? 'KELUAR' : 'MASUK';

    try {
      const res = await simpanIzinSiswa(pinGuru, currentSiswa.kode_qr, alasan);
      if (res.status === 'success') {
        const nowFormatted = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });

        setSessionLogs((prev) => [
          {
            id: `${Date.now()}-${currentSiswa.kode_qr}`,
            nama: currentSiswa.nama,
            kamar: currentSiswa.kamar,
            kode_qr: currentSiswa.kode_qr,
            aksi,
            alasan: aksi === 'KELUAR' ? alasan : undefined,
            waktu: nowFormatted,
          },
          ...prev.slice(0, 9),
        ]);

        showToast(
          'success',
          res.message ||
            `${currentSiswa.nama} berhasil dicatat ${aksi === 'KELUAR' ? 'keluar' : 'masuk kembali'}.`
        );
        setCurrentSiswa(null);
        void loadDiLuar(pinGuru);
      } else {
        showToast('error', res.message || 'Gagal menyimpan izin siswa.');
      }
    } catch {
      showToast('error', 'Gagal menyimpan data ke server.');
    } finally {
      setIsSavingIzin(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginPinScreen
        onLogin={handleLogin}
        isLoading={isLoggingIn}
        errorMessage={loginError}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Compact Sticky Top App Bar (52px height to respect 15% mobile sticky cap) */}
      <header className="sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Izin Asrama
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 truncate">
            <span>Petugas:</span>
            <strong className="font-semibold text-slate-900 truncate">{namaGuru}</strong>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <LogOut className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Non-blocking Toast Banner */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 inset-x-4 sm:left-auto sm:right-6 sm:w-96 z-50"
        >
          <div
            className={`rounded-2xl border px-4 py-3 shadow-lg flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-800 text-white'
                : toast.type === 'error'
                  ? 'bg-rose-900 border-rose-800 text-white'
                  : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Info className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="min-w-[32px] min-h-[32px] -mr-1 -mt-1 rounded-lg flex items-center justify-center text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-24 lg:pb-10 space-y-4 sm:space-y-6">
        {/* Compact Officer Summary Bar on Mobile */}
        <div className="sm:hidden flex items-center justify-between text-xs text-slate-600 px-1">
          <span>
            Petugas: <strong className="font-semibold text-slate-900">{namaGuru}</strong>
          </span>
          <span className="tabular-nums font-medium text-amber-800">
            {outsideList.length} Di Luar
          </span>
        </div>

        {/* Desktop 2-Column Workspace / Mobile Tabbed Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Scanner + Recent Session Activity */}
          <div
            className={`lg:col-span-7 space-y-6 ${
              mobileTab === 'scanner' ? 'block' : 'hidden lg:block'
            }`}
          >
            <QrScannerCard
              onScanCode={handleCheckStudentQr}
              isPaused={Boolean(currentSiswa) || (isMobileViewport && mobileTab !== 'scanner')}
              isProcessingScan={isProcessingScan}
            />

            {/* Session Activity Log */}
            {sessionLogs.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Riwayat Scan Sesi Ini
                  </h2>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {sessionLogs.length} catatan
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {sessionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {log.nama}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-0.5">
                          <span>Kamar {log.kamar}</span>
                          {log.alasan && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{log.alasan}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-semibold ${
                            log.aksi === 'KELUAR' ? 'text-amber-800' : 'text-emerald-800'
                          }`}
                        >
                          {log.aksi === 'KELUAR' ? 'Keluar' : 'Masuk'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 tabular-nums flex items-center justify-end gap-1 mt-0.5">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          <span>{log.waktu}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Live Outside Students List */}
          <div
            className={`lg:col-span-5 ${
              mobileTab === 'outside' ? 'block' : 'hidden lg:block'
            }`}
          >
            <OutsideListPanel
              students={outsideList}
              isLoading={isLoadingOutside}
              errorMessage={outsideError}
              onRefresh={() => void loadDiLuar(pinGuru)}
              onSelectStudentCode={(kodeQr) => void handleCheckStudentQr(kodeQr)}
            />
          </div>
        </div>
      </main>

      {/* Mobile / Android Bottom Tab Bar (56px height) */}
      <nav
        aria-label="Navigasi utama Android"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-2 h-14">
          <button
            type="button"
            onClick={() => setMobileTab('scanner')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileTab === 'scanner'
                ? 'text-emerald-800 font-semibold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <ScanLine className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] tracking-tight">Scanner QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileTab('outside');
              void loadDiLuar(pinGuru);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileTab === 'outside'
                ? 'text-emerald-800 font-semibold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Users className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] tracking-tight tabular-nums">
              Di Luar ({outsideList.length})
            </span>
          </button>
        </div>
      </nav>

      {/* Android Bottom Sheet / Desktop Confirmation Modal */}
      <StudentPermissionSheet
        siswa={currentSiswa}
        onClose={() => setCurrentSiswa(null)}
        onConfirm={handleConfirmIzin}
        isSaving={isSavingIzin}
      />
    </div>
  );
}
