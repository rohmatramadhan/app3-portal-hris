"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { pastikanProfilPengguna } from "./auth.js";

/**
 * Hook autentikasi dan profil pengguna dari Firebase Auth dan Firestore.
 * Mengembalikan objek { pengguna, memuat }.
 * Dokumen profil disinkronkan dan dibaca dari koleksi 'users/{uid}'.
 */
export function usePengguna() {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profil = await pastikanProfilPengguna(user);
          setPengguna(profil);
        } catch (e) {
          console.error("Gagal memeriksa atau membuat profil pengguna:", e);
          setPengguna({
            uid: user.uid,
            nama: user.displayName || user.email?.split("@")[0] || "Karyawan",
            email: user.email || "",
            role: "karyawan",
          });
        }
      } else {
        setPengguna(null);
      }
      setMemuat(false);
    });

    return () => unsub();
  }, []);

  return { pengguna, memuat };
}
