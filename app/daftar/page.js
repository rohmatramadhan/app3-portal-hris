"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { pastikanProfilKaryawan } from "@/lib/data";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";

/**
 * Halaman Daftar (PRD 4.1) tersambung ke Firebase Authentication (Email/Password & Google).
 * Pengguna baru otomatis dibuatkan dokumen profil di koleksi users dengan role "karyawan".
 */
export default function HalamanDaftar() {
  const router = useRouter();
  const { pengguna, memuat: memuatAuth } = usePengguna();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  // Bila sudah masuk, arahkan sesuai role
  useEffect(() => {
    if (!memuatAuth && pengguna) {
      router.replace(pengguna.role === "hrd" ? "/admin" : "/beranda");
    }
  }, [pengguna, memuatAuth, router]);

  // Tampilkan kosong selama status auth masih dibaca
  if (memuatAuth || pengguna) return null;

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
      const res = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
      await updateProfile(res.user, { displayName: nama.trim() });
      // Cek dokumen users/{uid} di Firestore: bila belum ada buat role "karyawan", bila sudah ada jangan ubah
      await pastikanProfilKaryawan(res.user, nama.trim());

      router.push("/beranda");
    } catch (err) {
      console.error("Gagal mendaftar:", err);
      if (err.code === "auth/email-already-in-use") {
        setPesan("Email sudah terdaftar. Silakan masuk.");
      } else if (err.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else if (err.code === "auth/weak-password") {
        setPesan("Kata sandi terlalu lemah (minimal 6 karakter).");
      } else {
        setPesan("Gagal mendaftar: " + (err.message || "Terjadi kesalahan."));
      }
    } finally {
      setMemuat(false);
    }
  }

  async function masukGoogle() {
    setMemuat(true);
    setPesan("");
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      // Cek dokumen users/{uid} di Firestore: bila belum ada buat role "karyawan", bila sudah ada jangan ubah
      const profil = await pastikanProfilKaryawan(res.user);

      if (profil?.role === "hrd") {
        router.push("/admin");
      } else {
        router.push("/beranda");
      }
    } catch (err) {
      console.error("Gagal masuk dengan Google:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setPesan("Jendela masuk Google ditutup sebelum selesai.");
      } else if (err.code === "auth/cancelled-popup-request") {
        // Request dibatalkan
      } else {
        setPesan("Gagal masuk dengan Google: " + (err.message || "Terjadi kesalahan."));
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
        {memuat ? "Memproses..." : "Masuk dengan Google"}
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
