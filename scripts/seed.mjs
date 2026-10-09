import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// Baca .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Error: NEXT_PUBLIC_FIREBASE_API_KEY atau NEXT_PUBLIC_FIREBASE_PROJECT_ID belum diisi di .env.local");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function keTanggal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DEFAULT_PASSWORD = "sedap123";

// 8 Karyawan & HRD lengkap sesuai lib/dataContoh.js
const users = [
  { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan", password: DEFAULT_PASSWORD },
  { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan", password: DEFAULT_PASSWORD },
  { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd", password: DEFAULT_PASSWORD },
  { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan", password: DEFAULT_PASSWORD },
  { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan", password: DEFAULT_PASSWORD },
  { id: "budi", nama: "Budi", email: "budi@sedap.id", role: "karyawan", password: DEFAULT_PASSWORD },
  { id: "ayu", nama: "Ayu", email: "ayu@sedap.id", role: "karyawan", password: DEFAULT_PASSWORD },
  { id: "joko", nama: "Joko", email: "joko@sedap.id", role: "karyawan", password: DEFAULT_PASSWORD },
];

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

// Presensi lengkap Dina 1 Sept s/d 8 Okt 2026
const masukTerlambat = {
  "2026-09-03": "08:14",
  "2026-09-15": "08:05",
  "2026-09-29": "08:22",
  "2026-10-06": "08:09",
};
const hariCuti = ["2026-09-24", "2026-09-25"];

function buatPresensi() {
  const hasil = [];
  for (let d = new Date("2026-09-01T00:00:00"); d <= new Date("2026-10-08T00:00:00"); d.setDate(d.getDate() + 1)) {
    const hari = d.getDay();
    if (hari === 0 || hari === 6) continue;

    const tanggal = keTanggal(d);
    if (hariCuti.includes(tanggal)) continue;

    const jam = masukTerlambat[tanggal] ?? `07:${40 + (d.getDate() % 15)}`;
    hasil.push({
      id: `dina-${tanggal}`,
      karyawanId: "dina",
      tanggal,
      jamMasuk: new Date(`${tanggal}T${jam}:00`),
      jamPulang: tanggal === "2026-10-08" ? null : new Date(`${tanggal}T17:0${d.getDate() % 10}:00`),
    });
  }
  return hasil;
}

const presensiLengkap = buatPresensi();

async function daftarkanKeAuth(email, password, displayName) {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true,
      }),
    });
    const data = await res.json();
    if (data.localId) {
      return { sukses: true, uid: data.localId };
    }
    if (data.error && data.error.message.includes("EMAIL_EXISTS")) {
      return { sukses: true, sudahAda: true };
    }
    return { sukses: false, pesan: data.error?.message };
  } catch (err) {
    return { sukses: false, pesan: err.message };
  }
}

async function jalankan() {
  console.log("==================================================");
  console.log("🌱 SEED ULANG DATABASE FIRESTORE & AUTHENTICATION");
  console.log("==================================================");
  console.log(`Password default untuk semua user: ${DEFAULT_PASSWORD}\n`);

  // 1. Seed koleksi users (Firestore)
  console.log("Mengisi seluruh koleksi users ke Firestore (termasuk field password)...");
  for (const u of users) {
    await setDoc(doc(db, "users", u.id), u);
  }
  console.log(`✅ Berhasil mengisi ${users.length} user ke Firestore (dengan password).`);

  // 2. Mendaftarkan user ke Firebase Authentication jika Auth sudah aktif
  console.log("\nMencoba mendaftarkan akun ke Firebase Authentication...");
  let authAktif = true;
  for (const u of users) {
    const resAuth = await daftarkanKeAuth(u.email, u.password, u.nama);
    if (resAuth.sukses) {
      if (resAuth.sudahAda) {
        console.log(`   - ${u.email}: Sudah ada di Firebase Auth`);
      } else {
        console.log(`   - ${u.email}: Berhasil didaftarkan di Firebase Auth (UID: ${resAuth.uid})`);
        // Simpan juga user dengan doc ID UID aslinya agar lookup auth cepat
        await setDoc(doc(db, "users", resAuth.uid), { ...u, karyawanId: u.id });
      }
    } else {
      console.log(`   - ${u.email}: Gagal mendaftar ke Auth (${resAuth.pesan})`);
      if (resAuth.pesan?.includes("CONFIGURATION_NOT_FOUND")) {
        authAktif = false;
      }
    }
  }

  if (!authAktif) {
    console.log("\n⚠️ PERHATIAN:");
    console.log("Firebase Authentication belum diaktifkan di Firebase Console untuk project hris-anya.");
    console.log("Langkah aktivasi sangat mudah (hanya 1 menit):");
    console.log("1. Buka https://console.firebase.google.com/project/hris-anya/authentication");
    console.log("2. Klik tombol 'Get started' (Mulai)");
    console.log("3. Di tab 'Sign-in method', klik 'Email/Password' -> Aktifkan -> Klik 'Save'");
    console.log("Setelah itu jalankan 'npm run seed' lagi, maka semua akun otomatis terdaftar!");
  }

  // 3. Seed pengajuan_cuti
  console.log("\nMengisi koleksi pengajuan_cuti (6 pengajuan)...");
  for (const c of pengajuan_cuti) {
    await setDoc(doc(db, "pengajuan_cuti", c.id), {
      ...c,
      tanggalMulai: Timestamp.fromDate(c.tanggalMulai),
      tanggalSelesai: Timestamp.fromDate(c.tanggalSelesai),
      diajukanPada: Timestamp.fromDate(c.diajukanPada),
    });
  }
  console.log(`✅ Berhasil mengisi ${pengajuan_cuti.length} pengajuan cuti.`);

  // 4. Seed presensi
  console.log(`\nMengisi riwayat presensi (${presensiLengkap.length} catatan)...`);
  for (const p of presensiLengkap) {
    await setDoc(doc(db, "presensi", p.id), {
      karyawanId: p.karyawanId,
      tanggal: p.tanggal,
      jamMasuk: p.jamMasuk ? Timestamp.fromDate(p.jamMasuk) : null,
      jamPulang: p.jamPulang ? Timestamp.fromDate(p.jamPulang) : null,
    });
  }
  console.log(`✅ Berhasil mengisi ${presensiLengkap.length} catatan presensi.`);

  console.log("\n==================================================");
  console.log("✨ SEED FIRESTORE SELESAI!");
  console.log("==================================================");
  process.exit(0);
}

jalankan().catch((e) => {
  console.error("Gagal melakukan seed:", e);
  process.exit(1);
});
