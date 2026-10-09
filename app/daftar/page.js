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
import { singkronkanPengguna } from "@/lib/data";
import KerangkaPublik from "@/components/KerangkaPublik";

function terjemahkanGalat(err) {
  switch (err?.code) {
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/weak-password":
      return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    case "auth/popup-closed-by-user":
      return "Jendela pendaftaran Google ditutup sebelum selesai.";
    case "auth/operation-not-allowed":
      return "Metode pendaftaran ini belum diaktifkan di Firebase Console.";
    case "auth/unauthorized-domain":
      return "Domain ini belum didaftarkan di Authorized Domains Firebase Console.";
    default:
      return err?.message || "Terjadi kesalahan saat pendaftaran.";
  }
}

// Halaman Daftar (PRD 4.1) / Sign-up page (PRD 4.1)
export default function HalamanDaftar() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

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

    setSedangProses(true);
    setPesan("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
      const user = userCred.user;

      try {
        await updateProfile(user, { displayName: nama.trim() });
      } catch (profileErr) {
        console.warn("Gagal memperbarui displayName auth:", profileErr);
      }

      // Sinkronkan dokumen profil ke users/{uid} dan hapus placeholder lama jika ada
      await singkronkanPengguna(user, nama.trim());

      router.push("/beranda");
    } catch (err) {
      setPesan(terjemahkanGalat(err));
    } finally {
      setSedangProses(false);
    }
  }

  async function masukGoogle() {
    setSedangProses(true);
    setPesan("");
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      // Sinkronkan dokumen profil ke users/{uid} dan hapus placeholder lama jika ada
      await singkronkanPengguna(user);

      router.push("/beranda");
    } catch (err) {
      setPesan(terjemahkanGalat(err));
    } finally {
      setSedangProses(false);
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
            className="isian"
            disabled={sedangProses}
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
            className="isian"
            disabled={sedangProses}
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
            className="isian"
            disabled={sedangProses}
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangProses} className="tombol-utama w-full py-3 text-lg disabled:opacity-50">
          Daftar
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button type="button" onClick={masukGoogle} disabled={sedangProses} className="tombol-kedua w-full py-3 disabled:opacity-50">
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
