"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import { daftarDenganEmail, masukDenganGoogle, terjemahkanGalatAuth } from "@/lib/auth";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

/**
 * Menentukan halaman tujuan setelah daftar:
 * - Jika ada parameter kembali dan sah: arahkan ke sana (kecuali bukan HRD membuka /admin, dialihkan ke /beranda).
 * - Tanpa kembali: role "hrd" ke /admin, role "karyawan" ke /beranda.
 */
function dapatkanTujuan(role, kembaliParam) {
  if (kembaliParam) {
    const tujuan = decodeURIComponent(kembaliParam);
    if (tujuan.startsWith("/") && !tujuan.startsWith("//")) {
      if ((tujuan === "/admin" || tujuan.startsWith("/admin/")) && role !== "hrd") {
        return "/beranda";
      }
      return tujuan;
    }
  }
  return role === "hrd" ? "/admin" : "/beranda";
}

function KontenDaftar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat, authLoading, adaPenggunaAuth } = usePengguna();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangDaftar, setSedangDaftar] = useState(false);

  // Jika sudah masuk, arahkan ke halaman sesuai peran
  useEffect(() => {
    if (!memuat && pengguna) {
      const tujuan = dapatkanTujuan(pengguna.role, kembali);
      router.replace(tujuan);
    }
  }, [pengguna, memuat, kembali, router]);

  // Selama auth belum selesai memeriksa sesi atau pengguna sudah login, tampilkan layar Memuat...
  if (authLoading || (adaPenggunaAuth && memuat) || (pengguna && !pesan)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-latar p-8">
        <Memuat />
      </div>
    );
  }

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

    setSedangDaftar(true);
    setPesan("");
    try {
      await daftarDenganEmail(nama, email, kataSandi);
      // Pendaftaran baru otomatis bertindak sebagai karyawan
      const tujuan = dapatkanTujuan("karyawan", kembali);
      router.replace(tujuan);
    } catch (err) {
      if (err.code !== "auth/email-already-in-use") {
        console.error("Gagal mendaftar:", err);
      }
      setPesan(terjemahkanGalatAuth(err));
    } finally {
      setSedangDaftar(false);
    }
  }

  async function handleMasukGoogle() {
    setSedangDaftar(true);
    setPesan("");
    try {
      const { profil } = await masukDenganGoogle();
      const tujuan = dapatkanTujuan(profil.role, kembali);
      router.replace(tujuan);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("Gagal masuk dengan Google:", err);
      }
      setPesan(terjemahkanGalatAuth(err));
    } finally {
      setSedangDaftar(false);
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
            disabled={sedangDaftar}
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
            disabled={sedangDaftar}
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
            disabled={sedangDaftar}
            className="isian"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangDaftar} className="tombol-utama w-full py-3 text-lg">
          {sedangDaftar ? "Mendaftarkan..." : "Daftar"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button type="button" onClick={handleMasukGoogle} disabled={sedangDaftar} className="tombol-kedua w-full py-3">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-kunyit text-sm font-bold text-tinta">G</span>
        Masuk dengan Google
      </button>

      {pesan && (
        <p role="status" className="mt-5 rounded-xl border border-ditolak/30 bg-ditolak/10 p-3 text-sm font-bold text-red-800">
          {pesan}
        </p>
      )}

      <p className="mt-6 text-center text-sm font-medium text-redup">
        Sudah punya akun?{" "}
        <Link
          href={kembali ? `/masuk?kembali=${encodeURIComponent(kembali)}` : "/masuk"}
          className="font-semibold text-sedap hover:underline"
        >
          Masuk
        </Link>
      </p>
    </KerangkaPublik>
  );
}

/**
 * Halaman Daftar (PRD 4.1).
 * Dibungkus Suspense karena membaca parameter kembali lewat useSearchParams.
 */
export default function HalamanDaftar() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-latar p-8">
          <Memuat />
        </div>
      }
    >
      <KontenDaftar />
    </Suspense>
  );
}
