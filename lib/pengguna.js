"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

let stateGlobal = {
  pengguna: null,
  memuat: true,
};
const pendengar = new Set();

function beriTahu() {
  pendengar.forEach((fn) => fn({ ...stateGlobal }));
}

// Inisialisasi pendengar auth di sisi peramban
if (typeof window !== "undefined") {
  let unsubDoc = null;
  onAuthStateChanged(auth, (user) => {
    if (unsubDoc) {
      unsubDoc();
      unsubDoc = null;
    }
    if (!user) {
      stateGlobal = { pengguna: null, memuat: false };
      beriTahu();
      return;
    }

    // Selama role belum selesai dibaca dari users/{uid}, pastikan memuat tetap true
    stateGlobal = { pengguna: null, memuat: true };
    beriTahu();

    // Dengarkan dokumen users/{uid} secara langsung agar pembaruan nama atau peran langsung terlihat
    const userRef = doc(db, "users", user.uid);
    unsubDoc = onSnapshot(
      userRef,
      async (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          stateGlobal = {
            pengguna: {
              uid: user.uid,
              nama: d.nama || user.displayName || user.email?.split("@")[0] || "Karyawan",
              email: user.email,
              role: d.role || "karyawan",
            },
            memuat: false,
          };
        } else {
          // Buat dokumen pengguna baru jika belum ada
          const nama = user.displayName || user.email?.split("@")[0] || "Karyawan";
          const dataPengguna = { nama, email: user.email, role: "karyawan" };
          try {
            await setDoc(userRef, dataPengguna);
          } catch (e) {
            console.error("Gagal membuat dokumen pengguna:", e);
          }
          stateGlobal = {
            pengguna: {
              uid: user.uid,
              ...dataPengguna,
            },
            memuat: false,
          };
        }
        beriTahu();
      },
      (err) => {
        console.error("Gagal mendengarkan profil pengguna:", err);
        stateGlobal = {
          pengguna: {
            uid: user.uid,
            nama: user.displayName || user.email?.split("@")[0] || "Karyawan",
            email: user.email,
            role: "karyawan",
          },
          memuat: false,
        };
        beriTahu();
      }
    );
  });
}

/**
 * Hook autentikasi dan profil pengguna aktif.
 * Mengembalikan { pengguna, memuat }
 */
export function usePengguna() {
  const [keadaan, setKeadaan] = useState(stateGlobal);

  useEffect(() => {
    setKeadaan(stateGlobal);
    pendengar.add(setKeadaan);
    return () => {
      pendengar.delete(setKeadaan);
    };
  }, []);

  return keadaan;
}

/**
 * Fungsi keluar dari Firebase Auth
 */
export async function keluar() {
  await signOut(auth);
}
