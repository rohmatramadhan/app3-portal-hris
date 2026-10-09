import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { users as dataContohUsers } from "./dataContoh";

/**
 * Menerjemahkan kode galat Firebase Auth ke pesan bahasa Indonesia yang ramah pengguna.
 */
export function terjemahkanGalatAuth(kode) {
  switch (kode) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email atau kata sandi salah.";
    case "auth/email-already-in-use":
      return "Email sudah terdaftar. Silakan masuk.";
    case "auth/weak-password":
      return "Kata sandi minimal 6 karakter.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/popup-closed-by-user":
      return "Jendela login Google ditutup sebelum selesai.";
    case "auth/popup-blocked":
      return "Jendela popup Google diblokir oleh peramban.";
    default:
      return "Terjadi kesalahan saat menghubungi server. Silakan coba lagi.";
  }
}

/**
 * Menyimpan profil pengguna di Firestore users/{uid}.
 * Profil yang sudah ada TIDAK akan ditimpa role-nya (PRD 4.1).
 */
async function sinkronkanProfilUser(user, namaKustom = null) {
  const userRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // Cek apakah email pengguna cocok dengan salah satu data dummy awal (misal wulan@sedap.id adalah hrd)
      const dataAwal = dataContohUsers.find((u) => u.email === user.email);
      const role = dataAwal?.role || "karyawan";
      const nama = namaKustom || user.displayName || dataAwal?.nama || (user.email ? user.email.split("@")[0] : "Pengguna");

      await setDoc(userRef, {
        nama,
        email: user.email,
        role,
      }, { merge: true });
    }
  } catch (err) {
    console.warn("Sinkronisasi profil Firestore belum diizinkan oleh Rules:", err.message);
  }
}

/**
 * Masuk menggunakan email dan kata sandi (PRD 4.1)
 */
export async function masukDenganEmail(email, kataSandi) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
  await sinkronkanProfilUser(cred.user);
  return cred.user;
}

/**
 * Mendaftar akun baru dengan email dan kata sandi (PRD 4.1).
 * Otomatis berperan "karyawan" (PRD 2.2).
 */
export async function daftarDenganEmail(nama, email, kataSandi) {
  const namaBersih = nama.trim();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);

  // Perbarui display name di Auth
  if (namaBersih) {
    try {
      await updateProfile(cred.user, { displayName: namaBersih });
    } catch (e) {
      // Abaikan jika gagal update profile auth
    }
  }

  // Simpan profil di koleksi users
  await sinkronkanProfilUser(cred.user, namaBersih);
  return cred.user;
}

/**
 * Masuk atau daftar dengan Google menggunakan popup (PRD 4.1)
 */
export async function masukDenganGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await sinkronkanProfilUser(cred.user);
  return cred.user;
}

/**
 * Keluar dari aplikasi
 */
export async function keluar() {
  return signOut(auth);
}

