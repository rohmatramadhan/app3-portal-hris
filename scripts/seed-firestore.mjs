import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { db } = await import("../lib/firebase.js");
import { doc, setDoc, Timestamp, terminate } from "firebase/firestore";

async function seed() {
  console.log("=== Memulai Pengisian Seed Data ke Cloud Firestore ===");
  console.log(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}\n`);

  // 1. Koleksi users (5 karyawan)
  console.log("1. Mengisi 5 data karyawan ke koleksi 'users'...");
  const usersData = [
    { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
    { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
    { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
    { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
    { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  ];

  for (const user of usersData) {
    const { id, ...data } = user;
    await setDoc(doc(db, "users", id), data);
    console.log(`   ✅ User tersimpan: ${id} (${data.nama} - ${data.role})`);
  }

  // 2. Koleksi presensi (Bulan ini: Oktober 2026)
  console.log("\n2. Mengisi catatan presensi bulan ini (Oktober 2026) ke koleksi 'presensi'...");
  // Tanggal kerja Oktober 2026 sampai hari ini (01 - 09 Oktober 2026, tanpa weekend 3-4 Okt)
  const workdays = [
    { tgl: "2026-10-01", masuk: "07:45", pulang: "17:05" },
    { tgl: "2026-10-02", masuk: "07:50", pulang: "17:10" },
    { tgl: "2026-10-05", masuk: "07:40", pulang: "17:00" },
    { tgl: "2026-10-06", masuk: "08:09", pulang: "17:15" }, // terlambat > 08.00
    { tgl: "2026-10-07", masuk: "07:55", pulang: "17:05" },
    { tgl: "2026-10-08", masuk: "07:48", pulang: "17:02" },
    { tgl: "2026-10-09", masuk: "07:52", pulang: null },    // hari ini belum pulang
  ];

  let presensiCount = 0;
  for (const item of workdays) {
    // Catatan presensi untuk Dina
    const presensiId = `dina-${item.tgl}`;
    await setDoc(doc(db, "presensi", presensiId), {
      karyawanId: "dina",
      tanggal: item.tgl,
      jamMasuk: Timestamp.fromDate(new Date(`${item.tgl}T${item.masuk}:00`)),
      jamPulang: item.pulang ? Timestamp.fromDate(new Date(`${item.tgl}T${item.pulang}:00`)) : null,
    });
    presensiCount++;
  }
  console.log(`   ✅ ${presensiCount} catatan presensi Oktober 2026 berhasil disimpan untuk 'dina'.`);

  // 3. Koleksi pengajuan_cuti (6 data: menunggu, disetujui, ditolak)
  console.log("\n3. Mengisi 6 pengajuan cuti ke koleksi 'pengajuan_cuti'...");
  const cutiData = [
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

  for (const cuti of cutiData) {
    const { id, ...data } = cuti;
    await setDoc(doc(db, "pengajuan_cuti", id), data);
    console.log(`   ✅ Cuti tersimpan: ${id} (${cuti.karyawanId} - status: ${data.status})`);
  }

  console.log("\n🎉 Seluruh seed data berhasil diisi ke Cloud Firestore!");
  await terminate(db);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Gagal mengisi seed data:", err);
  process.exit(1);
});
