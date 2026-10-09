import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";

// Muat variabel lingkungan dari .env.local
process.loadEnvFile(".env.local");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Memulai pengisian seed data ke Firestore...");

  // 1. Seed 5 Karyawan di koleksi users (PRD 7.1)
  const daftarKaryawan = [
    {
      id: "dina",
      nama: "Dina",
      email: "dina@sedap.id",
      role: "karyawan",
    },
    {
      id: "rama",
      nama: "Rama",
      email: "rama@sedap.id",
      role: "karyawan",
    },
    {
      id: "sari",
      nama: "Sari",
      email: "sari@sedap.id",
      role: "karyawan",
    },
    {
      id: "budi",
      nama: "Budi",
      email: "budi@sedap.id",
      role: "karyawan",
    },
    {
      id: "wulan",
      nama: "Wulan",
      email: "wulan@sedap.id",
      role: "hrd",
    },
  ];

  console.log("Mengisi 5 pengguna di koleksi users...");
  for (const k of daftarKaryawan) {
    const { id, ...data } = k;
    await setDoc(doc(db, "users", id), data);
    console.log(` - users/${id} (${data.nama} - ${data.role})`);
  }

  // 2. Seed Catatan Presensi Bulan Ini (Oktober 2026)
  console.log("Mengisi catatan presensi bulan Oktober 2026...");
  // Buat tanggal hari kerja 1 Oktober 2026 s/d 9 Oktober 2026
  const hariKerjaOktober = [
    { tanggal: "2026-10-01", masuk: "07:45", pulang: "17:05" },
    { tanggal: "2026-10-02", masuk: "07:50", pulang: "17:10" },
    { tanggal: "2026-10-05", masuk: "07:42", pulang: "17:00" },
    { tanggal: "2026-10-06", masuk: "08:12", pulang: "17:15" }, // Terlambat (> 08.00)
    { tanggal: "2026-10-07", masuk: "07:55", pulang: "17:02" },
    { tanggal: "2026-10-08", masuk: "07:48", pulang: "17:08" },
    { tanggal: "2026-10-09", masuk: "07:52", pulang: null },    // Hari ini (belum pulang)
  ];

  for (const hk of hariKerjaOktober) {
    // Buat presensi untuk Dina dan Rama
    for (const kId of ["dina", "rama", "sari"]) {
      const jamMasukDate = new Date(`${hk.tanggal}T${hk.masuk}:00`);
      const jamPulangDate = hk.pulang ? new Date(`${hk.tanggal}T${hk.pulang}:00`) : null;

      const docId = `${kId}-${hk.tanggal}`;
      await setDoc(doc(db, "presensi", docId), {
        karyawanId: kId,
        tanggal: hk.tanggal,
        jamMasuk: Timestamp.fromDate(jamMasukDate),
        jamPulang: jamPulangDate ? Timestamp.fromDate(jamPulangDate) : null,
      });
    }
  }
  console.log(" - Catatan presensi berhasil dibuat.");

  // 3. Seed 6 Pengajuan Cuti (status: menunggu, disetujui, ditolak)
  console.log("Mengisi 6 pengajuan cuti di koleksi pengajuan_cuti...");
  const daftarCuti = [
    {
      id: "C001",
      karyawanId: "dina",
      tanggalMulai: Timestamp.fromDate(new Date("2026-10-12T00:00:00")),
      tanggalSelesai: Timestamp.fromDate(new Date("2026-10-13T00:00:00")),
      alasan: "Menghadiri pernikahan saudara kandung di Solo",
      status: "disetujui",
      catatanHrd: "Disetujui. Selamat untuk pernikahan saudaranya.",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-02T09:15:00")),
    },
    {
      id: "C002",
      karyawanId: "rama",
      tanggalMulai: Timestamp.fromDate(new Date("2026-10-15T00:00:00")),
      tanggalSelesai: Timestamp.fromDate(new Date("2026-10-16T00:00:00")),
      alasan: "Keperluan keluarga mendesak",
      status: "disetujui",
      catatanHrd: "Disetujui. Harap selesaikan persiapan bahan dapur sebelum cuti.",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-03T11:20:00")),
    },
    {
      id: "C003",
      karyawanId: "sari",
      tanggalMulai: Timestamp.fromDate(new Date("2026-10-19T00:00:00")),
      tanggalSelesai: Timestamp.fromDate(new Date("2026-10-21T00:00:00")),
      alasan: "Acara keluarga tahunan",
      status: "menunggu",
      catatanHrd: "",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-05T08:30:00")),
    },
    {
      id: "C004",
      karyawanId: "budi",
      tanggalMulai: Timestamp.fromDate(new Date("2026-10-22T00:00:00")),
      tanggalSelesai: Timestamp.fromDate(new Date("2026-10-23T00:00:00")),
      alasan: "Memperpanjang SIM dan administrasi kependudukan",
      status: "menunggu",
      catatanHrd: "",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-06T14:10:00")),
    },
    {
      id: "C005",
      karyawanId: "dina",
      tanggalMulai: Timestamp.fromDate(new Date("2026-10-26T00:00:00")),
      tanggalSelesai: Timestamp.fromDate(new Date("2026-10-28T00:00:00")),
      alasan: "Liburan keluar kota bersama teman",
      status: "ditolak",
      catatanHrd: "Bertepatan dengan pesanan katering pernikahan 500 porsi. Mohon ajukan minggu berikutnya.",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-07T10:05:00")),
    },
    {
      id: "C006",
      karyawanId: "rama",
      tanggalMulai: Timestamp.fromDate(new Date("2026-10-29T00:00:00")),
      tanggalSelesai: Timestamp.fromDate(new Date("2026-10-30T00:00:00")),
      alasan: "Renovasi rumah",
      status: "ditolak",
      catatanHrd: "Jadwal operasional dapur sedang padat. Silakan pilih tanggal lain.",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-08T16:45:00")),
    },
  ];

  for (const c of daftarCuti) {
    const { id, ...data } = c;
    await setDoc(doc(db, "pengajuan_cuti", id), data);
    console.log(` - pengajuan_cuti/${id} (${data.status} - pemohon: ${data.karyawanId})`);
  }

  console.log("\nSemua seed data berhasil dimasukkan ke Cloud Firestore!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Gagal menjalankan seed:", err);
  process.exit(1);
});
