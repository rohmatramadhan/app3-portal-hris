import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Memastikan dokumen users/{uid} ada di Firestore setelah pengguna berhasil masuk
 * dengan cara apa pun (Email/Password, Google, dsb).
 * 
 * Aturan:
 * 1. Bila dokumen BELUM ada: buat dokumen baru berisi nama, email, dan role: "karyawan".
 * 2. Bila dokumen SUDAH ada: JANGAN diubah (tetap pertahankan nama, email, dan role yang sudah ada).
 * 3. JANGAN simpan kata sandi di dokumen ini.
 * 
 * @param {import("firebase/auth").User} user Objek User dari Firebase Auth
 * @param {string} [namaInput] Nama opsional dari formulir pendaftaran
 * @returns {Promise<{ role: string, nama: string, email: string }>} Data profil pengguna
 */
export async function pastikanProfilPengguna(user, namaInput = "") {
  if (!user || !user.uid) return null;

  const userDocRef = doc(db, "users", user.uid);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    // Dokumen belum ada, buat baru
    const dataBaru = {
      nama: (namaInput || user.displayName || user.email?.split("@")[0] || "Karyawan").trim(),
      email: user.email || "",
      role: "karyawan",
    };
    await setDoc(userDocRef, dataBaru);
    return dataBaru;
  }

  // Dokumen sudah ada, jangan ubah apa pun
  return snap.data();
}
