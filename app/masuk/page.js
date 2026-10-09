"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { pastikanProfilKaryawan } from "@/lib/data";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

/**
 * Halaman Masuk (PRD 4.1) tersambung ke Firebase Authentication (Email/Password & Google).
 * Mengarahkan pengguna sesuai perannya: karyawan ke /beranda, HRD ke /admin.
 * Bila datang dari route guard dengan ?kembali=, kembali ke halaman asal setelah login.
 */

// Dipisah agar useSearchParams bisa dibungkus Suspense (syarat Next.js App Router)
function FormMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pengguna, memuat: memuatAuth } = usePengguna();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  // Bila sudah masuk, arahkan sesuai role (atau ke ?kembali= jika ada)
  useEffect(() => {
    if (!memuatAuth && pengguna) {
      const kembali = searchParams.get("kembali");
      const tujuan =
        kembali && kembali.startsWith("/")
          ? kembali
          : pengguna.role === "hrd"
          ? "/admin"
          : "/beranda";
      router.replace(tujuan);
    }
  }, [pengguna, memuatAuth, router, searchParams]);

  // Tampilkan kosong selama status auth masih dibaca atau sedang redirect
  if (memuatAuth || pengguna) return null;

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
      const res = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      // Cek dokumen users/{uid} di Firestore: bila belum ada buat role "karyawan", bila sudah ada jangan ubah
      const profil = await pastikanProfilKaryawan(res.user);

      // Gunakan ?kembali= bila ada, atau tujuan default sesuai role
      const kembali = searchParams.get("kembali");
      const tujuan =
        kembali && kembali.startsWith("/")
          ? kembali
          : profil?.role === "hrd"
          ? "/admin"
          : "/beranda";
      router.push(tujuan);
    } catch (err) {
      console.error("Gagal masuk:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setPesan("Email atau kata sandi salah.");
      } else if (err.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else if (err.code === "auth/too-many-requests") {
        setPesan("Terlalu banyak percobaan gagal. Silakan coba lagi nanti.");
      } else {
        setPesan("Gagal masuk: " + (err.message || "Terjadi kesalahan."));
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

      // Gunakan ?kembali= bila ada, atau tujuan default sesuai role
      const kembali = searchParams.get("kembali");
      const tujuan =
        kembali && kembali.startsWith("/")
          ? kembali
          : profil?.role === "hrd"
          ? "/admin"
          : "/beranda";
      router.push(tujuan);
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
        {memuat ? "Memproses..." : "Masuk dengan Google"}
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

// Bungkus Suspense karena FormMasuk memakai useSearchParams (syarat Next.js App Router)
export default function HalamanMasuk() {
  return (
    <Suspense fallback={<Memuat />}>
      <FormMasuk />
    </Suspense>
  );
}
