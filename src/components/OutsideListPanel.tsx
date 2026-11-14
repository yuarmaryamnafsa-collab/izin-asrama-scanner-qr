import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import type { SiswaDiLuar } from '../types/asrama';

interface OutsideListPanelProps {
  students: SiswaDiLuar[];
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onSelectStudentCode?: (kodeQr: string) => void;
}

export const OutsideListPanel: React.FC<OutsideListPanelProps> = ({
  students,
  isLoading,
  errorMessage,
  onRefresh,
  onSelectStudentCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        String(s.kamar).toLowerCase().includes(q) ||
        (s.alasan && s.alasan.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Panel Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Siswa Sedang Di Luar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 tabular-nums">
            {isLoading
              ? 'Memuat daftar terbaru...'
              : `${students.length} siswa tercatat di luar asrama`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Muat ulang daftar siswa di luar"
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-700' : 'text-slate-600'}`}
            aria-hidden="true"
          />
          <span>Perbarui</span>
        </button>
      </div>

      {/* Search bar when there are students */}
      {students.length > 0 && (
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau kamar..."
              className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="divide-y divide-slate-100">
        {isLoading && students.length === 0 ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 rounded-xl bg-slate-100 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="p-6 sm:p-8 text-center space-y-3">
            <p className="text-sm font-medium text-rose-700">{errorMessage}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 sm:p-10 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Semua siswa ada di dalam asrama
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Belum ada siswa yang tercatat keluar saat ini.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center space-y-1.5">
            <Users className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700">
              Tidak ada siswa yang cocok dengan "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredStudents.map((student, index) => {
            const canQuickAction = Boolean(student.kode_qr && onSelectStudentCode);
            const RowElement = canQuickAction ? 'button' : 'div';

            return (
              <RowElement
                key={`${student.nama}-${student.kamar}-${index}`}
                {...(canQuickAction
                  ? {
                      type: 'button' as const,
                      onClick: () =>
                        student.kode_qr && onSelectStudentCode?.(student.kode_qr),
                    }
                  : {})}
                className={`w-full text-left px-4 sm:px-6 py-3.5 min-h-[60px] flex items-center justify-between gap-3 ${
                  canQuickAction
                    ? 'hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                    <DoorOpen className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {student.nama}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-0.5">
                      <span>Kamar {student.kamar}</span>
                      {student.alasan && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{student.alasan}</span>
                        </>
                      )}
                      {student.waktu_keluar && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{student.waktu_keluar}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold text-amber-800">Di Luar</span>
                  {canQuickAction && (
                    <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  )}
                </div>
              </RowElement>
            );
          })
        )}
      </div>
    </div>
  );
};
