"use client";

import { useSyncExternalStore } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const SNAPSHOT_AWAL = Object.freeze({
  pengguna: null,
  memuat: true,
});

function bacaCacheAwal() {
  if (typeof window === "undefined") return SNAPSHOT_AWAL;
  try {
    const raw = sessionStorage.getItem("sedap_pengguna");
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.uid && data.role) {
        return { pengguna: data, memuat: false };
      }
    }
  } catch {
    // Abaikan galat parsing
  }
  return SNAPSHOT_AWAL;
}

function simpanCache(pengguna) {
  if (typeof window === "undefined") return;
  try {
    if (pengguna) {
      sessionStorage.setItem("sedap_pengguna", JSON.stringify(pengguna));
    } else {
      sessionStorage.removeItem("sedap_pengguna");
    }
  } catch {
    // Abaikan galat penyimpanan
  }
}

let stateGlobal = bacaCacheAwal();

const pendengar = new Set();
let authDiinisialisasi = false;
let batalkanDokumen = null;

function beritahuSemua() {
  pendengar.forEach((cb) => cb());
}

function inisialisasiAuth() {
  if (authDiinisialisasi) return;
  authDiinisialisasi = true;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (batalkanDokumen) {
        batalkanDokumen();
        batalkanDokumen = null;
      }
      simpanCache(null);
      stateGlobal = { pengguna: null, memuat: false };
      beritahuSemua();
      return;
    }

    const refUser = doc(db, "users", user.uid);
    if (batalkanDokumen) batalkanDokumen();

    // 1. Baca dokumen secepat mungkin (memanfaatkan cache Firestore)
    try {
      const snapAwal = await getDoc(refUser);
      if (snapAwal.exists()) {
        const data = snapAwal.data();
        const profil = {
          uid: user.uid,
          nama: data.nama || user.displayName || "Karyawan",
          email: data.email || user.email,
          role: data.role || "karyawan",
        };
        simpanCache(profil);
        stateGlobal = {
          pengguna: profil,
          memuat: false,
        };
        beritahuSemua();
      }
    } catch {
      // Abaikan jika offline/pending, onSnapshot di bawah akan menangani
    }

    batalkanDokumen = onSnapshot(
      refUser,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const profil = {
            uid: user.uid,
            nama: data.nama || user.displayName || "Karyawan",
            email: data.email || user.email,
            role: data.role || "karyawan",
          };
          simpanCache(profil);
          stateGlobal = {
            pengguna: profil,
            memuat: false,
          };
        } else {
          // Dokumen belum ada (misal login pertama kali), buatkan otomatis di Firestore
          setDoc(
            refUser,
            {
              nama: user.displayName || "Karyawan",
              email: user.email || "",
              role: "karyawan",
            },
            { merge: true }
          ).catch((err) => {
            console.error("Gagal membuat dokumen pengguna di Firestore:", err);
          });

          const profil = {
            uid: user.uid,
            nama: user.displayName || "Karyawan",
            email: user.email,
            role: "karyawan",
          };
          simpanCache(profil);
          stateGlobal = {
            pengguna: profil,
            memuat: false,
          };
        }
        beritahuSemua();
      },
      (error) => {
        console.error("Gagal membaca profil pengguna dari Firestore:", error);
        const profil = {
          uid: user.uid,
          nama: user.displayName || "Karyawan",
          email: user.email,
          role: "karyawan",
        };
        simpanCache(profil);
        stateGlobal = {
          pengguna: profil,
          memuat: false,
        };
        beritahuSemua();
      }
    );
  });
}

function langganan(callback) {
  inisialisasiAuth();
  pendengar.add(callback);
  if (stateGlobal !== SNAPSHOT_AWAL) {
    queueMicrotask(callback);
  }
  return () => {
    pendengar.delete(callback);
  };
}

function ambilSnapshot() {
  return stateGlobal;
}

function ambilSnapshotServer() {
  return SNAPSHOT_AWAL;
}

/**
 * Hook usePengguna() membaca data dari Firebase Auth dan dokumen users/{uid}.
 * Mempertahankan bentuk keluaran { pengguna, memuat }.
 */
export function usePengguna() {
  const state = useSyncExternalStore(langganan, ambilSnapshot, ambilSnapshotServer);

  const keluar = async () => {
    simpanCache(null);
    await signOut(auth);
  };

  return { pengguna: state.pengguna, memuat: state.memuat, keluar };
}
