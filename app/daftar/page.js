"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

function FormulirDaftar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat, segarkan } = usePengguna();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // Tentukan rute tujuan berdasarkan role dan parameter kembali
  function tentukanTujuan(role) {
    if (kembali && kembali.startsWith("/") && !kembali.startsWith("/masuk") && !kembali.startsWith("/daftar")) {
      if (kembali.startsWith("/admin") && role !== "hrd") {
        return "/beranda";
      }
      return kembali;
    }
    return role === "hrd" ? "/admin" : "/beranda";
  }

  // Jika pengguna yang sudah masuk membuka /daftar, langsung arahkan sesuai peran / alamat kembali
  useEffect(() => {
    if (!memuat && pengguna) {
      router.replace(tentukanTujuan(pengguna.role));
    }
  }, [pengguna, memuat, router, kembali]);

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!nama.trim()) g.nama = "Nama wajib diisi.";
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    setSedangMemproses(true);
    setPesan("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
      // Buat profil karyawan di Firestore (PRD 4.1)
      await setDoc(doc(db, "users", cred.user.uid), {
        nama: nama.trim(),
        email: email.trim(),
        role: "karyawan",
      });
      await segarkan();
      // Karyawan baru diarahkan sesuai aturan tujuan
      router.replace(tentukanTujuan("karyawan"));
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setPesan("Email ini sudah terdaftar. Silakan masuk.");
      } else if (err.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else if (err.code === "auth/weak-password") {
        setPesan("Kata sandi terlalu lemah.");
      } else {
        setPesan("Gagal mendaftar: " + (err.message || ""));
      }
    } finally {
      setSedangMemproses(false);
    }
  }

  async function masukGoogle() {
    setSedangMemproses(true);
    setPesan("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data().role : "karyawan";
      await segarkan();
      router.replace(tentukanTujuan(role));
    } catch (err) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setPesan("Gagal masuk dengan Google: " + (err.message || ""));
      }
    } finally {
      setSedangMemproses(false);
    }
  }

  // Tampilkan indikator memuat bila status masuk masih dibaca atau sedang dialihkan
  if (memuat || pengguna) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Memuat />
      </div>
    );
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
            disabled={sedangMemproses}
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
            disabled={sedangMemproses}
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
            disabled={sedangMemproses}
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangMemproses} className="tombol-utama w-full py-3 text-lg">
          {sedangMemproses ? "Mendaftar..." : "Daftar"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button
        type="button"
        onClick={masukGoogle}
        disabled={sedangMemproses}
        className="tombol-kedua w-full py-3"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-kunyit text-sm font-bold text-tinta">
          G
        </span>
        Masuk dengan Google
      </button>

      {pesan && (
        <p
          role="status"
          className="mt-5 rounded-xl border border-ditolak/30 bg-ditolak/10 p-3 text-sm font-bold text-red-700"
        >
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

export default function HalamanDaftar() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Memuat /></div>}>
      <FormulirDaftar />
    </Suspense>
  );
}
