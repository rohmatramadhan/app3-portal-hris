/**
 * scripts/seed-admin.mjs
 *
 * Script seeding menggunakan Firebase Admin SDK.
 * Membuat akun Firebase Authentication + dokumen Firestore sekaligus.
 *
 * Cara pakai:
 * 1. Download serviceAccountKey.json dari:
 *    Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
 * 2. Simpan file tersebut di root proyek (atau path lain, sesuaikan SERVICE_ACCOUNT_PATH di bawah)
 * 3. Jalankan: node scripts/seed-admin.mjs
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// ===== KONFIGURASI =====
// Sesuaikan path serviceAccountKey.json jika disimpan di lokasi lain
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), "serviceAccountKey.json");

// Password default untuk semua user dummy (bisa diganti)
const DEFAULT_PASSWORD = "sedap123";

// ===== CEK FILE SERVICE ACCOUNT =====
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ File serviceAccountKey.json tidak ditemukan!");
  console.error(`   Dicari di: ${SERVICE_ACCOUNT_PATH}`);
  console.error("");
  console.error("📋 Cara mendapatkannya:");
  console.error("   1. Buka Firebase Console -> https://console.firebase.google.com");
  console.error("   2. Pilih project hris-anya");
  console.error("   3. Klik ikon ⚙️  (Settings) -> Project Settings");
  console.error("   4. Buka tab 'Service accounts'");
  console.error("   5. Klik 'Generate new private key'");
  console.error("   6. Simpan file JSON yang didownload sebagai 'serviceAccountKey.json'");
  console.error("   7. Letakkan di folder root proyek (sama level dengan package.json)");
  process.exit(1);
}

// ===== INISIALISASI FIREBASE ADMIN =====
let admin;
try {
  admin = require("firebase-admin");
} catch {
  console.error("❌ Package 'firebase-admin' belum terinstal.");
  console.error("   Jalankan: npm install --save-dev firebase-admin");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const authAdmin = admin.auth();
const dbAdmin = admin.firestore();

// ===== DATA PENGGUNA =====
// Password disimpan hanya di Firebase Authentication, TIDAK di Firestore (sesuai aturan PRD)
const users = [
  { id: "dina",  nama: "Dina Maharani",   email: "dina@sedap.id",  role: "karyawan" },
  { id: "nisa",  nama: "Nisa Aulia",      email: "nisa@sedap.id",  role: "karyawan" },
  { id: "wulan", nama: "Wulan Sari",      email: "wulan@sedap.id", role: "hrd"      },
  { id: "rama",  nama: "Rama Putra",      email: "rama@sedap.id",  role: "karyawan" },
  { id: "sari",  nama: "Sari Dewi",       email: "sari@sedap.id",  role: "karyawan" },
  { id: "budi",  nama: "Budi Santoso",    email: "budi@sedap.id",  role: "karyawan" },
  { id: "ayu",   nama: "Ayu Lestari",     email: "ayu@sedap.id",   role: "karyawan" },
  { id: "joko",  nama: "Joko Widodo",     email: "joko@sedap.id",  role: "karyawan" },
];

// ===== DATA PENGAJUAN CUTI =====
const pengajuan_cuti = [
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

// ===== DATA PRESENSI =====
const masukTerlambat = {
  "2026-09-03": "08:14",
  "2026-09-15": "08:05",
  "2026-09-29": "08:22",
  "2026-10-06": "08:09",
};
const hariCuti = ["2026-09-24", "2026-09-25"];

function keTanggal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buatPresensi() {
  const hasil = [];
  for (
    let d = new Date("2026-09-01T00:00:00");
    d <= new Date("2026-10-08T00:00:00");
    d.setDate(d.getDate() + 1)
  ) {
    const hari = d.getDay();
    if (hari === 0 || hari === 6) continue; // skip Sabtu & Minggu

    const tanggal = keTanggal(d);
    if (hariCuti.includes(tanggal)) continue; // skip hari cuti

    const jam = masukTerlambat[tanggal] ?? `07:${String(40 + (d.getDate() % 15)).padStart(2, "0")}`;
    hasil.push({
      id: `dina-${tanggal}`,
      karyawanId: "dina",
      tanggal,
      jamMasuk: new Date(`${tanggal}T${jam}:00`),
      jamPulang:
        tanggal === "2026-10-08"
          ? null
          : new Date(`${tanggal}T17:0${d.getDate() % 10}:00`),
    });
  }
  return hasil;
}

// ===== FUNGSI UTAMA =====
async function jalankan() {
  console.log("=".repeat(60));
  console.log("🌱 SEED DATABASE PORTAL HRIS SEDAP");
  console.log("=".repeat(60));
  console.log(`   Project  : ${serviceAccount.project_id}`);
  console.log(`   Password : ${DEFAULT_PASSWORD} (untuk semua user)`);
  console.log("=".repeat(60));

  // -- 1. Seed Firebase Authentication + Firestore users --
  console.log("\n👤 Membuat akun Firebase Authentication + dokumen users...");
  const uidMap = {}; // simpan uid per id dummy

  for (const u of users) {
    try {
      // Coba buat akun Auth baru
      let userRecord;
      try {
        userRecord = await authAdmin.createUser({
          email: u.email,
          password: DEFAULT_PASSWORD,
          displayName: u.nama,
          emailVerified: true,
        });
        console.log(`   ✅ Dibuat  : ${u.email}`);
      } catch (errCreate) {
        if (errCreate.code === "auth/email-already-exists") {
          // Akun sudah ada — ambil uid dan update password
          userRecord = await authAdmin.getUserByEmail(u.email);
          await authAdmin.updateUser(userRecord.uid, {
            password: DEFAULT_PASSWORD,
            displayName: u.nama,
          });
          console.log(`   🔄 Diperbarui: ${u.email} (sudah ada, password direset)`);
        } else {
          throw errCreate;
        }
      }

      uidMap[u.id] = userRecord.uid;

      // Simpan dokumen Firestore dengan UID asli sebagai document ID
      // Password TIDAK disimpan di sini (sesuai aturan PRD)
      await dbAdmin.collection("users").doc(userRecord.uid).set({
        nama: u.nama,
        email: u.email,
        role: u.role,
        karyawanId: u.id, // referensi ke ID dummy untuk presensi & cuti
      });
    } catch (err) {
      console.error(`   ❌ Gagal   : ${u.email} —`, err.message);
    }
  }

  console.log(`\n   Total user di-seed: ${Object.keys(uidMap).length}/${users.length}`);

  // -- 2. Seed pengajuan_cuti --
  console.log("\n📅 Mengisi koleksi pengajuan_cuti...");
  for (const c of pengajuan_cuti) {
    await dbAdmin.collection("pengajuan_cuti").doc(c.id).set({
      karyawanId: c.karyawanId,
      tanggalMulai: admin.firestore.Timestamp.fromDate(c.tanggalMulai),
      tanggalSelesai: admin.firestore.Timestamp.fromDate(c.tanggalSelesai),
      alasan: c.alasan,
      status: c.status,
      catatanHrd: c.catatanHrd,
      diajukanPada: admin.firestore.Timestamp.fromDate(c.diajukanPada),
    });
    console.log(`   ✅ ${c.id} — karyawanId: ${c.karyawanId} (${c.status})`);
  }

  // -- 3. Seed presensi --
  const presensiLengkap = buatPresensi();
  console.log(`\n🕐 Mengisi koleksi presensi (${presensiLengkap.length} catatan)...`);
  for (const p of presensiLengkap) {
    await dbAdmin.collection("presensi").doc(p.id).set({
      karyawanId: p.karyawanId,
      tanggal: p.tanggal,
      jamMasuk: p.jamMasuk
        ? admin.firestore.Timestamp.fromDate(p.jamMasuk)
        : null,
      jamPulang: p.jamPulang
        ? admin.firestore.Timestamp.fromDate(p.jamPulang)
        : null,
    });
  }
  console.log(`   ✅ ${presensiLengkap.length} catatan presensi berhasil diisi.`);

  // -- Ringkasan --
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEEDING SELESAI!");
  console.log("=".repeat(60));
  console.log("\n📋 Daftar akun untuk login:");
  console.log("-".repeat(45));
  console.log(" Email                  | Password   | Peran");
  console.log("-".repeat(45));
  for (const u of users) {
    const email = u.email.padEnd(22);
    const peran = u.role === "hrd" ? "HRD     ✨" : "Karyawan";
    console.log(` ${email} | ${DEFAULT_PASSWORD} | ${peran}`);
  }
  console.log("-".repeat(45));
  console.log(`\n💡 Semua akun menggunakan password: ${DEFAULT_PASSWORD}`);
  console.log(
    "   Kata sandi disimpan di Firebase Authentication, BUKAN di Firestore."
  );

  process.exit(0);
}

jalankan().catch((e) => {
  console.error("\n❌ Seeding gagal:", e.message);
  console.error(e);
  process.exit(1);
});
