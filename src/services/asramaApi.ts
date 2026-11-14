import type {
  CekSiswaResponse,
  GetDiLuarResponse,
  LoginResponse,
  SimpanIzinResponse,
} from '../types/asrama';

export const API_URL =
  const API_URL = 'https://script.google.com/macros/s/AKfycbxegIquF5e2YFWFNVJ3C--HMPRdimuzlh8fpa-7O8W5VvByRPWZQtMS6mkfDWsKRu5U/exec';
  

export async function callAsramaAPI<T>(
  pin: string,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, pin }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export function loginPetugas(pin: string): Promise<LoginResponse> {
  return callAsramaAPI<LoginResponse>(pin, { action: 'login' });
}

export function cekSiswaByQr(pin: string, kodeQr: string): Promise<CekSiswaResponse> {
  return callAsramaAPI<CekSiswaResponse>(pin, {
    action: 'cek_siswa',
    kode_qr: kodeQr,
  });
}

export function simpanIzinSiswa(
  pin: string,
  kodeQr: string,
  alasan: string
): Promise<SimpanIzinResponse> {
  return callAsramaAPI<SimpanIzinResponse>(pin, {
    action: 'simpan_izin',
    kode_qr: kodeQr,
    alasan,
  });
}

export function getSiswaDiLuar(pin: string): Promise<GetDiLuarResponse> {
  return callAsramaAPI<GetDiLuarResponse>(pin, { action: 'get_di_luar' });
}

export function playScanBeep(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio context restriction errors
  }
}

export function triggerHapticFeedback(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(45);
  }
}
