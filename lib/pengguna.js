"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

/**
 * Context untuk menyimpan data pengguna yang sedang login beserta status memuat.
 * Di Sesi 6, data dibaca langsung dari Firebase Auth dan koleksi users/{uid} di Firestore.
 */
const PenggunaContext = createContext({
  pengguna: null,
  memuat: true,
  keluar: async () => {},
  setPengguna: () => {},
});

export function PenggunaProvider({ children }) {
  const [pengguna, setPengguna] = useState(() => {
    if (!isFirebaseConfigured && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hris_pengguna_aktif");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [memuat, setMemuat] = useState(() => isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPengguna(null);
        setMemuat(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // Dokumen sudah ada: biarkan, jangan diubah (Prompt 5)
          const data = userSnap.data();
          setPengguna({
            uid: user.uid,
            nama: data.nama || user.displayName || user.email?.split("@")[0] || "Pengguna",
            email: data.email || user.email || "",
            role: data.role || "karyawan",
          });
        } else {
          // Prompt 5: Dokumen belum ada, buat baru dengan nama, email, role "karyawan"
          const namaPengguna = user.displayName || user.email?.split("@")[0] || "Pengguna";
          const dataBaru = {
            nama: namaPengguna,
            email: user.email || "",
            role: "karyawan",
          };
          await setDoc(userRef, dataBaru);
          setPengguna({
            uid: user.uid,
            ...dataBaru,
          });
        }
      } catch (err) {
        console.error("Gagal memeriksa/membuat profil user di Firestore:", err);
        // Fallback agar aplikasi tetap dapat dibuka
        setPengguna({
          uid: user.uid,
          nama: user.displayName || user.email?.split("@")[0] || "Pengguna",
          email: user.email || "",
          role: "karyawan",
        });
      } finally {
        setMemuat(false);
      }
    });

    return () => unsub();
  }, []);

  async function keluar() {
    if (isFirebaseConfigured) {
      await firebaseSignOut(auth);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("hris_pengguna_aktif");
      }
      setPengguna(null);
    }
  }

  function perbaruiPengguna(data) {
    setPengguna(data);
    if (!isFirebaseConfigured && typeof window !== "undefined") {
      if (data) {
        localStorage.setItem("hris_pengguna_aktif", JSON.stringify(data));
      } else {
        localStorage.removeItem("hris_pengguna_aktif");
      }
    }
  }

  return (
    <PenggunaContext.Provider value={{ pengguna, memuat, keluar, setPengguna: perbaruiPengguna }}>
      {children}
    </PenggunaContext.Provider>
  );
}

/**
 * Hook usePengguna() mengembalikan { pengguna, memuat, keluar, setPengguna }
 * Bentuk keluaran { pengguna, memuat } tetap dipertahankan sesuai AGENTS.md.
 */
export function usePengguna() {
  return useContext(PenggunaContext);
}
