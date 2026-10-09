"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const PenggunaContext = createContext({
  pengguna: null,
  memuat: true,
  keluar: async () => {},
  segarkan: async () => {},
});

export function PenggunaProvider({ children }) {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  async function bacaProfil(user) {
    if (!user) {
      setPengguna(null);
      setMemuat(false);
      return;
    }

    setMemuat(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        // Bila dokumen sudah ada, jangan diubah datanya
        const data = snap.data();
        setPengguna({
          uid: user.uid,
          nama: data.nama,
          email: data.email || user.email,
          role: data.role || "karyawan",
        });
      } else {
        // Bila belum ada, buat dokumen berisi nama, email, dan role "karyawan" (tanpa kata sandi)
        const nama = user.displayName || user.email?.split("@")[0] || "Pengguna";
        const email = user.email || "";
        const profilBaru = {
          nama,
          email,
          role: "karyawan",
        };
        await setDoc(userRef, profilBaru);
        setPengguna({
          uid: user.uid,
          ...profilBaru,
        });
      }
    } catch (err) {
      console.error("Gagal membaca profil pengguna:", err);
      // Fallback agar tidak macet
      setPengguna({
        uid: user.uid,
        email: user.email,
        nama: user.displayName || user.email?.split("@")[0] || "Pengguna",
        role: "karyawan",
      });
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      bacaProfil(user);
    });
    return () => unsub();
  }, []);

  const keluar = async () => {
    await signOut(auth);
    setPengguna(null);
  };

  const segarkan = async () => {
    if (auth.currentUser) {
      await bacaProfil(auth.currentUser);
    }
  };

  return (
    <PenggunaContext.Provider value={{ pengguna, memuat, keluar, segarkan }}>
      {children}
    </PenggunaContext.Provider>
  );
}

export function usePengguna() {
  const context = useContext(PenggunaContext);
  return context;
}
