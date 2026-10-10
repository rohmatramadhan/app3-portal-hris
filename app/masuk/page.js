"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { ensureUserDoc } from "@/lib/ensureUserDoc";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import KerangkaPublik from "@/components/KerangkaPublik";
import RoleRedirect from "@/components/RoleRedirect";

export default function MasukPage() {
  // Redirect logged-in users based on role

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setPesan("");
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await ensureUserDoc(
        credential.user.uid,
        credential.user.email
      );

      window.location.href = "/";
    } catch (error) {
      console.error("Login email gagal:", error);

      if (error.code === "auth/invalid-credential") {
        setPesan("Email atau password salah.");
      } else if (error.code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else if (error.code === "auth/too-many-requests") {
        setPesan("Terlalu banyak percobaan. Silakan coba lagi nanti.");
      } else {
        setPesan(`Login gagal: ${error.message}`);
      }

      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setPesan("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);

      await ensureUserDoc(
        credential.user.uid,
        credential.user.email
      );

      // Fetch role from Firestore for Google login
      const snap = await getDoc(doc(db, "users", credential.user.uid));
      const role = snap.exists() ? snap.data().role : "karyawan";
      if (role === "hrd") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/beranda";
      }
    } catch (error) {
      console.error("Login Google gagal:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setPesan("Jendela login Google ditutup sebelum selesai.");
      } else {
        setPesan(`Login Google gagal: ${error.message}`);
      }

      setLoading(false);
    }
  };

  return ( <>
    <RoleRedirect />
    <KerangkaPublik judul="Masuk">
      <form onSubmit={handleLogin} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="isian"
            placeholder="Masukkan email"
            autoComplete="email"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="isian"
            placeholder="Masukkan password"
            autoComplete="current-password"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="tombol-utama w-full py-3 text-lg"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm font-bold text-redup">
        <span className="h-0.5 flex-1 bg-tinta/15" />
        atau
        <span className="h-0.5 flex-1 bg-tinta/15" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="tombol-kedua w-full py-3"
        disabled={loading}
      >
        {loading ? "Memproses..." : "Masuk dengan Google"}
      </button>

      {pesan && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-menunggu bg-menunggu/15 p-3 text-sm font-bold text-tinta"
        >
          {pesan}
        </p>
      )}

      <p className="mt-6 text-center text-sm font-medium text-redup">
        Belum punya akun?{" "}
        <Link
          href="/daftar"
          className="font-semibold text-sedap hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </KerangkaPublik>
    </> );
}