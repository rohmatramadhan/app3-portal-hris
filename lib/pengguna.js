import { useSyncExternalStore } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

// State global pengguna di sisi klien / Global client-side user state
let statePengguna = {
  pengguna: null,
  memuat: true,
};
const pendengar = new Set();

function beriTahu() {
  pendengar.forEach((fn) => fn());
}

export function perbaruiPenggunaLokal(dataBaru) {
  if (statePengguna.pengguna) {
    statePengguna = {
      ...statePengguna,
      pengguna: { ...statePengguna.pengguna, ...dataBaru },
    };
    beriTahu();
  }
}

// Inisialisasi pengamatan autentikasi Firebase
if (typeof window !== "undefined") {
  if (!isFirebaseConfigured) {
    // Jika kredensial Firebase belum terisi di .env.local, gunakan penanganan sementara
    statePengguna = {
      pengguna: null,
      memuat: false,
    };
  } else {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        statePengguna = { pengguna: null, memuat: false };
        beriTahu();
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          statePengguna = {
            pengguna: { uid: user.uid, ...snap.data() },
            memuat: false,
          };
        } else {
          // Prompt 5: Bila dokumen belum ada, buat dokumen dengan role "karyawan"
          // Khusus wulan@sedap.id per Prompt 6 diberikan role "hrd"
          const role = user.email?.toLowerCase() === "wulan@sedap.id" ? "hrd" : "karyawan";
          const dataAwal = {
            nama: user.displayName || user.email?.split("@")[0] || "Pengguna",
            email: user.email || "",
            role,
          };
          await setDoc(ref, dataAwal);
          statePengguna = {
            pengguna: { uid: user.uid, ...dataAwal },
            memuat: false,
          };
        }
      } catch (err) {
        console.error("Gagal memuat profil pengguna:", err);
        statePengguna = {
          pengguna: {
            uid: user.uid,
            nama: user.displayName || user.email?.split("@")[0] || "Pengguna",
            email: user.email || "",
            role: user.email?.toLowerCase() === "wulan@sedap.id" ? "hrd" : "karyawan",
          },
          memuat: false,
        };
      }
      beriTahu();
    });
  }
}

function langganan(callback) {
  pendengar.add(callback);
  return () => pendengar.delete(callback);
}

function ambilSnapshot() {
  return statePengguna;
}

/**
 * Hook autentikasi dan peran pengguna (Sesi 6).
 * Mengembalikan objek { pengguna, memuat }.
 */
export function usePengguna() {
  return useSyncExternalStore(langganan, ambilSnapshot, ambilSnapshot);
}

/**
 * Keluar dari akun (Sign Out)
 */
export async function keluar() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Gagal keluar:", err);
  }
  statePengguna = { pengguna: null, memuat: false };
  beriTahu();
}

