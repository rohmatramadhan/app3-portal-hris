/**
 * Data contoh pengganti Firestore. Nama koleksi dan field mengikuti PRD 7.1,
 * kecuali koleksi profil yang bernama users. Field timestamp ditulis sebagai Date.
 *
 * Sample data standing in for Firestore. Collection and field names follow PRD 7.1,
 * except the profile collection, which is named users. Timestamp fields are Dates.
 */
import { keTanggal } from "./waktu";

// id = ID dokumen = uid akun Firebase Authentication / id = document ID = Firebase Authentication uid
export const users = [
  { id: "dina", uid: "w7h1YARia5PiG5qYr83QqRl1Xdk2", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
  { id: "nisa", uid: "80f2t5ubHXMe9jnRpgAPAv6OUmy1", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
  { id: "wulan", uid: "71TyWNn44jZCLWr30CK7gIzavhQ2", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
  { id: "rama", uid: "NRTlm82IiKY4DR73f5ObUA3TZYk2", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
  { id: "sari", uid: "iSajkgVKoPbnLSg6JUX4WB6sZus1", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  { id: "budi", uid: "LrHxbsmxqQP3pKvmmA6LAjXCPCB3", nama: "Budi", email: "budi@sedap.id", role: "karyawan" },
  { id: "ayu", uid: "Et0rpmTmRvYKvlqOhP7gX2E9TTE3", nama: "Ayu", email: "ayu@sedap.id", role: "karyawan" },
  { id: "joko", uid: "fiek50fCSGaZQ3BdPoUQx3WIr862", nama: "Joko", email: "joko@sedap.id", role: "karyawan" },
];


// Hari Dina datang setelah 08.00 / Days Dina arrived after 08:00
const masukTerlambat = {
  "2026-09-03": "08:14",
  "2026-09-15": "08:05",
  "2026-09-29": "08:22",
  "2026-10-06": "08:09",
};

// Dina cuti 24-25 September (lihat pengajuan C001), jadi tidak ada presensi / Dina is on leave 24-25 Sept (see C001), so no attendance
const hariCuti = ["2026-09-24", "2026-09-25"];

/**
 * Presensi Dina setiap hari kerja 1 September sampai 8 Oktober 2026.
 * Dibuat dengan perulangan supaya tidak menulis puluhan baris yang mirip.
 * Tanggal 8 Oktober belum ada jam pulang.
 *
 * Dina's attendance for every workday from 1 September to 8 October 2026.
 * Generated with a loop instead of dozens of near-identical lines.
 * 8 October has no clock-out time yet.
 */
function buatPresensiDina() {
  const hasil = [];
  for (let d = new Date("2026-09-01T00:00:00"); d <= new Date("2026-10-08T00:00:00"); d.setDate(d.getDate() + 1)) {
    const hari = d.getDay();
    if (hari === 0 || hari === 6) continue;

    const tanggal = keTanggal(d);
    if (hariCuti.includes(tanggal)) continue;

    const jam = masukTerlambat[tanggal] ?? `07:${40 + (d.getDate() % 15)}`;
    hasil.push({
      id: `dina-${tanggal}`,
      karyawanId: "dina",
      tanggal,
      jamMasuk: new Date(`${tanggal}T${jam}:00`),
      jamPulang: tanggal === "2026-10-08" ? null : new Date(`${tanggal}T17:0${d.getDate() % 10}:00`),
    });
  }
  return hasil;
}

export const presensi = buatPresensiDina();

// id = nomor pengajuan yang tampil di /cuti/[id] / id = request number shown at /cuti/[id]
export const pengajuan_cuti = [
  {
    id: "C001",
    karyawanId: "dina",
    tanggalMulai: new Date("2026-09-24T00:00:00"),
    tanggalSelesai: new Date("2026-09-25T00:00:00"),
    alasan: "Menghadiri pernikahan saudara di Bandung",
    status: "disetujui",
    catatanHrd: "Disetujui. Selamat untuk keluarga.",
    diajukanPada: new Date("2026-09-10T09:15:00"),
  },
  {
    id: "C002",
    karyawanId: "dina",
    tanggalMulai: new Date("2026-10-01T00:00:00"),
    tanggalSelesai: new Date("2026-10-02T00:00:00"),
    alasan: "Urusan keluarga",
    status: "ditolak",
    catatanHrd: "Bertepatan dengan pesanan katering besar. Mohon ajukan tanggal lain.",
    diajukanPada: new Date("2026-09-21T13:40:00"),
  },
  {
    id: "C003",
    karyawanId: "dina",
    tanggalMulai: new Date("2026-10-19T00:00:00"),
    tanggalSelesai: new Date("2026-10-21T00:00:00"),
    alasan: "Liburan bersama keluarga",
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: new Date("2026-10-05T08:30:00"),
  },
  {
    id: "C004",
    karyawanId: "nisa",
    tanggalMulai: new Date("2026-09-14T00:00:00"),
    tanggalSelesai: new Date("2026-09-14T00:00:00"),
    alasan: "Kontrol kesehatan ke dokter",
    status: "disetujui",
    catatanHrd: "Semoga lekas sehat.",
    diajukanPada: new Date("2026-09-08T10:05:00"),
  },
  {
    id: "C005",
    karyawanId: "nisa",
    tanggalMulai: new Date("2026-10-12T00:00:00"),
    tanggalSelesai: new Date("2026-10-13T00:00:00"),
    alasan: "Mengurus pindah rumah",
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: new Date("2026-10-02T16:20:00"),
  },
  {
    id: "C006",
    karyawanId: "nisa",
    tanggalMulai: new Date("2026-10-26T00:00:00"),
    tanggalSelesai: new Date("2026-10-26T00:00:00"),
    alasan: "Menghadiri wisuda adik",
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: new Date("2026-10-07T11:00:00"),
  },
];
