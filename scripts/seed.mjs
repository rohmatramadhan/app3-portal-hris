import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJaj_WDNHT5VyTRCuiPP6iauOavRipW10",
  authDomain: "hris-sedap-fd769.firebaseapp.com",
  projectId: "hris-sedap-fd769",
  storageBucket: "hris-sedap-fd769.firebasestorage.app",
  messagingSenderId: "306646627894",
  appId: "1:306646627894:web:852ce57f4ba6d3041e4a97",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Memulai proses seeding Firestore...");

  // 1. Koleksi users: 5 karyawan
  const users = [
    { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
    { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
    { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
    { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
    { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  ];

  console.log("Mengisi koleksi users...");
  for (const user of users) {
    const { id, ...data } = user;
    await setDoc(doc(db, "users", id), data);
    console.log(` - users/${id} tersimpan`);
  }

  // 2. Koleksi presensi: catatan presensi bulan ini (Oktober 2026)
  console.log("Mengisi koleksi presensi...");
  const presensiData = [
    // Dina
    {
      karyawanId: "dina",
      tanggal: "2026-10-01",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-01T07:45:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-01T17:05:00")),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-02",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-02T07:48:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-02T17:08:00")),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-05",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-05T07:50:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-05T17:02:00")),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-06",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-06T08:09:00")), // Terlambat
      jamPulang: Timestamp.fromDate(new Date("2026-10-06T17:15:00")),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-07",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-07T07:42:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-07T17:00:00")),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-08",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:55:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-08T17:10:00")),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-09",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:52:00")),
      jamPulang: null, // Hari ini, belum pulang
    },

    // Rama
    {
      karyawanId: "rama",
      tanggal: "2026-10-05",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-05T07:40:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-05T17:00:00")),
    },
    {
      karyawanId: "rama",
      tanggal: "2026-10-06",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-06T07:45:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-06T17:05:00")),
    },
    {
      karyawanId: "rama",
      tanggal: "2026-10-07",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-07T07:50:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-07T17:00:00")),
    },
    {
      karyawanId: "rama",
      tanggal: "2026-10-08",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-08T08:12:00")), // Terlambat
      jamPulang: Timestamp.fromDate(new Date("2026-10-08T17:15:00")),
    },
    {
      karyawanId: "rama",
      tanggal: "2026-10-09",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:48:00")),
      jamPulang: null,
    },

    // Sari
    {
      karyawanId: "sari",
      tanggal: "2026-10-07",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-07T07:35:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-07T17:00:00")),
    },
    {
      karyawanId: "sari",
      tanggal: "2026-10-08",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:40:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-08T17:05:00")),
    },
    {
      karyawanId: "sari",
      tanggal: "2026-10-09",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:41:00")),
      jamPulang: null,
    },

    // Nisa
    {
      karyawanId: "nisa",
      tanggal: "2026-10-07",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-07T07:50:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-07T17:00:00")),
    },
    {
      karyawanId: "nisa",
      tanggal: "2026-10-08",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:52:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-08T17:02:00")),
    },
    {
      karyawanId: "nisa",
      tanggal: "2026-10-09",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-09T08:15:00")), // Terlambat
      jamPulang: null,
    },

    // Wulan
    {
      karyawanId: "wulan",
      tanggal: "2026-10-07",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-07T07:30:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-07T17:00:00")),
    },
    {
      karyawanId: "wulan",
      tanggal: "2026-10-08",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-08T07:35:00")),
      jamPulang: Timestamp.fromDate(new Date("2026-10-08T17:00:00")),
    },
    {
      karyawanId: "wulan",
      tanggal: "2026-10-09",
      jamMasuk: Timestamp.fromDate(new Date("2026-10-09T07:30:00")),
      jamPulang: null,
    },
  ];

  for (const item of presensiData) {
    const docId = `${item.karyawanId}-${item.tanggal}`;
    await setDoc(doc(db, "presensi", docId), item);
    console.log(` - presensi/${docId} tersimpan`);
  }

  // 3. Koleksi pengajuan_cuti: 6 pengajuan cuti dengan status menunggu, disetujui, dan ditolak
  console.log("Mengisi koleksi pengajuan_cuti...");
  const pengajuanCutiData = [
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
      alasan: "Menghadiri wisuda adik",
      status: "menunggu",
      catatanHrd: "",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-07T11:00:00")),
    },
  ];

  for (const cuti of pengajuanCutiData) {
    const { id, ...data } = cuti;
    await setDoc(doc(db, "pengajuan_cuti", id), data);
    console.log(` - pengajuan_cuti/${id} tersimpan`);
  }

  console.log("Seeding selesai dengan sukses!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Gagal melakukan seeding:", err);
  process.exit(1);
});
