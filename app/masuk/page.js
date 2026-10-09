"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePengguna, masukDenganEmail, masukDenganGoogle } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

function formatGalatAuth(err) {
  const code = err?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email atau kata sandi tidak cocok.";
  }
  if (code === "auth/invalid-email") {
    return "Format email tidak valid.";
  }
  if (code === "auth/user-disabled") {
    return "Akun ini telah dinonaktifkan.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Jendela login Google ditutup sebelum selesai.";
  }
  if (code === "auth/cancelled-popup-request") {
    return "Proses login dibatalkan.";
  }
  if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
    return "Metode autentikasi belum diaktifkan di Firebase Console.";
  }
  return err?.message || "Gagal masuk. Silakan coba lagi.";
}

// Halaman Masuk dibungkus Suspense karena membaca useSearchParams (?kembali)
export default function HalamanMasuk() {
  return (
    <Suspense fallback={<Memuat />}>
      <FormMasuk />
    </Suspense>
  );
}

function FormMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat } = usePengguna();

  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // Arahkan ke halaman tujuan / sesuai peran (PRD 4.1 & Prompt 8-9)
  function arahkan(role) {
    if (kembali) {
      if (kembali.startsWith("/admin") && role !== "hrd") {
        router.replace("/beranda");
        return;
      }
      router.replace(kembali);
      return;
    }
    if (role === "hrd") {
      router.replace("/admin");
    } else {
      router.replace("/beranda");
    }
  }

  // Jika sudah masuk, langsung arahkan (PRD 4.1)
  useEffect(() => {
    if (!memuat && pengguna) {
      arahkan(pengguna.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pengguna, memuat]);

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

    setSedangMemproses(true);
    setPesan("");
    try {
      const profil = await masukDenganEmail(email, kataSandi);
      arahkan(profil.role);
    } catch (err) {
      setPesan(formatGalatAuth(err));
    } finally {
      setSedangMemproses(false);
    }
  }

  async function handleMasukGoogle() {
    setSedangMemproses(true);
    setPesan("");
    try {
      const profil = await masukDenganGoogle();
      arahkan(profil.role);
    } catch (err) {
      setPesan(formatGalatAuth(err));
    } finally {
      setSedangMemproses(false);
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
        <button type="submit" disabled={sedangMemproses} className="tombol-utama w-full py-3 text-lg">
          {sedangMemproses ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button
        type="button"
        onClick={handleMasukGoogle}
        disabled={sedangMemproses}
        className="tombol-kedua w-full py-3"
      >
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
