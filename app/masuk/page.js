"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

function FormulirMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pengguna, memuat } = usePengguna();

  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [sedangKirim, setSedangKirim] = useState(false);

  // Prompt 8: Pengguna yang sudah masuk dialihkan sesuai peran
  useEffect(() => {
    if (!memuat && pengguna) {
      const kembali = searchParams.get("kembali");
      if (kembali) {
        router.replace(kembali);
      } else {
        router.replace(pengguna.role === "hrd" ? "/admin" : "/beranda");
      }
    }
  }, [pengguna, memuat, router, searchParams]);

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    setSedangKirim(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      let role = "karyawan";

      if (snap.exists()) {
        role = snap.data().role || "karyawan";
      } else {
        role = cred.user.email?.toLowerCase() === "wulan@sedap.id" ? "hrd" : "karyawan";
        await setDoc(doc(db, "users", cred.user.uid), {
          nama: cred.user.displayName || cred.user.email?.split("@")[0] || "Pengguna",
          email: cred.user.email || "",
          role,
        });
      }

      const kembali = searchParams.get("kembali");
      router.replace(kembali || (role === "hrd" ? "/admin" : "/beranda"));
    } catch (err) {
      console.error("Gagal masuk:", err);
      let pesanGalat = "Email atau kata sandi tidak sesuai.";
      if (err.code === "auth/invalid-email") pesanGalat = "Format email tidak valid.";
      else if (err.code === "auth/network-request-failed") pesanGalat = "Koneksi jaringan terputus.";
      else if (err.code?.includes("api-key-not-valid") || err.message?.includes("CONFIGURATION_NOT_FOUND")) {
        pesanGalat = "Firebase Authentication belum diaktifkan di Firebase Console. Harap buka Firebase Console -> Authentication -> Get Started -> Aktifkan Email/Password.";
      }
      setGalat({ umum: pesanGalat });
    } finally {
      setSedangKirim(false);
    }
  }

  async function masukGoogle() {
    setSedangKirim(true);
    setGalat({});
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      let role = "karyawan";

      if (snap.exists()) {
        role = snap.data().role || "karyawan";
      } else {
        // Prompt 5: dokumen dibuat dengan role "karyawan" (kecuali wulan@sedap.id)
        role = cred.user.email?.toLowerCase() === "wulan@sedap.id" ? "hrd" : "karyawan";
        await setDoc(doc(db, "users", cred.user.uid), {
          nama: cred.user.displayName || cred.user.email?.split("@")[0] || "Pengguna",
          email: cred.user.email || "",
          role,
        });
      }

      const kembali = searchParams.get("kembali");
      router.replace(kembali || (role === "hrd" ? "/admin" : "/beranda"));
    } catch (err) {
      console.error("Gagal login Google:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setGalat({ umum: "Gagal masuk dengan Google: " + err.message });
      }
    } finally {
      setSedangKirim(false);
    }
  }

  return (
    <KerangkaPublik judul="Masuk">
      <form onSubmit={kirim} noValidate className="space-y-4">
        {galat.umum && (
          <p role="alert" className="rounded-xl border border-ditolak/30 bg-ditolak/10 p-3 text-sm font-semibold text-ditolak">
            {galat.umum}
          </p>
        )}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="isian"
            disabled={sedangKirim}
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
            disabled={sedangKirim}
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangKirim} className="tombol-utama w-full py-3 text-lg">
          {sedangKirim ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button type="button" onClick={masukGoogle} disabled={sedangKirim} className="tombol-kedua w-full py-3">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-kunyit text-sm font-bold text-tinta">G</span>
        {sedangKirim ? "Menghubungkan..." : "Masuk dengan Google"}
      </button>

      <p className="mt-6 text-center text-sm font-medium text-redup">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-sedap hover:underline">
          Daftar
        </Link>
      </p>
    </KerangkaPublik>
  );
}

export default function HalamanMasuk() {
  return (
    <Suspense fallback={<Memuat />}>
      <FormulirMasuk />
    </Suspense>
  );
}
