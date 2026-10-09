"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";

// Halaman Masuk (PRD 4.1)
export default function HalamanMasuk() {
  const router = useRouter();
  const { pengguna, memuat } = usePengguna();

  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // Jika sudah masuk, arahkan langsung sesuai peran
  useEffect(() => {
    if (!memuat && pengguna) {
      if (pengguna.role === "hrd") {
        router.replace("/admin");
      } else {
        router.replace("/beranda");
      }
    }
  }, [pengguna, memuat, router]);

  async function kirim(e) {
    e.preventDefault();
    setPesan("");
    const g = {};
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    try {
      setSedangMemproses(true);
      const res = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      const user = res.user;

      // Ambil peran dari Firestore users/{uid}
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      const role = docSnap.exists() ? docSnap.data().role : "karyawan";
      if (role === "hrd") {
        router.replace("/admin");
      } else {
        router.replace("/beranda");
      }
    } catch (err) {
      console.error("Gagal masuk:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setPesan("Email atau kata sandi salah.");
      } else if (err.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else {
        setPesan("Terjadi kesalahan saat masuk. Silakan coba lagi.");
      }
    } finally {
      setSedangMemproses(false);
    }
  }

  async function masukGoogle() {
    setPesan("");
    try {
      setSedangMemproses(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      // Periksa profil di Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let role = "karyawan";
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          nama: user.displayName || user.email?.split("@")[0] || "Pengguna",
          email: user.email,
          role: "karyawan",
        });
      } else {
        role = docSnap.data().role || "karyawan";
      }

      if (role === "hrd") {
        router.replace("/admin");
      } else {
        router.replace("/beranda");
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("Gagal masuk dengan Google:", err);
        setPesan("Gagal masuk dengan Google. Pastikan domain diizinkan di Firebase Console.");
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
