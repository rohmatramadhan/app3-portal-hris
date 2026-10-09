import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";

/**
 * Memeriksa dokumen 'users/{uid}' di Firestore setelah pengguna masuk dengan cara apa pun.
 * - Bila belum ada: buat dokumen berisi nama, email, dan role "karyawan".
 * - Bila sudah ada: jangan diubah (mempertahankan data dan peran yang tersimpan).
 * - Tidak menyimpan kata sandi.
 */
export async function pastikanProfilPengguna(user, namaKustom = null) {
  if (!user || !user.uid) return null;
  const profilRef = doc(db, "users", user.uid);
  const snap = await getDoc(profilRef);

  if (snap.exists()) {
    // Bila sudah ada, jangan diubah
    return {
      uid: user.uid,
      ...snap.data(),
    };
  }

  // Bila belum ada, buat dokumen baru
  const nama = namaKustom || user.displayName || user.email?.split("@")[0] || "Karyawan";
  const dataProfil = {
    nama,
    email: user.email || "",
    role: "karyawan",
  };

  await setDoc(profilRef, dataProfil);

  return {
    uid: user.uid,
    ...dataProfil,
  };
}

/**
 * Mendaftarkan akun baru dengan Email dan Kata Sandi.
 */
export async function daftarDenganEmail(email, kataSandi, nama) {
  const cred = await createUserWithEmailAndPassword(auth, email, kataSandi);
  if (nama) {
    await updateProfile(cred.user, { displayName: nama }).catch(() => {});
  }

  const profil = await pastikanProfilPengguna(cred.user, nama);
  return { user: cred.user, role: profil?.role || "karyawan" };
}

/**
 * Masuk dengan Email dan Kata Sandi.
 */
export async function masukDenganEmail(email, kataSandi) {
  const cred = await signInWithEmailAndPassword(auth, email, kataSandi);
  const profil = await pastikanProfilPengguna(cred.user);
  return { user: cred.user, role: profil?.role || "karyawan" };
}

/**
 * Masuk dengan Akun Google (Popup).
 */
export async function masukDenganGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const profil = await pastikanProfilPengguna(cred.user);
  return { user: cred.user, role: profil?.role || "karyawan" };
}

/**
 * Keluar dari akun.
 */
export async function keluar() {
  await signOut(auth);
}
