"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";
import { daftarDenganEmail, masukDenganGoogle } from "@/lib/auth";
import { usePengguna } from "@/lib/pengguna";

function ruteTujuan(role, kembali) {
  if (kembali && kembali.startsWith("/") && !kembali.startsWith("//")) {
    if (kembali.startsWith("/admin") && role !== "hrd") {
      return "/beranda";
    }
    return kembali;
  }
  return role === "hrd" ? "/admin" : "/beranda";
}

function IsiHalamanDaftar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat: memuatPengguna } = usePengguna();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  // Jika sudah masuk, arahkan langsung sesuai peran atau alamat kembali
  useEffect(() => {
    if (!memuatPengguna && pengguna) {
      router.replace(ruteTujuan(pengguna.role, kembali));
    }
  }, [pengguna, memuatPengguna, kembali, router]);

  if (memuatPengguna || pengguna) {
    return (
      <KerangkaPublik judul="Daftar">
        <div className="py-8">
          <Memuat />
        </div>
      </KerangkaPublik>
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

    setMemuat(true);
    setPesan("");
    try {
      const { role } = await daftarDenganEmail(nama, email, kataSandi);
      // Pengalihan sesuai peran atau alamat kembali (PRD 4.1)
      router.replace(ruteTujuan(role, kembali));
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setPesan("Email sudah terdaftar. Silakan masuk.");
      } else if (err.code === "auth/invalid-email") {
        setGalat({ email: "Format email tidak valid." });
      } else if (err.code === "auth/weak-password") {
        setGalat({ kataSandi: "Kata sandi terlalu lemah." });
      } else {
        setPesan("Gagal mendaftar: " + (err.message || "Terjadi kesalahan."));
      }
    } finally {
      setMemuat(false);
    }
  }

  async function handleMasukGoogle() {
    setMemuat(true);
    setPesan("");
    try {
      const { role } = await masukDenganGoogle();
      router.replace(ruteTujuan(role, kembali));
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setPesan("Jendela login Google ditutup sebelum selesai.");
      } else if (err.code === "auth/unauthorized-domain") {
        setPesan("Domain ini belum diizinkan di Firebase Console.");
      } else {
        setPesan("Gagal masuk dengan Google: " + (err.message || "Terjadi kesalahan."));
      }
    } finally {
      setMemuat(false);
    }
  }

  const tautanMasuk = kembali ? `/masuk?kembali=${encodeURIComponent(kembali)}` : "/masuk";

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

      <button type="button" onClick={handleMasukGoogle} disabled={memuat} className="tombol-kedua w-full py-3">
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
        <Link href={tautanMasuk} className="font-semibold text-sedap hover:underline">
          Masuk
        </Link>
      </p>
    </KerangkaPublik>
  );
}

// Halaman Daftar dibungkus Suspense karena membaca useSearchParams
export default function HalamanDaftar() {
  return (
    <Suspense
      fallback={
        <KerangkaPublik judul="Daftar">
          <div className="py-8">
            <Memuat />
          </div>
        </KerangkaPublik>
      }
    >
      <IsiHalamanDaftar />
    </Suspense>
  );
}
