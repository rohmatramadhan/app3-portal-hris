"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";

function FormulirDaftar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat } = usePengguna();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

  // Jika sudah masuk, arahkan otomatis: ke 'kembali' atau sesuai peran
  useEffect(() => {
    if (!memuat && pengguna) {
      if (kembali && kembali.startsWith("/")) {
        if (kembali.startsWith("/admin") && pengguna.role !== "hrd") {
          router.replace("/beranda");
        } else {
          router.replace(kembali);
        }
        return;
      }
      const tujuan = pengguna.role === "hrd" ? "/admin" : "/beranda";
      router.replace(tujuan);
    }
  }, [pengguna, memuat, kembali, router]);

  async function arahkanSesuaiPeran(uid) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const role = snap.exists() ? snap.data().role : "karyawan";
      if (kembali && kembali.startsWith("/")) {
        if (kembali.startsWith("/admin") && role !== "hrd") {
          router.push("/beranda");
        } else {
          router.push(kembali);
        }
        return;
      }
      const tujuan = role === "hrd" ? "/admin" : "/beranda";
      router.push(tujuan);
    } catch (e) {
      router.push("/beranda");
    }
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

    setSedangProses(true);
    setPesan("");
    try {
      const hasil = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
      const user = hasil.user;

      await updateProfile(user, { displayName: nama.trim() });

      // Simpan dokumen profil karyawan di koleksi users
      await setDoc(doc(db, "users", user.uid), {
        nama: nama.trim(),
        email: email.trim(),
        role: "karyawan",
      });

      await arahkanSesuaiPeran(user.uid);
    } catch (err) {
      console.error("Error pendaftaran:", err);
      if (err.code === "auth/email-already-in-use") {
        setPesan("Email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk.");
      } else if (err.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else {
        setPesan(`Gagal mendaftar: ${err.message}`);
      }
    } finally {
      setSedangProses(false);
    }
  }

  async function masukGoogle() {
    setSedangProses(true);
    setPesan("");
    try {
      const provider = new GoogleAuthProvider();
      const hasil = await signInWithPopup(auth, provider);
      const user = hasil.user;

      // Buat dokumen profil jika belum ada
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const namaUser = user.displayName || user.email.split("@")[0];
        await setDoc(userRef, {
          nama: namaUser,
          email: user.email,
          role: "karyawan",
        });
      }
      await arahkanSesuaiPeran(user.uid);
    } catch (err) {
      console.error("Error Google Auth:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setPesan(`Masuk dengan Google gagal: ${err.message}`);
      }
    } finally {
      setSedangProses(false);
    }
  }

  if (memuat || pengguna) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sedap p-4">
        <div className="kartu p-8 text-center shadow-lg">
          <Memuat />
        </div>
      </div>
    );
  }

  return (
    <KerangkaPublik judul="Daftar">
      <form onSubmit={kirim} noValidate className="space-y-4">
        <div>
          <label htmlFor="nama" className="label">
            Nama
          </label>
          <input
            id="nama"
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="isian"
            placeholder="Nama lengkapmu"
          />
          {galat.nama && <p className="galat">{galat.nama}</p>}
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="isian"
            placeholder="nama@sedap.id"
          />
          {galat.email && <p className="galat">{galat.email}</p>}
        </div>
        <div>
          <label htmlFor="kataSandi" className="label">
            Kata sandi
          </label>
          <input
            id="kataSandi"
            type="password"
            autoComplete="new-password"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            className="isian"
            placeholder="Minimal 6 karakter"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangProses} className="tombol-utama w-full py-3 text-lg">
          {sedangProses ? "Memproses..." : "Daftar"}
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
        disabled={sedangProses}
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sedap p-4">
          <div className="kartu p-8 text-center shadow-lg">
            <Memuat />
          </div>
        </div>
      }
    >
      <FormulirDaftar />
    </Suspense>
  );
}
