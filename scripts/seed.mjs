import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import fs from "fs";

// Baca .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Data 5 Karyawan (koleksi: users)
// ID dokumen sesuai PRD & data contoh starter
const dataUsers = [
  { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
  { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
  { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
  { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
  { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
];

// 2. Data Presensi Bulan Ini (Oktober 2026, koleksi: presensi)
const dataPresensi = [
  {
    id: "dina-2026-10-01",
    karyawanId: "dina",
    tanggal: "2026-10-01",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-01T07:45:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-01T17:01:00")),
  },
  {
    id: "dina-2026-10-02",
    karyawanId: "dina",
    tanggal: "2026-10-02",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-02T07:50:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-02T17:05:00")),
  },
  {
    id: "dina-2026-10-05",
    karyawanId: "dina",
    tanggal: "2026-10-05",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-05T07:42:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-05T17:08:00")),
  },
  {
    id: "dina-2026-10-06",
    karyawanId: "dina",
    tanggal: "2026-10-06",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-06T08:09:00")), // Terlambat
    jamPulang: Timestamp.fromDate(new Date("2026-10-06T17:02:00")),
  },
  {
    id: "dina-2026-10-07",
    karyawanId: "dina",
    tanggal: "2026-10-07",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-07T07:52:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-07T17:10:00")),
  },
  {
    id: "dina-2026-10-08",
    karyawanId: "dina",
    tanggal: "2026-10-08",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:48:00")),
    jamPulang: null, // Belum pulang
  },
  {
    id: "nisa-2026-10-08",
    karyawanId: "nisa",
    tanggal: "2026-10-08",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:55:00")),
    jamPulang: null,
  },
  {
    id: "rama-2026-10-08",
    karyawanId: "rama",
    tanggal: "2026-10-08",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-08T08:15:00")), // Terlambat
    jamPulang: null,
  },
];

// 3. Data 6 Pengajuan Cuti (koleksi: pengajuan_cuti)
// Menyertakan status menunggu, disetujui, dan ditolak
const dataCuti = [
  {
    id: "C001",
    karyawanId: "dina",
    tanggalMulai: Timestamp.fromDate(new Date("2026-09-24T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-09-25T00:00:00")),
    alasan: "Menghadiri pernikahan saudara di Bandung",
    status: "disetujui",
    catatanHrd: "Disetujui. Selamat untuk keluarga.",
    diajukanPada: Timestamp.fromDate(new Date("2026-09-10T09:15:00")),
  },
  {
    id: "C002",
    karyawanId: "dina",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-01T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-02T00:00:00")),
    alasan: "Urusan keluarga",
    status: "ditolak",
    catatanHrd: "Bertepatan dengan pesanan katering besar. Mohon ajukan tanggal lain.",
    diajukanPada: Timestamp.fromDate(new Date("2026-09-21T13:40:00")),
  },
  {
    id: "C003",
    karyawanId: "dina",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-19T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-21T00:00:00")),
    alasan: "Liburan bersama keluarga",
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-05T08:30:00")),
  },
  {
    id: "C004",
    karyawanId: "nisa",
    tanggalMulai: Timestamp.fromDate(new Date("2026-09-14T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-09-14T00:00:00")),
    alasan: "Kontrol kesehatan ke dokter",
    status: "disetujui",
    catatanHrd: "Semoga lekas sehat.",
    diajukanPada: Timestamp.fromDate(new Date("2026-09-08T10:05:00")),
  },
  {
    id: "C005",
    karyawanId: "nisa",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-12T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-13T00:00:00")),
    alasan: "Mengurus pindah rumah",
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-02T16:20:00")),
  },
  {
    id: "C006",
    karyawanId: "sari",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-26T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-27T00:00:00")),
    alasan: "Keperluan keluarga di luar kota",
    status: "ditolak",
    catatanHrd: "Jadwal tim dapur sedang padat di tanggal tersebut.",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-07T11:00:00")),
  },
];

async function seed() {
  console.log("Memulai pengisian seed data Firestore...");

  // 1. Users
  console.log("Mengisi 5 pengguna ke koleksi 'users'...");
  for (const u of dataUsers) {
    const { id, ...data } = u;
    await setDoc(doc(db, "users", id), data);
    console.log(` - users/${id} (${data.nama} - ${data.role})`);
  }

  // 2. Presensi
  console.log("Mengisi catatan presensi ke koleksi 'presensi'...");
  for (const p of dataPresensi) {
    const { id, ...data } = p;
    await setDoc(doc(db, "presensi", id), data);
    console.log(` - presensi/${id}`);
  }

  // 3. Pengajuan Cuti
  console.log("Mengisi 6 pengajuan cuti ke koleksi 'pengajuan_cuti'...");
  for (const c of dataCuti) {
    const { id, ...data } = c;
    await setDoc(doc(db, "pengajuan_cuti", id), data);
    console.log(` - pengajuan_cuti/${id} (${data.status})`);
  }

  console.log("Semua seed data berhasil dimasukkan ke Cloud Firestore!");
}

seed().catch((err) => {
  console.error("Gagal melakukan seed data:", err);
  process.exit(1);
});
