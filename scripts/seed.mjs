import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCZoei62HDqhu7INYRqyGKcwYqqDIk6J5Y",
  authDomain: "portal-hris-8b460.firebaseapp.com",
  projectId: "portal-hris-8b460",
  storageBucket: "portal-hris-8b460.firebasestorage.app",
  messagingSenderId: "539462496175",
  appId: "1:539462496175:web:ea8bf9d4226a5ad116495a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function getOrCreateUser(email, password, nama, role) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`Created Auth user: ${email} (uid: ${cred.user.uid})`);
    return cred.user;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`Signed in existing Auth user: ${email} (uid: ${cred.user.uid})`);
      return cred.user;
    }
    throw err;
  }
}

async function main() {
  console.log("Seeding Firebase Auth & Firestore...");

  // 1. Create HRD account (Wulan)
  const wulanUser = await getOrCreateUser("wulan@sedap.id", "sedap123", "Wulan", "hrd");
  
  // 2. Create Karyawan account (Dina)
  const dinaUser = await getOrCreateUser("dina@sedap.id", "sedap123", "Dina", "karyawan");

  // Sign in as HRD to seed documents with HRD privileges
  await signInWithEmailAndPassword(auth, "wulan@sedap.id", "sedap123");
  console.log("Authenticated as Wulan (HRD) to seed Firestore data");

  // 3. Seed users collection
  const dummyUsers = [
    { id: wulanUser.uid, nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
    { id: dinaUser.uid, nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
    // Also store by fixed ID "dina" and "wulan" just in case
    { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
    { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
    { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
    { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
    { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
    { id: "budi", nama: "Budi", email: "budi@sedap.id", role: "karyawan" },
    { id: "ayu", nama: "Ayu", email: "ayu@sedap.id", role: "karyawan" },
    { id: "joko", nama: "Joko", email: "joko@sedap.id", role: "karyawan" },
  ];

  for (const u of dummyUsers) {
    console.log(`Writing user ${u.id}...`);
    await setDoc(doc(db, "users", u.id), {
      nama: u.nama,
      email: u.email,
      role: u.role,
    });
  }
  console.log(`Seeded ${dummyUsers.length} users into Firestore`);

  // 4. Seed presensi for Dina (both for dinaUser.uid and "dina")
  const masukTerlambat = {
    "2026-09-03": "08:14",
    "2026-09-15": "08:05",
    "2026-09-29": "08:22",
    "2026-10-06": "08:09",
  };
  const hariCuti = ["2026-09-24", "2026-09-25"];

  const batchPresensi = [];
  for (let d = new Date("2026-09-01T00:00:00"); d <= new Date("2026-10-08T00:00:00"); d.setDate(d.getDate() + 1)) {
    const hari = d.getDay();
    if (hari === 0 || hari === 6) continue;
    const pad = (n) => String(n).padStart(2, "0");
    const tanggal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (hariCuti.includes(tanggal)) continue;

    const jam = masukTerlambat[tanggal] ?? `07:${40 + (d.getDate() % 15)}`;
    const jamMasuk = new Date(`${tanggal}T${jam}:00`);
    const jamPulang = tanggal === "2026-10-08" ? null : new Date(`${tanggal}T17:0${d.getDate() % 10}:00`);

    // For dina's actual UID
    batchPresensi.push({
      id: `${dinaUser.uid}-${tanggal}`,
      karyawanId: dinaUser.uid,
      tanggal,
      jamMasuk,
      jamPulang,
    });
    // For "dina" dummy ID
    batchPresensi.push({
      id: `dina-${tanggal}`,
      karyawanId: "dina",
      tanggal,
      jamMasuk,
      jamPulang,
    });
  }

  for (const p of batchPresensi) {
    await setDoc(doc(db, "presensi", p.id), {
      karyawanId: p.karyawanId,
      tanggal: p.tanggal,
      jamMasuk: p.jamMasuk,
      jamPulang: p.jamPulang,
    });
  }
  console.log(`Seeded ${batchPresensi.length} presensi records`);

  // 5. Seed pengajuan_cuti
  const listCuti = [
    {
      id: "C001",
      karyawanId: dinaUser.uid,
      tanggalMulai: new Date("2026-09-24T00:00:00"),
      tanggalSelesai: new Date("2026-09-25T00:00:00"),
      alasan: "Menghadiri pernikahan saudara di Bandung",
      status: "disetujui",
      catatanHrd: "Disetujui. Selamat untuk keluarga.",
      diajukanPada: new Date("2026-09-10T09:15:00"),
    },
    {
      id: "C002",
      karyawanId: dinaUser.uid,
      tanggalMulai: new Date("2026-10-01T00:00:00"),
      tanggalSelesai: new Date("2026-10-02T00:00:00"),
      alasan: "Urusan keluarga",
      status: "ditolak",
      catatanHrd: "Bertepatan dengan pesanan katering besar. Mohon ajukan tanggal lain.",
      diajukanPada: new Date("2026-09-21T13:40:00"),
    },
    {
      id: "C003",
      karyawanId: dinaUser.uid,
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

  for (const c of listCuti) {
    await setDoc(doc(db, "pengajuan_cuti", c.id), {
      karyawanId: c.karyawanId,
      tanggalMulai: c.tanggalMulai,
      tanggalSelesai: c.tanggalSelesai,
      alasan: c.alasan,
      status: c.status,
      catatanHrd: c.catatanHrd,
      diajukanPada: c.diajukanPada,
    });
  }
  console.log(`Seeded ${listCuti.length} pengajuan_cuti records`);

  console.log("Seeding complete successfully!");
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
