"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { pastikanProfilPengguna } from "@/lib/profilPengguna";
import KerangkaPublik from "@/components/KerangkaPublik";

/**
 * Halaman Daftar (PRD 4.1).
 * Tersambung ke Firebase Auth & membuat dokumen profil di users/{uid}
 * Setiap akun baru otomatis memiliki peran 'karyawan'.
 */
export default function HalamanDaftar() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!nama.trim()) g.nama = "Nama wajib diisi.";
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
      // 1. Buat user di Firebase Auth
      const kredensial = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
      const user = kredensial.user;

      // Update displayName di Auth
      await updateProfile(user, { displayName: nama.trim() });

      // 2. Pastikan profil di users/{uid} (hanya dibuat jika belum ada, tanpa kata sandi)
      await pastikanProfilPengguna(user, nama.trim());

      // 3. Arahkan ke Beranda
      router.replace("/beranda");
    } catch (err) {
      let pesanGalat = "Gagal mendaftar: " + err.message;
      if (err.code === "auth/email-already-in-use") {
        pesanGalat = "Email ini sudah terdaftar. Silakan masuk.";
      } else if (err.code === "auth/invalid-email") {
        pesanGalat = "Format email tidak valid.";
      } else if (err.code === "auth/weak-password") {
        pesanGalat = "Kata sandi terlalu lemah.";
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
      const profil = await pastikanProfilPengguna(hasil.user);
      const role = profil?.role || "karyawan";

      if (role === "hrd") {
        router.replace("/admin");
      } else {
        router.replace("/beranda");
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setPesan("Gagal masuk dengan Google: " + err.message);
      }
    } finally {
      setMemuat(false);
    }
  }

  return (
    <KerangkaPublik judul="Daftar">
      <form onSubmit={kirim} noValidate className="space-y-4">
        <div>
          <label htmlFor="nama" className="label">Nama</label>
          <input
            id="nama"
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            disabled={memuat}
            className="isian"
          />
          {galat.nama && <p className="galat">{galat.nama}</p>}
        </div>
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
            autoComplete="new-password"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            disabled={memuat}
            className="isian"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={memuat} className="tombol-utama w-full py-3 text-lg">
          {memuat ? "Memproses..." : "Daftar"}
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
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-sedap hover:underline">
          Masuk
        </Link>
      </p>
    </KerangkaPublik>
  );
}
