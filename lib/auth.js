import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";

/**
 * Pendaftaran akun baru dengan email dan kata sandi (PRD 4.1)
 * Setiap akun baru otomatis berperan "karyawan" (PRD 2.2)
 */
export async function daftarDenganEmail(nama, email, kataSandi) {
  const emailBersih = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, emailBersih, kataSandi);
  const user = cred.user;

  const profil = {
    nama: nama.trim(),
    email: emailBersih,
    role: "karyawan",
  };
  await setDoc(doc(db, "users", user.uid), profil);

  return { user, profil };
}

/**
 * Masuk dengan email dan kata sandi (PRD 4.1)
 */
export async function masukDenganEmail(email, kataSandi) {
  const emailBersih = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, emailBersih, kataSandi);
  const user = cred.user;

  const ref = doc(db, "users", user.uid);
  const docSnap = await getDoc(ref);

  let profil = {
    nama: user.displayName || "Karyawan",
    email: user.email || emailBersih,
    role: "karyawan",
  };

  if (docSnap.exists()) {
    profil = docSnap.data();
  } else {
    await setDoc(ref, profil);
  }

  return { user, profil };
}

/**
 * Masuk dengan Akun Google (PRD 4.1)
 * Pengguna pertama kali otomatis dibuatkan profil "karyawan" tanpa menimpa profil lama.
 */
export async function masukDenganGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;

  const ref = doc(db, "users", user.uid);
  const docSnap = await getDoc(ref);

  let profil;
  if (docSnap.exists()) {
    profil = docSnap.data();
  } else {
    profil = {
      nama: user.displayName || "Karyawan",
      email: user.email || "",
      role: "karyawan",
    };
    await setDoc(ref, profil);
  }

  return { user, profil };
}

/**
 * Keluar dari akun (Sign Out)
 */
export async function keluar() {
  await signOut(auth);
}

/**
 * Menerjemahkan kode galat Firebase Auth ke pesan ramah bahasa Indonesia
 */
export function terjemahkanGalatAuth(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau kata sandi tidak cocok. Silakan periksa kembali.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/weak-password":
      return "Kata sandi terlalu pendek. Gunakan minimal 6 karakter.";
    case "auth/popup-closed-by-user":
      return "Jendela login Google ditutup sebelum selesai.";
    case "auth/popup-blocked":
      return "Jendela popup login diblokir oleh peramban. Mohon izinkan popup.";
    case "auth/operation-not-allowed":
      return "Metode masuk ini belum diaktifkan di konsol Firebase. Silakan aktifkan di menu Authentication -> Sign-in method.";
    case "auth/unauthorized-domain":
      return "Domain ini belum diizinkan di Firebase Authentication. Buka tab Settings -> Authorized domains di konsol Firebase.";
    case "auth/network-request-failed":
      return "Koneksi jaringan terputus. Periksa sambungan internet Anda.";
    default:
      return err?.message || "Terjadi kesalahan saat autentikasi. Silakan coba lagi.";
  }
}
