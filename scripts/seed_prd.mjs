import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZoei62HDqhu7INYRqyGKcwYqqDIk6J5Y",
  authDomain: "portal-hris-8b460.firebaseapp.com",
  projectId: "portal-hris-8b460",
  storageBucket: "portal-hris-8b460.firebasestorage.app",
  messagingSenderId: "539462496175",
  appId: "1:539462496175:web:ea8bf9d4226a5ad116495a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UID dari akun Firebase Auth yang sudah dibuat sebelumnya
const AUTH_UID_WULAN = "jlKDa8Wz8MQwTczuulUMgGSozjH2";
const AUTH_UID_DINA = "qcIeHksMTWZwUJQ8VfNheE9WzWJ2";

async function main() {
  console.log("Menjalankan seed data Firestore...");

  // 1. Tepat 5 Karyawan di koleksi `users` sesuai PRD 7.1
  const karyawanList = [
    { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
    { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
    { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
    { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
    { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  ];

  for (const k of karyawanList) {
    await setDoc(doc(db, "users", k.id), {
      nama: k.nama,
      email: k.email,
      role: k.role,
    });
    console.log(`User tersimpan: users/${k.id} (${k.nama} - ${k.role})`);
  }

  // Sinkronisasi dokumen user untuk UID Firebase Auth agar login Dina & Wulan langsung terhubung
  await setDoc(doc(db, "users", AUTH_UID_DINA), {
    nama: "Dina",
    email: "dina@sedap.id",
    role: "karyawan",
  });
  await setDoc(doc(db, "users", AUTH_UID_WULAN), {
    nama: "Wulan",
    email: "wulan@sedap.id",
    role: "hrd",
  });

  // 2. Catatan presensi bulan ini (Oktober 2026: 2026-10-01 s/d 2026-10-09)
  const presensiBulanIni = [
    {
      karyawanId: "dina",
      tanggal: "2026-10-01",
      jamMasuk: new Date("2026-10-01T07:48:00"),
      jamPulang: new Date("2026-10-01T17:02:00"),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-02",
      jamMasuk: new Date("2026-10-02T07:55:00"),
      jamPulang: new Date("2026-10-02T17:05:00"),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-05",
      jamMasuk: new Date("2026-10-05T07:44:00"),
      jamPulang: new Date("2026-10-05T17:10:00"),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-06",
      jamMasuk: new Date("2026-10-06T08:09:00"), // Terlambat
      jamPulang: new Date("2026-10-06T17:00:00"),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-07",
      jamMasuk: new Date("2026-10-07T07:51:00"),
      jamPulang: new Date("2026-10-07T17:07:00"),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-08",
      jamMasuk: new Date("2026-10-08T07:45:00"),
      jamPulang: new Date("2026-10-08T17:00:00"),
    },
    {
      karyawanId: "dina",
      tanggal: "2026-10-09",
      jamMasuk: new Date("2026-10-09T07:50:00"),
      jamPulang: null, // Hari ini belum pulang
    },
    // Presensi karyawan lain di bulan ini
    {
      karyawanId: "nisa",
      tanggal: "2026-10-09",
      jamMasuk: new Date("2026-10-09T07:42:00"),
      jamPulang: null,
    },
    {
      karyawanId: "rama",
      tanggal: "2026-10-09",
      jamMasuk: new Date("2026-10-09T08:12:00"), // Terlambat
      jamPulang: null,
    },
    {
      karyawanId: "sari",
      tanggal: "2026-10-09",
      jamMasuk: new Date("2026-10-09T07:58:00"),
      jamPulang: null,
    },
  ];

  for (const p of presensiBulanIni) {
    const docId = `${p.karyawanId}-${p.tanggal}`;
    await setDoc(doc(db, "presensi", docId), {
      karyawanId: p.karyawanId,
      tanggal: p.tanggal,
      jamMasuk: p.jamMasuk,
      jamPulang: p.jamPulang,
    });

    // Simpan juga untuk UID auth Dina
    if (p.karyawanId === "dina") {
      await setDoc(doc(db, "presensi", `${AUTH_UID_DINA}-${p.tanggal}`), {
        karyawanId: AUTH_UID_DINA,
        tanggal: p.tanggal,
        jamMasuk: p.jamMasuk,
        jamPulang: p.jamPulang,
      });
    }
  }
  console.log(`Tersimpan ${presensiBulanIni.length} catatan presensi bulan ini.`);

  // 3. Tepat 6 pengajuan cuti dengan status menunggu, disetujui, dan ditolak (PRD 7.1)
  const cutiList = [
    {
      id: "C001",
      karyawanId: "dina",
      tanggalMulai: new Date("2026-10-12T00:00:00"),
      tanggalSelesai: new Date("2026-10-13T00:00:00"),
      alasan: "Menghadiri pernikahan saudara di Bandung",
      status: "disetujui",
      catatanHrd: "Disetujui. Selamat untuk keluarga.",
      diajukanPada: new Date("2026-10-01T09:15:00"),
    },
    {
      id: "C002",
      karyawanId: "dina",
      tanggalMulai: new Date("2026-10-15T00:00:00"),
      tanggalSelesai: new Date("2026-10-16T00:00:00"),
      alasan: "Urusan keluarga mendadak",
      status: "ditolak",
      catatanHrd: "Bertepatan dengan pesanan katering besar. Mohon ajukan tanggal lain.",
      diajukanPada: new Date("2026-10-03T13:40:00"),
    },
    {
      id: "C003",
      karyawanId: "dina",
      tanggalMulai: new Date("2026-10-26T00:00:00"),
      tanggalSelesai: new Date("2026-10-28T00:00:00"),
      alasan: "Liburan bersama keluarga",
      status: "menunggu",
      catatanHrd: "",
      diajukanPada: new Date("2026-10-05T08:30:00"),
    },
    {
      id: "C004",
      karyawanId: "nisa",
      tanggalMulai: new Date("2026-10-14T00:00:00"),
      tanggalSelesai: new Date("2026-10-14T00:00:00"),
      alasan: "Kontrol kesehatan ke dokter",
      status: "disetujui",
      catatanHrd: "Semoga lekas sehat.",
      diajukanPada: new Date("2026-10-06T10:05:00"),
    },
    {
      id: "C005",
      karyawanId: "rama",
      tanggalMulai: new Date("2026-10-20T00:00:00"),
      tanggalSelesai: new Date("2026-10-21T00:00:00"),
      alasan: "Mengurus perpanjangan SIM dan surat kendaraan",
      status: "menunggu",
      catatanHrd: "",
      diajukanPada: new Date("2026-10-07T11:20:00"),
    },
    {
      id: "C006",
      karyawanId: "sari",
      tanggalMulai: new Date("2026-10-22T00:00:00"),
      tanggalSelesai: new Date("2026-10-23T00:00:00"),
      alasan: "Acara wisuda adik di Yogyakarta",
      status: "ditolak",
      catatanHrd: "Jadwal produksi dapur sedang padat, mohon ajukan minggu berikutnya.",
      diajukanPada: new Date("2026-10-08T14:00:00"),
    },
  ];

  for (const c of cutiList) {
    await setDoc(doc(db, "pengajuan_cuti", c.id), {
      karyawanId: c.karyawanId,
      tanggalMulai: c.tanggalMulai,
      tanggalSelesai: c.tanggalSelesai,
      alasan: c.alasan,
      status: c.status,
      catatanHrd: c.catatanHrd,
      diajukanPada: c.diajukanPada,
    });
    console.log(`Cuti tersimpan: pengajuan_cuti/${c.id} (${c.status})`);
  }

  console.log("Seluruh seed data Firestore berhasil disimpan!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal melakukan seed:", err);
  process.exit(1);
});
