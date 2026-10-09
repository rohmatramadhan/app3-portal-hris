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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Data 5 Karyawan di koleksi 'users'
const dataUsers = [
  { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
  { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
  { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
  { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
];

// 2. Data Presensi Bulan Ini (Oktober 2026)
// Hari kerja: 2026-10-01 s/d 2026-10-09 (hari ini)
const hariKerjaOktober = [
  "2026-10-01",
  "2026-10-02",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
];

const dataPresensi = [];

for (const tgl of hariKerjaOktober) {
  // Dina hadir setiap hari kerja, beberapa kali terlambat (> 08.00)
  const jamMasukDina = tgl === "2026-10-06" ? "08:12" : "07:48";
  dataPresensi.push({
    id: `dina-${tgl}`,
    karyawanId: "dina",
    tanggal: tgl,
    jamMasuk: Timestamp.fromDate(new Date(`${tgl}T${jamMasukDina}:00`)),
    jamPulang: tgl === "2026-10-09" ? null : Timestamp.fromDate(new Date(`${tgl}T17:05:00`)),
  });

  // Nisa hadir setiap hari kerja (kecuali cuti 2026-10-05)
  if (tgl !== "2026-10-05") {
    dataPresensi.push({
      id: `nisa-${tgl}`,
      karyawanId: "nisa",
      tanggal: tgl,
      jamMasuk: Timestamp.fromDate(new Date(`${tgl}T07:52:00`)),
      jamPulang: tgl === "2026-10-09" ? null : Timestamp.fromDate(new Date(`${tgl}T17:10:00`)),
    });
  }

  // Rama hadir setiap hari kerja, tgl 2 terlambat
  const jamMasukRama = tgl === "2026-10-02" ? "08:15" : "07:45";
  dataPresensi.push({
    id: `rama-${tgl}`,
    karyawanId: "rama",
    tanggal: tgl,
    jamMasuk: Timestamp.fromDate(new Date(`${tgl}T${jamMasukRama}:00`)),
    jamPulang: tgl === "2026-10-09" ? null : Timestamp.fromDate(new Date(`${tgl}T17:00:00`)),
  });

  // Sari hadir setiap hari kerja tepat waktu
  dataPresensi.push({
    id: `sari-${tgl}`,
    karyawanId: "sari",
    tanggal: tgl,
    jamMasuk: Timestamp.fromDate(new Date(`${tgl}T07:40:00`)),
    jamPulang: tgl === "2026-10-09" ? null : Timestamp.fromDate(new Date(`${tgl}T17:02:00`)),
  });

  // Wulan (HRD) hadir setiap hari kerja
  dataPresensi.push({
    id: `wulan-${tgl}`,
    karyawanId: "wulan",
    tanggal: tgl,
    jamMasuk: Timestamp.fromDate(new Date(`${tgl}T07:55:00`)),
    jamPulang: tgl === "2026-10-09" ? null : Timestamp.fromDate(new Date(`${tgl}T17:15:00`)),
  });
}

// 3. 6 Pengajuan Cuti (status menunggu, disetujui, dan ditolak)
const dataPengajuanCuti = [
  {
    id: "C001",
    karyawanId: "dina",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-01T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-02T00:00:00")),
    alasan: "Urusan keluarga mendadak",
    status: "ditolak",
    catatanHrd: "Bertepatan dengan pesanan katering besar. Mohon ajukan tanggal lain.",
    diajukanPada: Timestamp.fromDate(new Date("2026-09-25T13:40:00")),
  },
  {
    id: "C002",
    karyawanId: "dina",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-14T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-15T00:00:00")),
    alasan: "Menghadiri pernikahan saudara di Bandung",
    status: "disetujui",
    catatanHrd: "Disetujui. Selamat untuk keluarga.",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-02T09:15:00")),
  },
  {
    id: "C003",
    karyawanId: "dina",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-22T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-23T00:00:00")),
    alasan: "Liburan bersama keluarga",
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-06T08:30:00")),
  },
  {
    id: "C004",
    karyawanId: "nisa",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-05T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-05T00:00:00")),
    alasan: "Kontrol kesehatan rutin ke dokter",
    status: "disetujui",
    catatanHrd: "Semoga sehat selalu.",
    diajukanPada: Timestamp.fromDate(new Date("2026-09-28T10:05:00")),
  },
  {
    id: "C005",
    karyawanId: "nisa",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-19T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-20T00:00:00")),
    alasan: "Mengurus perpanjangan sewa tempat tinggal",
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-07T16:20:00")),
  },
  {
    id: "C006",
    karyawanId: "rama",
    tanggalMulai: Timestamp.fromDate(new Date("2026-10-08T00:00:00")),
    tanggalSelesai: Timestamp.fromDate(new Date("2026-10-09T00:00:00")),
    alasan: "Keperluan mendadak ke luar kota",
    status: "ditolak",
    catatanHrd: "Jadwal produksi dapur sedang padat. Mohon koordinasikan kembali.",
    diajukanPada: Timestamp.fromDate(new Date("2026-10-05T14:10:00")),
  },
];

async function seed() {
  console.log("Mulai pengisian seed data ke Firestore...");

  // 1. Simpan Users
  console.log(`Mengisi ${dataUsers.length} pengguna ke koleksi 'users'...`);
  for (const user of dataUsers) {
    const { id, ...data } = user;
    await setDoc(doc(db, "users", id), data);
    console.log(`  ✓ users/${id}: ${data.nama} (${data.role})`);
  }

  // 2. Simpan Presensi
  console.log(`Mengisi ${dataPresensi.length} catatan presensi ke koleksi 'presensi'...`);
  for (const item of dataPresensi) {
    const { id, ...data } = item;
    // Omit jamPulang jika null
    const payload = { ...data };
    if (payload.jamPulang === null) {
      delete payload.jamPulang;
    }
    await setDoc(doc(db, "presensi", id), payload);
  }
  console.log(`  ✓ ${dataPresensi.length} dokumen presensi bulan ini berhasil disimpan.`);

  // 3. Simpan Pengajuan Cuti
  console.log(`Mengisi ${dataPengajuanCuti.length} pengajuan cuti ke koleksi 'pengajuan_cuti'...`);
  for (const cuti of dataPengajuanCuti) {
    const { id, ...data } = cuti;
    await setDoc(doc(db, "pengajuan_cuti", id), data);
    console.log(`  ✓ pengajuan_cuti/${id}: ${data.status} (${cuti.karyawanId})`);
  }

  console.log("\nSemua seed data berhasil dimasukkan ke Firestore!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Gagal melakukan seed data:", err);
  process.exit(1);
});
