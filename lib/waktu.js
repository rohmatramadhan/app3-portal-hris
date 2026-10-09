// Pembantu tanggal dan jam yang dipakai banyak halaman / Date and time helpers shared by many pages

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "2026-10-07" dari objek Date, memakai zona waktu peramban / "2026-10-07" from a Date, in the browser's time zone
export function keTanggal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const tanggalHariIni = () => keTanggal(new Date());
export const bulanIni = () => tanggalHariIni().slice(0, 7);

// Menerima Date, Timestamp Firestore, atau "2026-10-07" secara deterministik (bebas hydration mismatch)
export function formatTanggal(nilai) {
  if (!nilai) return "—";
  if (typeof nilai === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nilai.trim());
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const d = parseInt(match[3], 10);
      return `${d} ${NAMA_BULAN[m]} ${y}`;
    }
  }
  const date = typeof nilai === "string" ? new Date(nilai + (nilai.includes("T") ? "" : "T00:00:00")) : (nilai?.toDate ? nilai.toDate() : nilai);
  if (!(date instanceof Date) || isNaN(date.getTime())) return "—";
  return `${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

// Format 07.52 sesuai PRD 4.2 secara deterministik (bebas hydration mismatch)
export function formatJam(date) {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : (date instanceof Date ? date : new Date(date));
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
  const jam = String(d.getHours()).padStart(2, "0");
  const menit = String(d.getMinutes()).padStart(2, "0");
  return `${jam}.${menit}`;
}

// "2026-09" -> "September 2026" secara deterministik (bebas hydration mismatch)
export function formatBulan(bulan) {
  if (!bulan) return "—";
  const parts = String(bulan).split("-");
  if (parts.length === 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (m >= 1 && m <= 12) {
      return `${NAMA_BULAN[m - 1]} ${y}`;
    }
  }
  return String(bulan);
}

// Masuk setelah pukul 08.00 dihitung terlambat (PRD 4.3) / Clocking in after 08:00 counts as late (PRD 4.3)
export function terlambat(jamMasuk) {
  if (!jamMasuk) return false;
  const d = jamMasuk?.toDate ? jamMasuk.toDate() : (jamMasuk instanceof Date ? jamMasuk : new Date(jamMasuk));
  return d.getHours() * 60 + d.getMinutes() > 8 * 60;
}

// Lama cuti dalam hari, tanggal mulai dan selesai ikut dihitung / Leave length in days, both start and end dates included
export function lamaHari(mulai, selesai) {
  return Math.round((selesai - mulai) / 86400000) + 1;
}
