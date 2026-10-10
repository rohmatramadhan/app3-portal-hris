"use client";

import { useState } from "react";
import Link from "next/link";
import KerangkaPublik from "@/components/KerangkaPublik";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function HalamanDaftar() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [berhasil, setBerhasil] = useState(false);

  async function kirim(e) {
    e.preventDefault();

    setPesan("");
    setBerhasil(false);

    const validasi = {};

    if (!nama.trim()) {
      validasi.nama = "Nama wajib diisi.";
    }

    if (!email.trim()) {
      validasi.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      validasi.email = "Format email tidak valid.";
    }

    if (!kataSandi) {
      validasi.kataSandi = "Kata sandi wajib diisi.";
    } else if (kataSandi.length < 6) {
      validasi.kataSandi = "Kata sandi minimal 6 karakter.";
    }

    setGalat(validasi);

    if (Object.keys(validasi).length > 0) {
      return;
    }

    setLoading(true);

    let akunDibuat = false;

    try {
      // Membuat akun baru di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        kataSandi
      );

      const user = userCredential.user;
      akunDibuat = true;

      // Menyimpan nama pada profil Firebase Authentication
      await updateProfile(user, {
        displayName: nama.trim(),
      });

      // Menyimpan profil pengguna ke Firestore
      await setDoc(doc(db, "users", user.uid), {
        nama: nama.trim(),
        email: user.email,
        role: "karyawan",
        createdAt: serverTimestamp(),
      });

      setBerhasil(true);
      setPesan("Pendaftaran berhasil! Silakan masuk menggunakan akunmu.");
      setNama("");
      setEmail("");
      setKataSandi("");
      setGalat({});
    } catch (error) {
      console.error("Pendaftaran gagal:", error);

      if (akunDibuat) {
        setPesan(
          "Akun berhasil dibuat, tetapi profil belum berhasil disimpan. Periksa Rules Firestore sebelum mencoba kembali."
        );
      } else if (error.code === "auth/email-already-in-use") {
        setPesan("Email sudah terdaftar. Silakan masuk.");
      } else if (error.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else if (error.code === "auth/weak-password") {
        setPesan("Kata sandi terlalu lemah. Gunakan minimal 6 karakter.");
      } else if (error.code === "auth/operation-not-allowed") {
        setPesan("Pendaftaran email belum diaktifkan di Firebase Authentication.");
      } else if (error.code === "permission-denied" || error.code === "firestore/permission-denied") {
        setPesan("Akses Firestore ditolak. Periksa Rules Firestore.");
      } else {
        setPesan(`Pendaftaran gagal: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
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
            type="text"
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="isian"
            placeholder="Masukkan nama lengkap"
            disabled={loading}
            required
          />
          {galat.nama && (
            <p className="galat">{galat.nama}</p>
          )}
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
            placeholder="Masukkan email"
            disabled={loading}
            required
          />
          {galat.email && (
            <p className="galat">{galat.email}</p>
          )}
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
            disabled={loading}
            required
          />
          {galat.kataSandi && (
            <p className="galat">{galat.kataSandi}</p>
          )}
        </div>

        <button
          type="submit"
          className="tombol-utama w-full py-3 text-lg"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button
        type="button"
        onClick={() =>
          setPesan("Pendaftaran dengan Google belum diaktifkan pada halaman ini. Gunakan formulir pendaftaran email.")
        }
        className="tombol-kedua w-full py-3"
        disabled={loading}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-kunyit text-sm font-bold text-tinta">
          G
        </span>
        Daftar dengan Google
      </button>

      {pesan && (
        <div
          role="status"
          className={`mt-5 rounded-xl border p-3 text-sm font-bold ${berhasil
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-menunggu bg-menunggu/15 text-tinta"
            }`}
        >
          {pesan}

          {pesan.includes("Email sudah terdaftar") && (
            <Link
              href="/masuk"
              className="ml-1 font-bold text-sedap underline"
            >
              Masuk sekarang
            </Link>
          )}

          {berhasil && (
            <div className="mt-3">
              <Link
                href="/masuk"
                className="font-bold text-sedap underline"
              >
                Lanjut ke halaman masuk
              </Link>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm font-medium text-redup">
        Sudah punya akun?{" "}
        <Link
          href="/masuk"
          className="font-semibold text-sedap hover:underline"
        >
          Masuk
        </Link>
      </p>
    </KerangkaPublik>
  );
}