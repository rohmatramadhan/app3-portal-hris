"use client";

import { useSyncExternalStore } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

// Snapshot awal tunggal yang identik untuk Server dan Client sebelum hidrasi selesai
const SNAPSHOT_AWAL = {
  pengguna: null,
  memuat: true,
  authLoading: true,
  profilLoading: false,
  adaPenggunaAuth: false,
};

let statePengguna = null;
let stateAuthLoading = true;
let stateProfilLoading = false;
let stateAdaPenggunaAuth = false;
let snapshotSekarang = SNAPSHOT_AWAL;
const pendengar = new Set();
let unsubscribeAuth = null;
let unsubscribeDoc = null;
let sudahInisialisasi = false;

function kabariSemua() {
  const memuat = stateAuthLoading || (stateAdaPenggunaAuth && stateProfilLoading);
  snapshotSekarang = {
    pengguna: statePengguna,
    memuat,
    authLoading: stateAuthLoading,
    profilLoading: stateProfilLoading,
    adaPenggunaAuth: stateAdaPenggunaAuth,
  };
  pendengar.forEach((fn) => fn());
}

function mulaiSinkronisasi() {
  if (sudahInisialisasi || typeof window === "undefined") return;
  sudahInisialisasi = true;

  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeDoc) {
      unsubscribeDoc();
      unsubscribeDoc = null;
    }

    // 1. Status auth selesai diperiksa seketika
    stateAuthLoading = false;

    if (!user) {
      // User null: tidak ada query Firestore yang perlu ditunggu, langsung tuntaskan state
      statePengguna = null;
      stateAdaPenggunaAuth = false;
      stateProfilLoading = false;
      kabariSemua();
      return;
    }

    // 2. Ada user: tandai sesi auth aktif, ambil profil dan role dari Firestore
    stateAdaPenggunaAuth = true;
    stateProfilLoading = true;
    kabariSemua();

    unsubscribeDoc = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        stateProfilLoading = false;
        if (snap.exists()) {
          const data = snap.data();
          statePengguna = {
            uid: user.uid,
            nama: data.nama || user.displayName || "Karyawan",
            email: data.email || user.email || "",
            role: data.role || "karyawan",
          };
        } else {
          statePengguna = {
            uid: user.uid,
            nama: user.displayName || "Karyawan",
            email: user.email || "",
            role: "karyawan",
          };
        }
        kabariSemua();
      },
      (err) => {
        console.error("Gagal membaca profil pengguna dari Firestore:", err);
        stateProfilLoading = false;
        statePengguna = {
          uid: user.uid,
          nama: user.displayName || "Karyawan",
          email: user.email || "",
          role: "karyawan",
        };
        kabariSemua();
      }
    );
  });
}

// Inisialisasi sedini mungkin di peramban tanpa menunggu fase mount komponen
if (typeof window !== "undefined") {
  mulaiSinkronisasi();
}

const langgananKosong = () => () => {};

/**
 * Hook pendeteksi apakah hidrasi client telah selesai.
 * Mengembalikan false saat SSR dan hidrasi render pertama, true setelahnya.
 */
export function useIsClient() {
  return useSyncExternalStore(
    langgananKosong,
    () => true,
    () => false
  );
}

function langganan(callback) {
  mulaiSinkronisasi();
  pendengar.add(callback);
  return () => {
    pendengar.delete(callback);
  };
}

function ambilSnapshot() {
  return snapshotSekarang;
}

function ambilSnapshotServer() {
  return SNAPSHOT_AWAL;
}

/**
 * Hook penyedia data pengguna aktif, status authLoading, dan profilLoading (PRD 6.1, AGENTS.md).
 * Memisahkan status inisialisasi auth dengan status profil Firestore untuk redirect instan.
 */
export function usePengguna() {
  const store = useSyncExternalStore(langganan, ambilSnapshot, ambilSnapshotServer);
  const isClient = useIsClient();

  // Sebelum hidrasi selesai di browser, gunakan SNAPSHOT_AWAL yang identik dengan SSR
  if (!isClient) {
    return SNAPSHOT_AWAL;
  }

  return store;
}
