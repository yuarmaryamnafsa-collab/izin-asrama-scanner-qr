export type StatusSiswa = 'DI_DALAM' | 'DI_LUAR' | string;

export interface Siswa {
  kode_qr: string;
  nama: string;
  kamar: string;
  status: StatusSiswa;
}

export interface SiswaDiLuar {
  nama: string;
  kamar: string;
  kode_qr?: string;
  alasan?: string;
  waktu_keluar?: string;
}

export interface LoginResponse {
  status: 'success' | 'error';
  nama_guru?: string;
  message?: string;
}

export interface CekSiswaResponse {
  status: 'success' | 'error';
  siswa?: Siswa;
  message?: string;
}

export interface SimpanIzinResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface GetDiLuarResponse {
  status: 'success' | 'error';
  data?: SiswaDiLuar[];
  message?: string;
}

export interface ScanLogItem {
  id: string;
  nama: string;
  kamar: string;
  kode_qr: string;
  aksi: 'KELUAR' | 'MASUK';
  alasan?: string;
  waktu: string;
}

export interface ToastNotice {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}
