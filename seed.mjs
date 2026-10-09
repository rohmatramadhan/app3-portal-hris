import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD26iGRZQkwQXkyNlCFxY9-ko_T7oxYYn4",
  authDomain: "sesi1bootcamp.firebaseapp.com",
  projectId: "sesi1bootcamp",
  storageBucket: "sesi1bootcamp.firebasestorage.app",
  messagingSenderId: "348752754301",
  appId: "1:348752754301:web:917cd2d015800221462314",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Seeding users...");
  const users = [
    { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
    { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
    { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
    { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
    { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  ];

  for (const u of users) {
    const { id, ...data } = u;
    await setDoc(doc(db, "users", id), data);
    console.log(`User seeded: ${id}`);
  }

  console.log("Seeding presensi bulan ini (Oktober 2026)...");
  const presensiData = [
    // Dina
    { id: "dina-2026-10-01", karyawanId: "dina", tanggal: "2026-10-01", jamMasuk: new Date("2026-10-01T07:45:00"), jamPulang: new Date("2026-10-01T17:02:00") },
    { id: "dina-2026-10-02", karyawanId: "dina", tanggal: "2026-10-02", jamMasuk: new Date("2026-10-02T07:50:00"), jamPulang: new Date("2026-10-02T17:05:00") },
    { id: "dina-2026-10-05", karyawanId: "dina", tanggal: "2026-10-05", jamMasuk: new Date("2026-10-05T07:42:00"), jamPulang: new Date("2026-10-05T17:01:00") },
    { id: "dina-2026-10-06", karyawanId: "dina", tanggal: "2026-10-06", jamMasuk: new Date("2026-10-06T08:09:00"), jamPulang: new Date("2026-10-06T17:10:00") },
    { id: "dina-2026-10-07", karyawanId: "dina", tanggal: "2026-10-07", jamMasuk: new Date("2026-10-07T07:55:00"), jamPulang: new Date("2026-10-07T17:00:00") },
    { id: "dina-2026-10-08", karyawanId: "dina", tanggal: "2026-10-08", jamMasuk: new Date("2026-10-08T07:48:00"), jamPulang: new Date("2026-10-08T17:03:00") },
    { id: "dina-2026-10-09", karyawanId: "dina", tanggal: "2026-10-09", jamMasuk: new Date("2026-10-09T07:52:00"), jamPulang: null },

    // Rama
    { id: "rama-2026-10-01", karyawanId: "rama", tanggal: "2026-10-01", jamMasuk: new Date("2026-10-01T07:40:00"), jamPulang: new Date("2026-10-01T17:00:00") },
    { id: "rama-2026-10-02", karyawanId: "rama", tanggal: "2026-10-02", jamMasuk: new Date("2026-10-02T08:12:00"), jamPulang: new Date("2026-10-02T17:15:00") },
    { id: "rama-2026-10-05", karyawanId: "rama", tanggal: "2026-10-05", jamMasuk: new Date("2026-10-05T07:45:00"), jamPulang: new Date("2026-10-05T17:05:00") },
    { id: "rama-2026-10-06", karyawanId: "rama", tanggal: "2026-10-06", jamMasuk: new Date("2026-10-06T07:50:00"), jamPulang: new Date("2026-10-06T17:00:00") },
    { id: "rama-2026-10-07", karyawanId: "rama", tanggal: "2026-10-07", jamMasuk: new Date("2026-10-07T07:48:00"), jamPulang: new Date("2026-10-07T17:02:00") },
    { id: "rama-2026-10-08", karyawanId: "rama", tanggal: "2026-10-08", jamMasuk: new Date("2026-10-08T07:44:00"), jamPulang: new Date("2026-10-08T17:00:00") },
    { id: "rama-2026-10-09", karyawanId: "rama", tanggal: "2026-10-09", jamMasuk: new Date("2026-10-09T07:40:00"), jamPulang: null },

    // Sari
    { id: "sari-2026-10-01", karyawanId: "sari", tanggal: "2026-10-01", jamMasuk: new Date("2026-10-01T07:58:00"), jamPulang: new Date("2026-10-01T17:00:00") },
    { id: "sari-2026-10-02", karyawanId: "sari", tanggal: "2026-10-02", jamMasuk: new Date("2026-10-02T07:50:00"), jamPulang: new Date("2026-10-02T17:02:00") },
    { id: "sari-2026-10-05", karyawanId: "sari", tanggal: "2026-10-05", jamMasuk: new Date("2026-10-05T08:05:00"), jamPulang: new Date("2026-10-05T17:10:00") },
    { id: "sari-2026-10-06", karyawanId: "sari", tanggal: "2026-10-06", jamMasuk: new Date("2026-10-06T07:46:00"), jamPulang: new Date("2026-10-06T17:00:00") },
    { id: "sari-2026-10-07", karyawanId: "sari", tanggal: "2026-10-07", jamMasuk: new Date("2026-10-07T07:52:00"), jamPulang: new Date("2026-10-07T17:05:00") },
    { id: "sari-2026-10-08", karyawanId: "sari", tanggal: "2026-10-08", jamMasuk: new Date("2026-10-08T07:49:00"), jamPulang: new Date("2026-10-08T17:00:00") },
    { id: "sari-2026-10-09", karyawanId: "sari", tanggal: "2026-10-09", jamMasuk: new Date("2026-10-09T07:55:00"), jamPulang: null },

    // Nisa
    { id: "nisa-2026-10-01", karyawanId: "nisa", tanggal: "2026-10-01", jamMasuk: new Date("2026-10-01T07:45:00"), jamPulang: new Date("2026-10-01T17:00:00") },
    { id: "nisa-2026-10-02", karyawanId: "nisa", tanggal: "2026-10-02", jamMasuk: new Date("2026-10-02T07:48:00"), jamPulang: new Date("2026-10-02T17:00:00") },
    { id: "nisa-2026-10-05", karyawanId: "nisa", tanggal: "2026-10-05", jamMasuk: new Date("2026-10-05T07:50:00"), jamPulang: new Date("2026-10-05T17:00:00") },
    { id: "nisa-2026-10-06", karyawanId: "nisa", tanggal: "2026-10-06", jamMasuk: new Date("2026-10-06T07:45:00"), jamPulang: new Date("2026-10-06T17:00:00") },
    { id: "nisa-2026-10-07", karyawanId: "nisa", tanggal: "2026-10-07", jamMasuk: new Date("2026-10-07T07:53:00"), jamPulang: new Date("2026-10-07T17:00:00") },
    { id: "nisa-2026-10-08", karyawanId: "nisa", tanggal: "2026-10-08", jamMasuk: new Date("2026-10-08T07:46:00"), jamPulang: new Date("2026-10-08T17:00:00") },
    { id: "nisa-2026-10-09", karyawanId: "nisa", tanggal: "2026-10-09", jamMasuk: new Date("2026-10-09T07:50:00"), jamPulang: null },

    // Wulan (HRD)
    { id: "wulan-2026-10-01", karyawanId: "wulan", tanggal: "2026-10-01", jamMasuk: new Date("2026-10-01T07:35:00"), jamPulang: new Date("2026-10-01T17:00:00") },
    { id: "wulan-2026-10-02", karyawanId: "wulan", tanggal: "2026-10-02", jamMasuk: new Date("2026-10-02T07:40:00"), jamPulang: new Date("2026-10-02T17:00:00") },
    { id: "wulan-2026-10-05", karyawanId: "wulan", tanggal: "2026-10-05", jamMasuk: new Date("2026-10-05T07:38:00"), jamPulang: new Date("2026-10-05T17:00:00") },
    { id: "wulan-2026-10-06", karyawanId: "wulan", tanggal: "2026-10-06", jamMasuk: new Date("2026-10-06T07:40:00"), jamPulang: new Date("2026-10-06T17:00:00") },
    { id: "wulan-2026-10-07", karyawanId: "wulan", tanggal: "2026-10-07", jamMasuk: new Date("2026-10-07T07:36:00"), jamPulang: new Date("2026-10-07T17:00:00") },
    { id: "wulan-2026-10-08", karyawanId: "wulan", tanggal: "2026-10-08", jamMasuk: new Date("2026-10-08T07:39:00"), jamPulang: new Date("2026-10-08T17:00:00") },
    { id: "wulan-2026-10-09", karyawanId: "wulan", tanggal: "2026-10-09", jamMasuk: new Date("2026-10-09T07:35:00"), jamPulang: null },
  ];

  for (const p of presensiData) {
    const docData = {
      karyawanId: p.karyawanId,
      tanggal: p.tanggal,
      jamMasuk: Timestamp.fromDate(p.jamMasuk),
      jamPulang: p.jamPulang ? Timestamp.fromDate(p.jamPulang) : null,
    };
    await setDoc(doc(db, "presensi", p.id), docData);
  }
  console.log(`Presensi seeded: ${presensiData.length} records`);

  console.log("Seeding 6 pengajuan cuti...");
  const pengajuanCuti = [
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
      tanggalSelesai: Timestamp.fromDate(new Date("2026-10-26T00:00:00")),
      alasan: "Menghadiri wisuda adik",
      status: "menunggu",
      catatanHrd: "",
      diajukanPada: Timestamp.fromDate(new Date("2026-10-07T11:00:00")),
    },
  ];

  for (const c of pengajuanCuti) {
    const { id, ...data } = c;
    await setDoc(doc(db, "pengajuan_cuti", id), data);
    console.log(`Cuti seeded: ${id} (${data.status})`);
  }

  console.log("Seeding finished successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
