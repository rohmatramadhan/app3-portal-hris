"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KerangkaPublik from "@/components/KerangkaPublik";
import { usePengguna } from "@/lib/pengguna";
import { masukDenganEmail, masukDenganGoogle, terjemahkanGalatAuth } from "@/lib/auth";

/**
 * Halaman Masuk (PRD 4.1). Tersambung ke Firebase Auth.
 * Karyawan diarahkan ke /beranda, HRD diarahkan ke /admin.
 */
export default function HalamanMasuk() {
  const router = useRouter();
  const { pengguna, memuat: memuatPengguna } = usePengguna();

  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesanGalat, setPesanGalat] = useState("");
  const [sedangKirim, setSedangKirim] = useState(false);

  // Jika sudah login, langsung alihkan ke halaman yang sesuai (PRD 4.1)
  useEffect(() => {
    if (!memuatPengguna && pengguna) {
      if (pengguna.role === "hrd") {
        router.replace("/admin");
      } else {
        router.replace("/beranda");
      }
    }
  }, [pengguna, memuatPengguna, router]);

  async function kirim(e) {
    e.preventDefault();
    setPesanGalat("");

    const g = {};
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    setSedangKirim(true);
    try {
      await masukDenganEmail(email, kataSandi);
      // Pengalihan ditangani oleh useEffect di atas begitu status auth terbaca
    } catch (err) {
      setPesanGalat(terjemahkanGalatAuth(err.code));
    } finally {
      setSedangKirim(false);
    }
  }

  async function handleMasukGoogle() {
    setPesanGalat("");
    setSedangKirim(true);
    try {
      await masukDenganGoogle();
      // Pengalihan ditangani oleh useEffect di atas
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setPesanGalat(terjemahkanGalatAuth(err.code));
      }
    } finally {
      setSedangKirim(false);
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
            disabled={sedangKirim}
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
            disabled={sedangKirim}
            className="isian"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button
          type="submit"
          disabled={sedangKirim || memuatPengguna}
          className="tombol-utama w-full py-3 text-lg disabled:opacity-50"
        >
          {sedangKirim ? "Memproses..." : "Masuk"}
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
        disabled={sedangKirim || memuatPengguna}
        className="tombol-kedua w-full py-3 disabled:opacity-50"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-kunyit text-sm font-bold text-tinta">G</span>
        Masuk dengan Google
      </button>

      {pesanGalat && (
        <p role="status" className="mt-5 rounded-xl border border-ditolak/30 bg-ditolak/10 p-3 text-sm font-bold text-ditolak">
          {pesanGalat}
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
