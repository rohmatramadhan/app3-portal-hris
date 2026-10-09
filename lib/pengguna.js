"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { pastikanProfilPengguna } from "./profilPengguna";

// State global klien agar data sesi tidak reset saat navigasi halaman
let penggunaCache = null;
let memuatCache = true;
let inisialisasi = false;
let unsubsDoc = null;
const pelanggan = new Set();

function beriTahuSemua() {
  pelanggan.forEach((cb) => cb({ pengguna: penggunaCache, memuat: memuatCache }));
}

function inisialisasiAuthGlobal() {
  if (inisialisasi || typeof window === "undefined") return;
  inisialisasi = true;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (unsubsDoc) {
        unsubsDoc();
        unsubsDoc = null;
      }
      penggunaCache = null;
      memuatCache = false;
      beriTahuSemua();
      return;
    }

    // Pastikan dokumen profil ada di users/{uid} tanpa menimpa data yang sudah ada
    try {
      await pastikanProfilPengguna(user);
    } catch (err) {
      console.error("Gagal memastikan profil:", err);
    }

    // Jika sudah ada user, dengarkan dokumen users/{uid}
    const ref = doc(db, "users", user.uid);
    if (unsubsDoc) unsubsDoc();

    unsubsDoc = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          penggunaCache = {
            uid: user.uid,
            nama: data.nama || user.displayName || "Pengguna",
            email: data.email || user.email,
            role: data.role || "karyawan",
          };
        } else {
          penggunaCache = {
            uid: user.uid,
            nama: user.displayName || "Pengguna",
            email: user.email,
            role: "karyawan",
          };
        }
        memuatCache = false;
        beriTahuSemua();
      },
      (err) => {
        console.error("Gagal membaca profil:", err);
        penggunaCache = {
          uid: user.uid,
          nama: user.displayName || "Pengguna",
          email: user.email,
          role: "karyawan",
        };
        memuatCache = false;
        beriTahuSemua();
      }
    );
  });
}

/**
 * Hook usePengguna()
 * Mengembalikan { pengguna, memuat, keluar } yang konsisten di semua halaman.
 */
export function usePengguna() {
  const [state, setState] = useState({
    pengguna: penggunaCache,
    memuat: memuatCache,
  });

  useEffect(() => {
    inisialisasiAuthGlobal();

    const perbarui = (data) => setState(data);
    pelanggan.add(perbarui);

    // Sinkronkan state saat ini
    setState({ pengguna: penggunaCache, memuat: memuatCache });

    return () => {
      pelanggan.delete(perbarui);
    };
  }, []);

  const keluar = async () => {
    await signOut(auth);
  };

  return { pengguna: state.pengguna, memuat: state.memuat, keluar };
}
