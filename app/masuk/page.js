"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { singkronkanPengguna } from "@/lib/data";
import KerangkaPublik from "@/components/KerangkaPublik";

function terjemahkanGalat(err) {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email atau kata sandi salah.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/user-disabled":
      return "Akun ini telah dinonaktifkan.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.";
    case "auth/popup-closed-by-user":
      return "Jendela masuk Google ditutup sebelum selesai.";
    case "auth/operation-not-allowed":
      return "Metode masuk ini belum diaktifkan di Firebase Console.";
    case "auth/unauthorized-domain":
      return "Domain ini belum didaftarkan di Authorized Domains Firebase Console.";
    default:
      return err?.message || "Terjadi kesalahan saat masuk.";
  }
}

function FormulirMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembaliKe = searchParams.get("kembaliKe");

  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

  async function arahkanPengguna(uid) {
    if (kembaliKe) {
      router.push(kembaliKe);
      return;
    }

    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists() && docSnap.data().role === "hrd") {
        router.push("/admin");
      } else {
        router.push("/beranda");
      }
    } catch {
      router.push("/beranda");
    }
  }

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

    setSedangProses(true);
    setPesan("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      const user = userCred.user;

      // Sinkronkan dokumen profil ke users/{uid} dan bersihkan placeholder lama jika ada
      await singkronkanPengguna(user);

      await arahkanPengguna(user.uid);
    } catch (err) {
      setPesan(terjemahkanGalat(err));
    } finally {
      setSedangProses(false);
    }
  }

  async function masukGoogle() {
    setSedangProses(true);
    setPesan("");
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      // Sinkronkan dokumen profil ke users/{uid} dan bersihkan placeholder lama jika ada
      await singkronkanPengguna(user);

      await arahkanPengguna(user.uid);
    } catch (err) {
      setPesan(terjemahkanGalat(err));
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <>
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
            disabled={sedangProses}
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
            disabled={sedangProses}
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangProses} className="tombol-utama w-full py-3 text-lg disabled:opacity-50">
          Masuk
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button type="button" onClick={masukGoogle} disabled={sedangProses} className="tombol-kedua w-full py-3 disabled:opacity-50">
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
    </>
  );
}

// Halaman Masuk (PRD 4.1) / Sign-in page (PRD 4.1)
export default function HalamanMasuk() {
  return (
    <KerangkaPublik judul="Masuk">
      <Suspense fallback={<p className="text-sm font-semibold text-redup">Memuat formulir...</p>}>
        <FormulirMasuk />
      </Suspense>
    </KerangkaPublik>
  );
}
