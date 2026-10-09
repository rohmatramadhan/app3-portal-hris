"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KerangkaPublik from "@/components/KerangkaPublik";
import { auth, db } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Halaman Masuk (PRD 4.1). Tersambung ke Firebase Auth & Firestore.
 * Pengguna diarahkan sesuai peran (karyawan -> /beranda, hrd -> /admin).
 */
export default function HalamanMasuk() {
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  const router = useRouter();
  const { pengguna, memuat } = usePengguna();

  // Pengguna yang sudah masuk langsung diarahkan ke halamannya (PRD 4.1)
  useEffect(() => {
    if (!memuat && pengguna) {
      router.replace(pengguna.role === "hrd" ? "/admin" : "/beranda");
    }
  }, [pengguna, memuat, router]);

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

    setSedangMemproses(true);
    setPesan("");

    try {
      const hasil = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      const userRef = doc(db, "users", hasil.user.uid);
      const snap = await getDoc(userRef);
      const role = snap.exists() ? snap.data().role : "karyawan";
      router.push(role === "hrd" ? "/admin" : "/beranda");
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setPesan("Email atau kata sandi salah.");
      } else if (err.code === "auth/too-many-requests") {
        setPesan("Terlalu banyak percobaan masuk yang gagal. Silakan coba beberapa saat lagi.");
      } else {
        setPesan("Gagal masuk: " + (err.message || "Terjadi kesalahan."));
      }
    } finally {
      setSedangMemproses(false);
    }
  }

  async function masukGoogle() {
    setSedangMemproses(true);
    setPesan("");

    try {
      const provider = new GoogleAuthProvider();
      const hasil = await signInWithPopup(auth, provider);
      const userRef = doc(db, "users", hasil.user.uid);
      const snap = await getDoc(userRef);

      let role = "karyawan";
      if (!snap.exists()) {
        // Pengguna Google baru dibuat profilnya saat itu juga (PRD 4.1)
        await setDoc(userRef, {
          nama: hasil.user.displayName || "Karyawan",
          email: hasil.user.email,
          role: "karyawan",
        });
      } else {
        role = snap.data().role || "karyawan";
      }

      router.push(role === "hrd" ? "/admin" : "/beranda");
    } catch (err) {
      if (
        err.code !== "auth/popup-closed-by-user" &&
        err.code !== "auth/cancelled-popup-request"
      ) {
        setPesan("Gagal masuk dengan Google: " + (err.message || "Terjadi kesalahan."));
      }
    } finally {
      setSedangMemproses(false);
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
            className="isian"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button
          type="submit"
          disabled={sedangMemproses}
          className="tombol-utama w-full py-3 text-lg disabled:opacity-60"
        >
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
        className="tombol-kedua w-full py-3 disabled:opacity-60"
      >
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
    </KerangkaPublik>
  );
}
