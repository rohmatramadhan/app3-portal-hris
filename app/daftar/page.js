"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";
import KerangkaPublik from "@/components/KerangkaPublik";

// Halaman Daftar (PRD 4.1)
export default function HalamanDaftar() {
  const router = useRouter();
  const { pengguna, memuat } = usePengguna();

  const [nama, setNama] = useState("");
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
    if (!nama.trim()) g.nama = "Nama wajib diisi.";
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    try {
      setSedangMemproses(true);
      const res = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
      const user = res.user;

      await updateProfile(user, { displayName: nama.trim() });

      // Simpan dokumen profil ke koleksi users di Firestore
      await setDoc(doc(db, "users", user.uid), {
        nama: nama.trim(),
        email: email.trim(),
        role: "karyawan",
      });

      router.replace("/beranda");
    } catch (err) {
      console.error("Gagal mendaftar:", err);
      if (err.code === "auth/email-already-in-use") {
        setPesan("Email sudah terdaftar. Silakan masuk.");
      } else if (err.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else if (err.code === "auth/weak-password") {
        setPesan("Kata sandi minimal 6 karakter.");
      } else {
        setPesan("Terjadi kesalahan saat mendaftar. Silakan coba lagi.");
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

      // Periksa apakah profil sudah ada di Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let role = "karyawan";
      if (!docSnap.exists()) {
        // Buat profil karyawan baru jika pengguna Google baru pertama masuk
        await setDoc(docRef, {
          nama: user.displayName || email.split("@")[0] || "Pengguna",
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
          {sedangMemproses ? "Memproses..." : "Daftar"}
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
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-sedap hover:underline">
          Masuk
        </Link>
      </p>
    </KerangkaPublik>
  );
}
