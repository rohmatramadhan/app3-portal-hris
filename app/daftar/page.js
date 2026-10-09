"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePengguna, daftarDenganEmail, masukDenganGoogle } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";

function formatGalatAuth(err) {
  const code = err?.code || "";
  if (code === "auth/email-already-in-use") {
    return "Email sudah terdaftar. Silakan gunakan email lain atau masuk.";
  }
  if (code === "auth/invalid-email") {
    return "Format email tidak valid.";
  }
  if (code === "auth/weak-password") {
    return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
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
  return err?.message || "Gagal mendaftar. Silakan coba lagi.";
}

// Halaman Daftar (PRD 4.1) tersambung ke Firebase Auth
export default function HalamanDaftar() {
  const router = useRouter();
  const { pengguna, memuat } = usePengguna();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // Jika sudah masuk, langsung arahkan ke beranda/admin (PRD 4.1)
  useEffect(() => {
    if (!memuat && pengguna) {
      if (pengguna.role === "hrd") {
        router.replace("/admin");
      } else {
        router.replace("/beranda");
      }
    }
  }, [pengguna, memuat, router]);

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

    setSedangMemproses(true);
    setPesan("");
    try {
      await daftarDenganEmail(nama, email, kataSandi);
      // Akun baru otomatis berperan karyawan, bawa ke Beranda (PRD 4.1)
      router.push("/beranda");
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
      if (profil.role === "hrd") {
        router.push("/admin");
      } else {
        router.push("/beranda");
      }
    } catch (err) {
      setPesan(formatGalatAuth(err));
    } finally {
      setSedangMemproses(false);
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
        <button type="submit" disabled={sedangMemproses} className="tombol-utama w-full py-3 text-lg">
          {sedangMemproses ? "Mendaftarkan..." : "Daftar"}
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
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-sedap hover:underline">
          Masuk
        </Link>
      </p>
    </KerangkaPublik>
  );
}
