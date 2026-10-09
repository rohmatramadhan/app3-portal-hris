"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { pastikanProfilPengguna } from "@/lib/profilPengguna";
import KerangkaPublik from "@/components/KerangkaPublik";

/**
 * Halaman Masuk (PRD 4.1).
 * Tersambung ke Firebase Auth & diarahkan sesuai peran:
 * - Karyawan diarahkan ke /beranda
 * - HRD diarahkan ke /admin
 */
export default function HalamanMasuk() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  async function arahkanSesuaiPeran(user) {
    const profil = await pastikanProfilPengguna(user);
    const role = profil?.role || "karyawan";
    if (role === "hrd") {
      router.replace("/admin");
    } else {
      router.replace("/beranda");
    }
  }

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) {
      setPesan("");
      return;
    }

    setMemuat(true);
    setPesan("");

    try {
      const kredensial = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      await arahkanSesuaiPeran(kredensial.user);
    } catch (err) {
      let pesanGalat = "Gagal masuk: " + err.message;
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        pesanGalat = "Email atau kata sandi salah.";
      } else if (err.code === "auth/invalid-email") {
        pesanGalat = "Format email tidak valid.";
      } else if (err.code === "auth/too-many-requests") {
        pesanGalat = "Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.";
      }
      setPesan(pesanGalat);
    } finally {
      setMemuat(false);
    }
  }

  async function masukGoogle() {
    setMemuat(true);
    setPesan("");
    try {
      const provider = new GoogleAuthProvider();
      const hasil = await signInWithPopup(auth, provider);
      await arahkanSesuaiPeran(hasil.user);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setPesan("Gagal masuk dengan Google: " + err.message);
      }
    } finally {
      setMemuat(false);
    }
  }

  return (
    <KerangkaPublik judul="Masuk">
      <form onSubmit={kirim} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={memuat}
            className="isian"
          />
          {galat.email && <p className="galat">{galat.email}</p>}
        </div>
        <div>
          <label htmlFor="kataSandi" className="label">Kata sandi</label>
          <input
            id="kataSandi"
            type="password"
            autoComplete="current-password"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            disabled={memuat}
            className="isian"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={memuat} className="tombol-utama w-full py-3 text-lg">
          {memuat ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button type="button" onClick={masukGoogle} disabled={memuat} className="tombol-kedua w-full py-3">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-kunyit text-sm font-bold text-tinta">G</span>
        Masuk dengan Google
      </button>

      {pesan && (
        <p role="status" className="mt-5 rounded-xl border border-menunggu bg-menunggu/15 p-3 text-sm font-bold text-tinta">
          {pesan}
        </p>
      )}

      <p className="mt-6 text-center text-sm font-medium text-redup">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-sedap hover:underline">
          Daftar
        </Link>
      </p>
    </KerangkaPublik>
  );
}
