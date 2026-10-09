import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error("Firebase config tidak ditemukan dalam env.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Data 5 Karyawan di koleksi users
const daftarUsers = [
  { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
  { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
  { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
  { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
  { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
];

// 2. Data Presensi bulan ini (Oktober 2026)
// Mengikuti jam masuk/pulang hari kerja 1 - 9 Oktober 2026
const daftarPresensi = [
  // Dina
  {
    id: "dina-2026-10-01",
    karyawanId: "dina",
    tanggal: "2026-10-01",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-01T07:45:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-01T17:05:00")),
  },
  {
    id: "dina-2026-10-02",
    karyawanId: "dina",
    tanggal: "2026-10-02",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-02T07:50:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-02T17:08:00")),
  },
  {
    id: "dina-2026-10-05",
    karyawanId: "dina",
    tanggal: "2026-10-05",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-05T07:42:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-05T17:03:00")),
  },
  {
    id: "dina-2026-10-06",
    karyawanId: "dina",
    tanggal: "2026-10-06",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-06T08:09:00")), // Terlambat (> 08:00)
    jamPulang: Timestamp.fromDate(new Date("2026-10-06T17:15:00")),
  },
  {
    id: "dina-2026-10-07",
    karyawanId: "dina",
    tanggal: "2026-10-07",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-07T07:48:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-07T17:02:00")),
  },
  {
    id: "dina-2026-10-08",
    karyawanId: "dina",
    tanggal: "2026-10-08",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:55:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-08T17:10:00")),
  },
  {
    id: "dina-2026-10-09",
    karyawanId: "dina",
    tanggal: "2026-10-09",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:44:00")),
    jamPulang: null, // Hari ini, belum absen pulang
  },
  // Nisa
  {
    id: "nisa-2026-10-08",
    karyawanId: "nisa",
    tanggal: "2026-10-08",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:50:00")),
    jamPulang: Timestamp.fromDate(new Date("2026-10-08T17:00:00")),
  },
  {
    id: "nisa-2026-10-09",
    karyawanId: "nisa",
    tanggal: "2026-10-09",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:40:00")),
    jamPulang: null,
  },
  // Rama
  {
    id: "rama-2026-10-09",
    karyawanId: "rama",
    tanggal: "2026-10-09",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-09T08:12:00")), // Terlambat
    jamPulang: null,
  },
  // Sari
  {
    id: "sari-2026-10-09",
    karyawanId: "sari",
    tanggal: "2026-10-09",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:35:00")),
    jamPulang: null,
  },
  // Wulan (HRD)
  {
    id: "wulan-2026-10-09",
    karyawanId: "wulan",
    tanggal: "2026-10-09",
    jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:58:00")),
    jamPulang: null,
  },
];

// 3. Data 6 Pengajuan Cuti (menunggu, disetujui, dan ditolak)
const daftarCuti = [
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
    karyawanId: "rama",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-26T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-26T00:00:00")),
    alasan: "Acara keluarga mendadak di luar kota",
    status: "ditolak",
    catatanHrd: "Jadwal operasional katering sedang padat di tanggal tersebut.",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-07T11:00:00")),
  },
];

async function seed() {
  console.log("Memulai pengisian seed data ke Firestore...");

  // Seed Users
  for (const user of daftarUsers) {
    const { id, ...data } = user;
    await setDoc(doc(db, "users", id), data);
    console.log(`✓ Koleksi users: ${id} (${data.nama} - ${data.role})`);
  }

  // Seed Presensi
  for (const presensi of daftarPresensi) {
    const { id, ...data } = presensi;
    await setDoc(doc(db, "presensi", id), data);
    console.log(`✓ Koleksi presensi: ${id} (${data.tanggal})`);
  }

  // Seed Pengajuan Cuti
  for (const cuti of daftarCuti) {
    const { id, ...data } = cuti;
    await setDoc(doc(db, "pengajuan_cuti", id), data);
    console.log(`✓ Koleksi pengajuan_cuti: ${id} (Status: ${data.status})`);
  }

  console.log("\nSemua seed data berhasil dimasukkan ke Firestore!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Gagal mengisi seed data:", error);
  process.exit(1);
});
