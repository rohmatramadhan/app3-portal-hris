"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { users as dataContohUsers } from "./dataContoh";

const PenggunaContext = createContext({
  pengguna: null,
  memuat: true,
});

/**
 * Penyedia konteks pengguna yang tersambung langsung ke Firebase Auth dan Cloud Firestore.
 * Menggunakan cache lokal untuk menghindari kedipan (glitch) saat halaman dimuat ulang.
 * Pengguna tetap masuk saat halaman dimuat ulang (PRD 6.1).
 */
export function PenyediaPengguna({ children }) {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPengguna(null);
        setMemuat(false);
        return;
      }

      try {
        // Ambil profil dari Firestore users/{uid}
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          const profil = {
            uid: user.uid,
            nama: data.nama || user.displayName || "Pengguna",
            email: data.email || user.email,
            role: data.role || "karyawan",
            ...data,
          };
          setPengguna(profil);
        } else {
          // Dokumen belum ada (misal login pertama via Google): buat profil baru (PRD 4.1 & 2.2)
          const dummy = dataContohUsers.find((u) => u.email === user.email);
          const initialRole = dummy?.role || "karyawan";
          const initialNama = dummy?.nama || user.displayName || (user.email ? user.email.split("@")[0] : "Pengguna");

          const dataBaru = {
            nama: initialNama,
            email: user.email || "",
            role: initialRole,
          };

          try {
            await setDoc(userRef, dataBaru, { merge: true });
          } catch (err) {
            console.warn("Menyimpan dokumen users Firestore belum diizinkan:", err.message);
          }

          const profil = {
            uid: user.uid,
            ...dataBaru,
          };
          setPengguna(profil);
        }
      } catch (err) {
        console.warn("Gagal membaca profil dari Firestore, memakai data fallback:", err.message);
        const dummy = dataContohUsers.find((u) => u.email === user.email);
        const profil = {
          uid: user.uid,
          nama: dummy?.nama || user.displayName || (user.email ? user.email.split("@")[0] : "Pengguna"),
          email: user.email,
          role: dummy?.role || "karyawan",
        };
        setPengguna(profil);
      } finally {
        setMemuat(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <PenggunaContext.Provider value={{ pengguna, memuat }}>
      {children}
    </PenggunaContext.Provider>
  );
}

/**
 * Hook usePengguna() mengembalikan { pengguna, memuat } sesuai panduan AGENTS.md
 */
export function usePengguna() {
  return useContext(PenggunaContext);
}
