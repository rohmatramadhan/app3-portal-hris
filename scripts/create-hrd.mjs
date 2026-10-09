import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EMAIL = "wulan@sedap.id";
const PASSWORD = "Sedap#2026";
const NAMA = "Wulan";
const ROLE = "hrd";

async function main() {
  console.log("=== Proses Pembuatan Akun HRD Pertama ===");
  let user = null;

  // 1. Buat pengguna baru di Firebase Authentication
  try {
    const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    user = cred.user;
    console.log("1. Pengguna baru berhasil dibuat di Firebase Authentication.");
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("Akun wulan@sedap.id sudah ada. Memperbarui kata sandi menjadi Sedap#2026...");
      try {
        const cred = await signInWithEmailAndPassword(auth, EMAIL, "password123");
        await updatePassword(cred.user, PASSWORD);
        user = cred.user;
        console.log("1. Berhasil login dan memperbarui kata sandi menjadi Sedap#2026.");
      } catch (loginErr) {
        // Coba login langsung dengan Sedap#2026
        const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
        user = cred.user;
        console.log("1. Berhasil login dengan kata sandi Sedap#2026.");
      }
    } else {
      throw err;
    }
  }

  // 2. Ambil UID pengguna
  const uid = user.uid;
  console.log(`2. UID Pengguna: ${uid}`);

  // 3. Buat dokumen users/{uid} di Firestore
  const dataDokumen = {
    nama: NAMA,
    email: EMAIL,
    role: ROLE,
  };

  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, dataDokumen);
    console.log("3. Dokumen users/{uid} berhasil ditulis ke Firestore.");

    const snap = await getDoc(userDocRef);
    console.log("\n=== HASIL AKHIR ===");
    console.log("UID:", uid);
    console.log("Path Dokumen: users/" + uid);
    console.log("Isi Dokumen Firestore:", JSON.stringify(snap.data(), null, 2));
  } catch (firestoreErr) {
    console.warn("! Penulisan ke Firestore menghasilkan:", firestoreErr.code, firestoreErr.message);
    console.log("\n=== HASIL (Auth Berhasil, Firestore Terkendala Rules) ===");
    console.log("UID:", uid);
    console.log("Rencana Dokumen: users/" + uid);
    console.log("Isi Dokumen:", JSON.stringify(dataDokumen, null, 2));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
