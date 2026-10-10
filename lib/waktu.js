// Pembantu tanggal dan jam yang dipakai banyak halaman.

export function keTanggal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const tanggalHariIni = () => keTanggal(new Date());
export const bulanIni = () => tanggalHariIni().slice(0, 7);

// Mengubah Date, string tanggal, atau Firebase Timestamp menjadi Date valid.
function keObjekTanggal(nilai) {
  if (!nilai) return null;

  let date;

  if (nilai instanceof Date) {
    date = nilai;
  } else if (typeof nilai?.toDate === "function") {
    date = nilai.toDate();
  } else if (typeof nilai === "string") {
    const cocok = nilai.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (cocok) {
      date = new Date(
        Number(cocok[1]),
        Number(cocok[2]) - 1,
        Number(cocok[3])
      );
    } else {
      date = new Date(nilai);
    }
  } else if (typeof nilai === "number") {
    date = new Date(nilai);
  } else {
    return null;
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// Format tanggal dalam bahasa Indonesia.
export function formatTanggal(nilai) {
  const date = keObjekTanggal(nilai);
  if (!date) return "Tanggal tidak valid";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Format jam, misalnya 07.52.
export function formatJam(nilai) {
  const date = keObjekTanggal(nilai);
  if (!date) return "—";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format bulan, misalnya Oktober 2026.
export function formatBulan(bulan) {
  if (typeof bulan !== "string" || !/^\d{4}-\d{2}$/.test(bulan)) {
    return "Bulan tidak valid";
  }

  const [tahun, nomorBulan] = bulan.split("-").map(Number);

  if (nomorBulan < 1 || nomorBulan > 12) {
    return "Bulan tidak valid";
  }

  return new Date(tahun, nomorBulan - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

// Masuk setelah pukul 08.00 dihitung terlambat.
export function terlambat(jamMasuk) {
  const date = keObjekTanggal(jamMasuk);
  if (!date) return false;

  return date.getHours() * 60 + date.getMinutes() > 8 * 60;
}

// Lama cuti dalam hari, termasuk tanggal mulai dan selesai.
export function lamaHari(mulai, selesai) {
  const tanggalMulai = keObjekTanggal(mulai);
  const tanggalSelesai = keObjekTanggal(selesai);

  if (!tanggalMulai || !tanggalSelesai) return null;

  const awal = Date.UTC(
    tanggalMulai.getFullYear(),
    tanggalMulai.getMonth(),
    tanggalMulai.getDate()
  );

  const akhir = Date.UTC(
    tanggalSelesai.getFullYear(),
    tanggalSelesai.getMonth(),
    tanggalSelesai.getDate()
  );

  const selisih = (akhir - awal) / 86400000;

  if (!Number.isInteger(selisih) || selisih < 0) return null;

  return selisih + 1;
}