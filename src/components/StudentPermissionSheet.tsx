import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  Loader2,
  MapPin,
  UserCheck,
  X,
} from 'lucide-react';
import type { Siswa } from '../types/asrama';

interface StudentPermissionSheetProps {
  siswa: Siswa | null;
  onClose: () => void;
  onConfirm: (alasan: string) => Promise<void>;
  isSaving: boolean;
}

const PRESET_ALASAN = [
  'Beli perlengkapan',
  'Sakit / ke klinik',
  'Izin keluarga',
  'Keperluan sekolah',
];

export const StudentPermissionSheet: React.FC<StudentPermissionSheetProps> = ({
  siswa,
  onClose,
  onConfirm,
  isSaving,
}) => {
  const [alasan, setAlasan] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (siswa) {
      setAlasan('');
      setValidationError(null);
    }
  }, [siswa]);

  if (!siswa) return null;

  const isCurrentlyInside = siswa.status === 'DI_DALAM';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = alasan.trim();

    if (isCurrentlyInside && !trimmed) {
      setValidationError('Harap isi alasan keluar terlebih dahulu.');
      return;
    }

    setValidationError(null);
    await onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-siswa-title"
    >
      {/* Clickable backdrop only when not saving */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isSaving) onClose();
        }}
        aria-hidden="true"
      />

      {/* Bottom Sheet on Android/Mobile -> Centered Dialog on Desktop */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Android Bottom Sheet Drag Handle */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <span className="w-10 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Konfirmasi Izin Siswa</p>
            <h3
              id="modal-siswa-title"
              className="text-lg font-bold text-slate-900 tracking-tight"
            >
              Data Kartu Siswa
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Tutup jendela konfirmasi"
            className="min-w-[44px] min-h-[44px] rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Student Details Summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Nama Siswa</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {siswa.nama}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">Kode QR</p>
                <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5 tabular-nums">
                  {siswa.kode_qr}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>
                  Kamar <strong className="font-semibold text-slate-900">{siswa.kamar}</strong>
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isCurrentlyInside ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {isCurrentlyInside ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    <span>DI DALAM ASRAMA</span>
                  </>
                ) : (
                  <>
                    <DoorOpen className="w-4 h-4 text-amber-700" aria-hidden="true" />
                    <span>SEDANG DI LUAR</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reason Input when student is checking out */}
          {isCurrentlyInside ? (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="inputAlasan"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Alasan / Keperluan Keluar
                </label>
                <input
                  id="inputAlasan"
                  type="text"
                  value={alasan}
                  onChange={(e) => {
                    setAlasan(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Contoh: Beli perlengkapan, Sakit, dll"
                  disabled={isSaving}
                  autoFocus
                  className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
                {validationError && (
                  <p role="alert" className="text-xs font-medium text-rose-700 mt-1.5">
                    {validationError}
                  </p>
                )}
              </div>

              {/* Quick-pick chips as interactive buttons */}
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500">Pilih cepat alasan:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ALASAN.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAlasan(preset);
                        setValidationError(null);
                      }}
                      disabled={isSaving}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        alasan === preset
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <UserCheck
                className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-emerald-950 leading-relaxed">
                Siswa tercatat sedang berada di luar asrama. Konfirmasi untuk mencatat siswa telah
                kembali masuk asrama.
              </p>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="grid grid-cols-2 gap-3 pt-1 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 ${
                isCurrentlyInside
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : isCurrentlyInside ? (
                <>
                  <DoorOpen className="w-4 h-4" aria-hidden="true" />
                  <span>Catat Keluar</span>
                </>
              ) : (
                <>
                  <DoorClosed className="w-4 h-4" aria-hidden="true" />
                  <span>Catat Masuk</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
