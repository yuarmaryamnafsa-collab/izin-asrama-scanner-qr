import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Keyboard,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Search,
  SwitchCamera,
} from 'lucide-react';

interface QrScannerCardProps {
  onScanCode: (kodeQr: string) => Promise<void>;
  isPaused: boolean;
  isProcessingScan: boolean;
}

interface CameraDeviceInfo {
  id: string;
  label: string;
}

const READER_ELEMENT_ID = 'qr-reader';

export const QrScannerCard: React.FC<QrScannerCardProps> = ({
  onScanCode,
  isPaused,
  isProcessingScan,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const onScanRef = useRef(onScanCode);
  const scanCooldownRef = useRef(false);

  const [cameraState, setCameraState] = useState<'starting' | 'active' | 'paused' | 'error'>(
    'starting'
  );
  const [statusText, setStatusText] = useState('Menyiapkan kamera belakang...');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    onScanRef.current = onScanCode;
  }, [onScanCode]);

  const stopScanner = useCallback(async () => {
    const instance = scannerRef.current;
    if (!instance) return;
    try {
      if (isRunningRef.current) {
        await instance.stop();
      }
    } catch {
      // Ignore stop errors if already stopped
    } finally {
      isRunningRef.current = false;
      try {
        instance.clear();
      } catch {
        // Ignore clear errors
      }
    }
  }, []);

  const startScanner = useCallback(
    async (preferredDeviceId?: string) => {
      await stopScanner();

      setCameraState('starting');
      setErrorDetail(null);
      setStatusText('Mengakses kamera...');

      try {
        const availableCameras = await Html5Qrcode.getCameras().catch(() => []);
        if (availableCameras.length > 0) {
          setCameras(availableCameras);
        }

        const instance = new Html5Qrcode(READER_ELEMENT_ID);
        scannerRef.current = instance;

        const cameraConfig: string | MediaTrackConstraints = preferredDeviceId
          ? preferredDeviceId
          : { facingMode: 'environment' };

        await instance.start(
          cameraConfig,
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.max(180, Math.min(260, Math.floor(minEdge * 0.7)));
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (scanCooldownRef.current) return;
            scanCooldownRef.current = true;
            try {
              await onScanRef.current(decodedText.trim());
            } finally {
              setTimeout(() => {
                scanCooldownRef.current = false;
              }, 1200);
            }
          },
          () => {
            // Frame scan error is expected when no QR is in frame
          }
        );

        isRunningRef.current = true;
        setCameraState('active');
        setStatusText('Arahkan kamera ke QR Code kartu siswa');
      } catch (err) {
        isRunningRef.current = false;
        setCameraState('error');
        const message =
          err instanceof Error
            ? err.message
            : 'Izin kamera ditolak atau perangkat tidak memiliki kamera.';
        setErrorDetail(message);
        setStatusText('Kamera tidak tersedia');
        setShowManualInput(true);
      }
    },
    [stopScanner]
  );

  useEffect(() => {
    void startScanner();
    return () => {
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  // Sync external pause state (e.g., when confirmation bottom sheet is open)
  useEffect(() => {
    const instance = scannerRef.current;
    if (!instance || !isRunningRef.current) return;

    try {
      if (isPaused) {
        instance.pause(true);
        setCameraState('paused');
        setStatusText('Kamera dijeda saat memproses data siswa');
      } else {
        instance.resume();
        setCameraState('active');
        setStatusText('Arahkan kamera ke QR Code kartu siswa');
      }
    } catch {
      // Ignore state transition errors when camera wasn't active
    }
  }, [isPaused]);

  const handleTogglePause = () => {
    const instance = scannerRef.current;
    if (!instance || !isRunningRef.current) {
      void startScanner();
      return;
    }

    try {
      if (cameraState === 'paused') {
        instance.resume();
        setCameraState('active');
        setStatusText('Arahkan kamera ke QR Code kartu siswa');
      } else {
        instance.pause(true);
        setCameraState('paused');
        setStatusText('Pemindaian dijeda sementara');
      }
    } catch {
      void startScanner();
    }
  };

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const nextIndex = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIndex);
    void startScanner(cameras[nextIndex].id);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.trim();
    if (!cleaned || isProcessingScan) return;
    await onScanCode(cleaned);
    setManualCode('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header row inside card */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Pemindai Kartu QR
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isProcessingScan ? 'Memeriksa data siswa...' : statusText}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowManualInput((v) => !v)}
          className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
            showManualInput
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Keyboard className="w-4 h-4" aria-hidden="true" />
          <span>Input Manual</span>
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl bg-slate-900 overflow-hidden border border-slate-200">
          <div id={READER_ELEMENT_ID} className="w-full h-full" />

          {/* Viewfinder Corner Framing Overlay when active */}
          {cameraState === 'active' && !isProcessingScan && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl" />
                <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl" />
                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl" />
                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl" />
                <div className="scan-beam absolute inset-x-3 top-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              </div>
            </div>
          )}

          {/* Starting / Processing Overlay */}
          {(cameraState === 'starting' || isProcessingScan) && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" aria-hidden="true" />
              <p className="text-sm font-medium">
                {isProcessingScan ? 'Mengambil data siswa...' : 'Membuka kamera...'}
              </p>
            </div>
          )}

          {/* Paused Overlay */}
          {cameraState === 'paused' && !isProcessingScan && (
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white p-6 text-center">
              <Camera className="w-8 h-8 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium">Kamera dijeda</p>
              <button
                type="button"
                onClick={handleTogglePause}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Lanjutkan Scan</span>
              </button>
            </div>
          )}

          {/* Error / Permission Denied Fallback */}
          {cameraState === 'error' && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 text-white p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300">
                <CameraOff className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-semibold text-white">Kamera belum dapat diakses</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pastikan izin kamera diaktifkan di browser Android Anda, atau gunakan input kode
                  QR manual di bawah.
                </p>
                {errorDetail && (
                  <p className="text-[11px] font-mono text-slate-400 pt-1 break-words">
                    {errorDetail}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void startScanner()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Coba Buka Kamera</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {cameraState !== 'error' && (
            <button
              type="button"
              onClick={handleTogglePause}
              disabled={cameraState === 'starting'}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              {cameraState === 'paused' ? (
                <>
                  <Play className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Aktifkan Kamera</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  <span>Jeda Kamera</span>
                </>
              )}
            </button>
          )}

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <SwitchCamera className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <span>Ganti Kamera</span>
            </button>
          )}
        </div>

        {/* Optional Manual QR Code Fallback */}
        {showManualInput && (
          <form
            onSubmit={handleManualSubmit}
            className="pt-4 border-t border-slate-100 space-y-2"
          >
            <label
              htmlFor="manualQrInput"
              className="block text-xs font-semibold text-slate-600"
            >
              Input Kode QR Manual
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="manualQrInput"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ketik kode QR kartu siswa..."
                  disabled={isProcessingScan}
                  className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessingScan || manualCode.trim().length === 0}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors disabled:opacity-50"
              >
                Cek Data
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
