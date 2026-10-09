"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { daftarDenganEmail, masukDenganGoogle } from "@/lib/auth";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";

function terjemahkanGalat(kode) {
  if (kode === "auth/email-already-in-use") {
    return "Email sudah terdaftar. Silakan masuk.";
  }
  if (kode === "auth/invalid-email") {
    return "Format email tidak valid.";
  }
  if (kode === "auth/weak-password") {
    return "Kata sandi terlalu lemah (minimal 6 karakter).";
  }
  if (kode === "auth/invalid-api-key" || kode === "auth/api-key-not-valid" || String(kode).includes("API key not valid")) {
    return "Kunci API Firebase (API Key) tidak valid. Periksa file .env.local.";
  }
  if (kode === "auth/operation-not-allowed" || kode === "auth/configuration-not-found") {
    return "Metode pendaftaran belum diaktifkan di Firebase Console.";
  }
  if (kode === "auth/popup-closed-by-user") {
    return "Jendela pendaftaran Google ditutup sebelum selesai.";
  }
  return "Gagal mendaftar: " + kode;
}

function IsiHalamanDaftar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat } = usePengguna();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [memproses, setMemproses] = useState(false);

  const arahkanTujuan = useCallback(
    (role) => {
      if (kembali && kembali.startsWith("/") && !kembali.startsWith("//") && kembali !== "/masuk" && kembali !== "/daftar") {
        router.push(kembali);
        return;
      }
      if (role === "hrd") {
        router.push("/admin");
      } else {
        router.push("/beranda");
      }
    },
    [kembali, router]
  );

  useEffect(() => {
    if (!memuat && pengguna) {
      arahkanTujuan(pengguna.role);
    }
  }, [memuat, pengguna, arahkanTujuan]);

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

    try {
      setMemproses(true);
      setPesan("");
      const { role } = await daftarDenganEmail(email.trim(), kataSandi, nama.trim());
      arahkanTujuan(role);
    } catch (err) {
      setPesan(terjemahkanGalat(err.code || err.message));
    } finally {
      setMemproses(false);
    }
  }

  async function handleMasukGoogle() {
    try {
      setMemproses(true);
      setPesan("");
      const { role } = await masukDenganGoogle();
      arahkanTujuan(role);
    } catch (err) {
      setPesan(terjemahkanGalat(err.code || err.message));
    } finally {
      setMemproses(false);
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
        <button type="submit" disabled={memproses} className="tombol-utama w-full py-3 text-lg">
          {memproses ? "Mendaftarkan..." : "Daftar"}
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
        disabled={memproses}
        className="tombol-kedua w-full py-3"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-kunyit text-sm font-bold text-tinta">G</span>
        {memproses ? "Menghubungkan..." : "Masuk dengan Google"}
      </button>

      {pesan && (
        <p role="status" className="mt-5 rounded-xl border border-menunggu bg-menunggu/15 p-3 text-sm font-bold text-tinta">
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

// Halaman Daftar (PRD 4.1)
export default function HalamanDaftar() {
  return (
    <Suspense>
      <IsiHalamanDaftar />
    </Suspense>
  );
}
