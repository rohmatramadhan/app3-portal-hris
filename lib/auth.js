import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";

/**
 * Mendaftarkan akun baru dengan email dan kata sandi (PRD 4.1).
 * Setiap akun baru otomatis berperan "karyawan" (PRD 2.2).
 */
export async function daftarDenganEmail(nama, email, kataSandi) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
  const user = credential.user;

  const profil = {
    nama: nama.trim(),
    email: user.email.toLowerCase(),
    role: "karyawan",
  };
  await setDoc(doc(db, "users", user.uid), profil);
  return { user, profil, role: profil.role };
}

/**
 * Masuk dengan email dan kata sandi (PRD 4.1).
 * Mengembalikan user dan role untuk pengalihan halaman.
 */
export async function masukDenganEmail(email, kataSandi) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
  const user = credential.user;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  let role = "karyawan";

  if (snap.exists()) {
    role = snap.data().role || "karyawan";
  } else {
    // Buat profil jika belum ada
    await setDoc(userRef, {
      nama: user.displayName || user.email?.split("@")[0] || "Karyawan",
      email: user.email,
      role: "karyawan",
    });
  }

  return { user, role };
}

/**
 * Masuk dengan Google via Popup (PRD 4.1).
 * Pengguna baru otomatis dibuatkan profil karyawan tanpa menimpa profil yang sudah ada.
 */
export async function masukDenganGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  let role = "karyawan";

  if (!snap.exists()) {
    const nama = user.displayName || user.email?.split("@")[0] || "Karyawan";
    await setDoc(userRef, {
      nama,
      email: user.email,
      role: "karyawan",
    });
  } else {
    role = snap.data().role || "karyawan";
  }

  return { user, role };
}

/**
 * Keluar dari Firebase Authentication
 */
export async function keluar() {
  await signOut(auth);
}
