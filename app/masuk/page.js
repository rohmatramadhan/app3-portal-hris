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
  const kembali = searchParams.get("kembali");
  const { pengguna, memuat } = usePengguna();
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
      const hasil = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
      await arahkanSesuaiPeran(hasil.user.uid);
    } catch (err) {
      console.error("Error masuk:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setPesan("Email atau kata sandi tidak cocok. Silakan periksa kembali.");
      } else if (err.code === "auth/too-many-requests") {
        setPesan("Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi nanti.");
      } else {
        setPesan(`Gagal masuk: ${err.message}`);
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

      // Pastikan dokumen profil di Firestore ada
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const nama = user.displayName || user.email.split("@")[0];
        await setDoc(userRef, {
          nama,
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
    <KerangkaPublik judul="Masuk">
      <form onSubmit={kirim} noValidate className="space-y-4">
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
            autoComplete="current-password"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            className="isian"
            placeholder="Minimal 6 karakter"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button type="submit" disabled={sedangProses} className="tombol-utama w-full py-3 text-lg">
          {sedangProses ? "Memproses..." : "Masuk"}
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sedap p-4">
          <div className="kartu p-8 text-center shadow-lg">
            <Memuat />
          </div>
        </div>
      }
    >
      <FormulirMasuk />
    </Suspense>
  );
}
