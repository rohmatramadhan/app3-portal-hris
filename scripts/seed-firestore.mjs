/**
 * Script untuk mengisi data awal (seed data) ke Cloud Firestore (Prompt 2).
 * Menjalankan: node scripts/seed-firestore.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// Baca .env.local secara manual
const envPath = resolve(process.cwd(), ".env.local");
const envVars = {};
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      envVars[k.trim()] = v.join("=").trim();
    }
  }
}

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error("❌ Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID belum diisi di .env.local!");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("🚀 Memulai pengisian seed data ke Firestore...");

  // 1. Koleksi users (5 karyawan)
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
    console.log(`✓ User ditambahkan: ${data.nama} (${data.role})`);
  }

  // 2. Koleksi pengajuan_cuti (6 pengajuan dengan status menunggu, disetujui, ditolak)
  const cutiList = [
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

  for (const c of cutiList) {
    const { id, ...data } = c;
    await setDoc(doc(db, "pengajuan_cuti", id), {
      ...data,
      tanggalMulai: Timestamp.fromDate(data.tanggalMulai),
      tanggalSelesai: Timestamp.fromDate(data.tanggalSelesai),
      diajukanPada: Timestamp.fromDate(data.diajukanPada),
    });
    console.log(`✓ Pengajuan cuti ditambahkan: ${id} (${data.status})`);
  }

  // 3. Koleksi presensi (catatan presensi bulan berjalan)
  const presensiSample = [
    { tanggal: "2026-10-01", masuk: "07:45", pulang: "17:02" },
    { tanggal: "2026-10-02", masuk: "07:50", pulang: "17:05" },
    { tanggal: "2026-10-05", masuk: "07:42", pulang: "17:00" },
    { tanggal: "2026-10-06", masuk: "08:09", pulang: "17:10" }, // terlambat
    { tanggal: "2026-10-07", masuk: "07:55", pulang: "17:04" },
    { tanggal: "2026-10-08", masuk: "07:48", pulang: null },
  ];

  for (const p of presensiSample) {
    const docId = `dina_${p.tanggal}`;
    await setDoc(doc(db, "presensi", docId), {
      karyawanId: "dina",
      tanggal: p.tanggal,
      jamMasuk: Timestamp.fromDate(new Date(`${p.tanggal}T${p.masuk}:00`)),
      jamPulang: p.pulang ? Timestamp.fromDate(new Date(`${p.tanggal}T${p.pulang}:00`)) : null,
    });
    console.log(`✓ Presensi ditambahkan: ${p.tanggal}`);
  }

  console.log("✅ Seed data berhasil diisi ke Cloud Firestore!");
}

main().catch((err) => {
  console.error("❌ Gagal mengisi seed data:", err);
  process.exit(1);
});
