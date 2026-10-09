"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

function FormulirMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat, segarkan } = usePengguna();

  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // Tentukan rute tujuan berdasarkan role dan parameter kembali
  function tentukanTujuan(role) {
    if (kembali && kembali.startsWith("/") && !kembali.startsWith("/masuk") && !kembali.startsWith("/daftar")) {
      // Bila alamat kembali mengarah ke admin tetapi perannya bukan hrd, arahkan ke beranda
      if (kembali.startsWith("/admin") && role !== "hrd") {
        return "/beranda";
      }
      return kembali;
    }
    return role === "hrd" ? "/admin" : "/beranda";
  }

  // Jika pengguna yang sudah masuk membuka /masuk, langsung arahkan sesuai peran / alamat kembali
  useEffect(() => {
    if (!memuat && pengguna) {
      router.replace(tentukanTujuan(pengguna.role));
    }
  }, [pengguna, memuat, router, kembali]);

  // Arahkan setelah berhasil masuk berdasarkan role dari users/{uid}
  async function arahkanSetelahLogin(user) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.exists() ? snap.data().role : "karyawan";
      await segarkan();
      router.replace(tentukanTujuan(role));
    } catch (err) {
      console.error(err);
      router.replace(tentukanTujuan("karyawan"));
    }
  }

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    setSedangMemproses(true);
    setPesan("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      await arahkanSetelahLogin(cred.user);
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setPesan("Email atau kata sandi tidak cocok.");
      } else if (err.code === "auth/too-many-requests") {
        setPesan("Terlalu banyak percobaan gagal. Silakan coba lagi nanti.");
      } else {
        setPesan("Gagal masuk. Periksa koneksi atau data akun Anda.");
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
      await arahkanSetelahLogin(cred.user);
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
            disabled={sedangMemproses}
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
            disabled={sedangMemproses}
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
        Belum punya akun?{" "}
        <Link
          href={kembali ? `/daftar?kembali=${encodeURIComponent(kembali)}` : "/daftar"}
          className="font-semibold text-sedap hover:underline"
        >
          Daftar
        </Link>
      </p>
    </KerangkaPublik>
  );
}

export default function HalamanMasuk() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Memuat /></div>}>
      <FormulirMasuk />
    </Suspense>
  );
}
