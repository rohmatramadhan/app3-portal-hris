import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDocs, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZoei62HDqhu7INYRqyGKcwYqqDIk6J5Y",
  authDomain: "portal-hris-8b460.firebaseapp.com",
  projectId: "portal-hris-8b460",
  storageBucket: "portal-hris-8b460.firebasestorage.app",
  messagingSenderId: "539462496175",
  appId: "1:539462496175:web:ea8bf9d4226a5ad116495a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = "sedap123";

const daftarPengguna = [
  { id: "ayu", nama: "Ayu", email: "ayu@sedap.id", role: "karyawan" },
  { id: "budi", nama: "Budi", email: "budi@sedap.id", role: "karyawan" },
  { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
  { id: "joko", nama: "Joko", email: "joko@sedap.id", role: "karyawan" },
  { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
  { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
  { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
];

async function buatAtauDapatkanUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`+ Akun Auth baru dibuat: ${email} (UID: ${cred.user.uid})`);
    return cred.user;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`✓ Akun Auth sudah ada: ${email} (UID: ${cred.user.uid})`);
      return cred.user;
    }
    throw err;
  }
}

async function main() {
  console.log("=== Mendaftarkan 8 Akun ke Firebase Authentication ===");

  const hasil = [];

  for (const item of daftarPengguna) {
    const user = await buatAtauDapatkanUser(item.email, DEFAULT_PASSWORD);
    hasil.push({ ...item, uid: user.uid });

    // 1. Simpan di Firestore dengan key UID Auth
    await setDoc(doc(db, "users", user.uid), {
      nama: item.nama,
      email: item.email,
      role: item.role,
    });

    // 2. Simpan juga di Firestore dengan key ID pendek (mis. 'ayu')
    await setDoc(doc(db, "users", item.id), {
      nama: item.nama,
      email: item.email,
      role: item.role,
    });
  }

  // Sinkronkan pengajuan cuti dan presensi yang ada ke UID masing-masing
  console.log("\nSinkronisasi data pengajuan cuti dan presensi ke UID Auth...");
  const cutiSnap = await getDocs(collection(db, "pengajuan_cuti"));
  for (const d of cutiSnap.docs) {
    const data = d.data();
    const targetUser = hasil.find((u) => u.id === data.karyawanId);
    if (targetUser && data.karyawanId !== targetUser.uid) {
      // Buat entri duplikat yang mengacu ke UID agar kueri pemilik langsung dapat menemukannya
      await setDoc(doc(db, "pengajuan_cuti", `${d.id}-${targetUser.uid.slice(0, 5)}`), {
        ...data,
        karyawanId: targetUser.uid,
      });
    }
  }

  console.log("\n=== SELESAI! SEMUA 8 AKUN TERDAFTAR DI FIREBASE AUTH ===");
  console.log("Kredensial login untuk semua akun:");
  console.table(
    hasil.map((u) => ({
      Nama: u.nama,
      Email: u.email,
      Peran: u.role,
      "Kata Sandi": DEFAULT_PASSWORD,
      UID: u.uid,
    }))
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal mendaftarkan akun:", err);
  process.exit(1);
});
