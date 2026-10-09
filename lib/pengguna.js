"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase.js";

/**
 * Hook usePengguna() yang terhubung ke Firebase Auth dan dokumen users/{uid}.
 * Mempertahankan bentuk keluaran { pengguna, memuat }.
 */
export function usePengguna() {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let unsubsDoc = null;

    const unsubsAuth = onAuthStateChanged(auth, (user) => {
      if (unsubsDoc) {
        unsubsDoc();
        unsubsDoc = null;
      }

      if (!user) {
        setPengguna(null);
        setMemuat(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      unsubsDoc = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setPengguna({
              uid: user.uid,
              nama: data.nama || user.displayName || "Karyawan",
              email: data.email || user.email || "",
              role: data.role || "karyawan",
            });
          } else {
            setPengguna({
              uid: user.uid,
              nama: user.displayName || user.email?.split("@")[0] || "Karyawan",
              email: user.email || "",
              role: "karyawan",
            });
          }
          setMemuat(false);
        },
        () => {
          setPengguna({
            uid: user.uid,
            nama: user.displayName || user.email?.split("@")[0] || "Karyawan",
            email: user.email || "",
            role: "karyawan",
          });
          setMemuat(false);
        }
      );
    });

    return () => {
      if (unsubsDoc) unsubsDoc();
      unsubsAuth();
    };
  }, []);

  return { pengguna, memuat };
}
