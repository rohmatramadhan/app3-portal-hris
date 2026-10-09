"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { singkronkanPengguna } from "./data";

const PenggunaContext = createContext({
  pengguna: null,
  memuat: true,
  keluar: async () => {},
});

/**
 * Penyedia data pengguna autentikasi dan profil Firestore.
 * Membaca keadaan masuk dari Firebase Auth dan profil dari koleksi users/{uid}.
 */
export function PenggunaProvider({ children }) {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let unsubsSnapshot = null;

    const unsubsAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubsSnapshot) {
        unsubsSnapshot();
        unsubsSnapshot = null;
      }

      if (!user) {
        setPengguna(null);
        setMemuat(false);
        return;
      }

      // Pastikan dokumen pengguna disinkronkan
      try {
        await singkronkanPengguna(user);
      } catch (err) {
        console.warn("Pemeriksaan sinkronisasi pengguna:", err);
      }

      const docRef = doc(db, "users", user.uid);

      // Dengarkan dokumen users/{uid} secara realtime / Listen to users/{uid} in real-time
      unsubsSnapshot = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPengguna({
              uid: user.uid,
              nama: data.nama || user.displayName || "Pengguna",
              email: data.email || user.email,
              role: data.role || "karyawan",
            });
          } else {
            setPengguna({
              uid: user.uid,
              nama: user.displayName || "Pengguna",
              email: user.email,
              role: "karyawan",
            });
          }
          setMemuat(false);
        },
        (error) => {
          console.error("Gagal memuat profil pengguna dari Firestore:", error);
          setPengguna({
            uid: user.uid,
            nama: user.displayName || "Pengguna",
            email: user.email,
            role: "karyawan",
          });
          setMemuat(false);
        }
      );
    });

    return () => {
      unsubsAuth();
      if (unsubsSnapshot) unsubsSnapshot();
    };
  }, []);

  async function keluar() {
    await firebaseSignOut(auth);
  }

  return (
    <PenggunaContext.Provider value={{ pengguna, memuat, keluar }}>
      {children}
    </PenggunaContext.Provider>
  );
}

export function usePengguna() {
  return useContext(PenggunaContext);
}
