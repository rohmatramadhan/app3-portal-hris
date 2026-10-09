"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";

/**
 * Hook untuk memantau keadaan masuk pengguna dan mengambil profil dari Firestore.
 * Mengembalikan objek { pengguna, memuat }.
 */
export function usePengguna() {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    const batal = onAuthStateChanged(auth, async (userAuth) => {
      if (!userAuth) {
        setPengguna(null);
        setMemuat(false);
        return;
      }

      try {
        const userRef = doc(db, "users", userAuth.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setPengguna({
            uid: userAuth.uid,
            email: userAuth.email || data.email,
            nama: data.nama || userAuth.displayName || "Karyawan",
            role: data.role || "karyawan",
          });
        } else {
          // Bila pengguna belum punya dokumen profil (mis. login Google pertama kali)
          const profilBaru = {
            nama: userAuth.displayName || userAuth.email?.split("@")[0] || "Karyawan",
            email: userAuth.email || "",
            role: "karyawan",
          };
          await setDoc(userRef, profilBaru);
          setPengguna({
            uid: userAuth.uid,
            ...profilBaru,
          });
        }
      } catch (err) {
        console.error("Gagal membaca profil pengguna Firestore:", err);
        setPengguna(null);
      } finally {
        setMemuat(false);
      }
    });

    return () => batal();
  }, []);

  return { pengguna, memuat };
}

/**
 * Masuk menggunakan email dan kata sandi.
 * Mengembalikan objek profil { uid, nama, email, role }.
 */
export async function masukDenganEmail(email, kataSandi) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
  const uid = cred.user.uid;

  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const data = snap.data();
    return {
      uid,
      nama: data.nama,
      email: cred.user.email,
      role: data.role || "karyawan",
    };
  }

  // Jika belum ada dokumen profil
  const profilBaru = {
    nama: cred.user.displayName || email.split("@")[0],
    email: cred.user.email,
    role: "karyawan",
  };
  await setDoc(doc(db, "users", uid), profilBaru);
  return { uid, ...profilBaru };
}

/**
 * Mendaftar akun baru menggunakan nama, email, dan kata sandi.
 * Otomatis membuat dokumen profil di koleksi users dengan role "karyawan".
 */
export async function daftarDenganEmail(nama, email, kataSandi) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
  const uid = cred.user.uid;

  const profil = {
    nama: nama.trim(),
    email: email.trim(),
    role: "karyawan",
  };
  await setDoc(doc(db, "users", uid), profil);

  return { uid, ...profil };
}

/**
 * Masuk menggunakan akun Google lewat pop-up.
 * Jika login untuk pertama kali, profil akan dibuatkan otomatis dengan role "karyawan".
 */
export async function masukDenganGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const uid = cred.user.uid;

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      uid,
      nama: data.nama || cred.user.displayName,
      email: cred.user.email,
      role: data.role || "karyawan",
    };
  }

  const profilBaru = {
    nama: cred.user.displayName || cred.user.email?.split("@")[0] || "Karyawan",
    email: cred.user.email || "",
    role: "karyawan",
  };
  await setDoc(userRef, profilBaru);
  return { uid, ...profilBaru };
}

/**
 * Keluar dari sesi Firebase Auth.
 */
export async function keluar() {
  await signOut(auth);
}
