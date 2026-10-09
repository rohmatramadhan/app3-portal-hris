"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "./firebase";

/**
 * Hook untuk memantau status autentikasi dan profil pengguna dari Firestore users/{uid}.
 * Mempertahankan bentuk keluaran { pengguna, memuat }.
 */
export function usePengguna() {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (!user) {
        setPengguna(null);
        setMemuat(false);
        return;
      }

      const docRef = doc(db, "users", user.uid);
      unsubscribeDoc = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setPengguna({
              uid: user.uid,
              nama: data.nama || user.displayName || user.email?.split("@")[0] || "Pengguna",
              email: data.email || user.email,
              role: data.role || "karyawan",
            });
          } else {
            // Dokumen belum dibuat atau sedang dibuat
            setPengguna({
              uid: user.uid,
              nama: user.displayName || user.email?.split("@")[0] || "Pengguna",
              email: user.email,
              role: "karyawan",
            });
          }
          setMemuat(false);
        },
        (err) => {
          console.error("Gagal membaca profil dari Firestore:", err);
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
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return { pengguna, memuat };
}

export async function keluar() {
  await signOut(auth);
}
