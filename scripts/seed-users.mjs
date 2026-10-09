import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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
const db = getFirestore(app);
const auth = getAuth(app);

const dummyUsers = [
  { id: "dina", nama: "Dina", email: "dina@sedap.id", role: "karyawan" },
  { id: "nisa", nama: "Nisa", email: "nisa@sedap.id", role: "karyawan" },
  { id: "wulan", nama: "Wulan", email: "wulan@sedap.id", role: "hrd" },
  { id: "rama", nama: "Rama", email: "rama@sedap.id", role: "karyawan" },
  { id: "sari", nama: "Sari", email: "sari@sedap.id", role: "karyawan" },
  { id: "budi", nama: "Budi", email: "budi@sedap.id", role: "karyawan" },
  { id: "ayu", nama: "Ayu", email: "ayu@sedap.id", role: "karyawan" },
  { id: "joko", nama: "Joko", email: "joko@sedap.id", role: "karyawan" },
];

const DEFAULT_PASSWORD = "password123";

async function seed() {
  console.log("Menghubungkan ke Firebase:", firebaseConfig.projectId);

  console.log(`\n--- Mendaftarkan Akun ke Firebase Auth (password: ${DEFAULT_PASSWORD}) ---`);
  for (const u of dummyUsers) {
    let uid = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, DEFAULT_PASSWORD);
      uid = cred.user.uid;
      console.log(`✓ Akun Auth dibuat: ${u.email} (UID: ${uid})`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        console.log(`ℹ Akun Auth ${u.email} sudah ada, mencoba login untuk mendapatkan UID...`);
        try {
          const cred = await signInWithEmailAndPassword(auth, u.email, DEFAULT_PASSWORD);
          uid = cred.user.uid;
          console.log(`✓ Berhasil login: ${u.email} (UID: ${uid})`);
        } catch (loginErr) {
          console.warn(`! Gagal login untuk ${u.email}: ${loginErr.message}`);
        }
      } else {
        console.warn(`! Gagal membuat akun ${u.email}: ${err.code} ${err.message}`);
      }
    }

    if (uid) {
      try {
        const authUserDocRef = doc(db, "users", uid);
        await setDoc(authUserDocRef, {
          nama: u.nama,
          email: u.email,
          role: u.role,
        }, { merge: true });
        console.log(`✓ Firestore users/${uid} (${u.nama} - ${u.role}) tersimpan`);
      } catch (docErr) {
        console.warn(`! Gagal menyimpan users/${uid} di Firestore: ${docErr.code} ${docErr.message}`);
      }
    }
  }

  process.exit(0);
}


seed().catch((err) => {
  console.error("Gagal melakukan seed:", err);
  process.exit(1);
});
