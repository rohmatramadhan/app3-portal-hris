"use client";

import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { pastikanProfilKaryawan } from "./data";

/**
 * Hook usePengguna membaca data pengguna dari Firebase Auth dan koleksi users/{uid} di Firestore.
 * Mengembalikan objek { pengguna, memuat }.
 * Bila belum login, pengguna bernilai null.
 */
export function usePengguna() {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (!user) {
        setPengguna(null);
        setMemuat(false);
        return;
      }

      // Pastikan dokumen users/{uid} ada tanpa menimpa bila sudah ada
      pastikanProfilKaryawan(user).catch((e) => console.warn("Pastikan profil:", e));

      const docRef = doc(db, "users", user.uid);
      unsubDoc = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setPengguna({
              uid: user.uid,
              nama: d.nama || user.displayName || user.email?.split("@")[0] || "Pengguna",
              email: d.email || user.email || "",
              role: d.role || "karyawan",
            });
          } else {
            setPengguna({
              uid: user.uid,
              nama: user.displayName || user.email?.split("@")[0] || "Pengguna",
              email: user.email || "",
              role: "karyawan",
            });
          }
          setMemuat(false);
        },
        (err) => {
          console.warn("Gagal membaca profil pengguna:", err);
          setMemuat(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return { pengguna, memuat };
}
