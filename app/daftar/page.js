"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

function FormulirDaftar() {
  const router = useRouter();
  const { pengguna, memuat } = usePengguna();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [sedangKirim, setSedangKirim] = useState(false);

  // Prompt 8: Pengguna yang sudah masuk dialihkan sesuai peran
  useEffect(() => {
    if (!memuat && pengguna) {
      router.replace(pengguna.role === "hrd" ? "/admin" : "/beranda");
    }
  }, [pengguna, memuat, router]);

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!nama.trim()) g.nama = "Nama wajib diisi.";
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    setSedangKirim(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);

      // Simpan ke Firestore users (termasuk field password)
      const role = email.trim().toLowerCase() === "wulan@sedap.id" ? "hrd" : "karyawan";
      await setDoc(doc(db, "users", cred.user.uid), {
        nama: nama.trim(),
        email: email.trim(),
        password: kataSandi,
        role,
      });

      router.replace(role === "hrd" ? "/admin" : "/beranda");
    } catch (err) {
      console.error("Gagal mendaftar:", err);
      let pesanGalat = "Pendaftaran gagal: " + (err.message || "");
      if (err.code === "auth/email-already-in-use") pesanGalat = "Email ini sudah terdaftar.";
      else if (err.code === "auth/invalid-email") pesanGalat = "Format email tidak valid.";
      else if (err.code === "auth/weak-password") pesanGalat = "Kata sandi terlalu lemah (minimal 6 karakter).";
      else if (err.code === "auth/operation-not-allowed" || err.message?.includes("CONFIGURATION_NOT_FOUND") || err.code?.includes("api-key-not-valid")) {
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
        role = cred.user.email?.toLowerCase() === "wulan@sedap.id" ? "hrd" : "karyawan";
        await setDoc(doc(db, "users", cred.user.uid), {
          nama: cred.user.displayName || cred.user.email?.split("@")[0] || "Pengguna",
          email: cred.user.email || "",
          role,
        });
      }

      router.replace(role === "hrd" ? "/admin" : "/beranda");
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
    <KerangkaPublik judul="Daftar">
      <form onSubmit={kirim} noValidate className="space-y-4">
        {galat.umum && (
          <p role="alert" className="rounded-xl border border-ditolak/30 bg-ditolak/10 p-3 text-sm font-semibold text-ditolak">
            {galat.umum}
          </p>
        )}
        <div>
          <label htmlFor="nama" className="label">Nama</label>
          <input
            id="nama"
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="isian"
            disabled={sedangKirim}
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
            disabled={sedangKirim}
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
            disabled={sedangKirim}
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangKirim} className="tombol-utama w-full py-3 text-lg">
          {sedangKirim ? "Mendaftarkan..." : "Daftar"}
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
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-sedap hover:underline">
          Masuk
        </Link>
      </p>
    </KerangkaPublik>
  );
}

export default function HalamanDaftar() {
  return (
    <Suspense fallback={<Memuat />}>
      <FormulirDaftar />
    </Suspense>
  );
}
