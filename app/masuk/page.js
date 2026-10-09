"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";
import { usePengguna } from "@/lib/pengguna";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

function FormMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pengguna, memuat, setPengguna } = usePengguna();

  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // Prompt 8: Pengguna yang sudah masuk lalu membuka /masuk diarahkan sesuai perannya
  useEffect(() => {
    if (!memuat && pengguna) {
      const kembali = searchParams.get("kembali");
      if (kembali && (pengguna.role === "hrd" || !kembali.startsWith("/admin"))) {
        router.replace(kembali);
      } else if (pengguna.role === "hrd") {
        router.replace("/admin");
      } else {
        router.replace("/beranda");
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

    setSedangMemproses(true);
    setPesan("");

    try {
      if (isFirebaseConfigured) {
        // Masuk via Firebase Auth
        const cred = await signInWithEmailAndPassword(auth, email.trim(), kataSandi);
        // Baca role dari users/{uid} (Prompt 8)
        const userRef = doc(db, "users", cred.user.uid);
        const userSnap = await getDoc(userRef);
        let role = "karyawan";
        if (userSnap.exists()) {
          role = userSnap.data().role || "karyawan";
        } else {
          // Buat profil jika belum ada
          const profilBaru = {
            nama: cred.user.displayName || email.split("@")[0],
            email: cred.user.email,
            role: "karyawan",
          };
          await setDoc(userRef, profilBaru);
        }

        const kembali = searchParams.get("kembali");
        if (kembali && (role === "hrd" || !kembali.startsWith("/admin"))) {
          router.push(kembali);
        } else {
          router.push(role === "hrd" ? "/admin" : "/beranda");
        }
      } else {
        // Mode demo jika Firebase belum diisi di .env.local
        const role = email.toLowerCase().includes("wulan") || email.toLowerCase().includes("hrd") ? "hrd" : "karyawan";
        const nama = email.split("@")[0];
        const dataDemo = {
          uid: email.split("@")[0],
          nama: nama.charAt(0).toUpperCase() + nama.slice(1),
          email,
          role,
        };
        setPengguna(dataDemo);
        router.push(role === "hrd" ? "/admin" : "/beranda");
      }
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setPesan("Email atau kata sandi salah.");
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
      if (isFirebaseConfigured) {
        // Masuk via Google Auth
        const cred = await signInWithPopup(auth, googleProvider);
        const userRef = doc(db, "users", cred.user.uid);
        const userSnap = await getDoc(userRef);
        let role = "karyawan";

        if (userSnap.exists()) {
          role = userSnap.data().role || "karyawan";
        } else {
          // Pengguna Google baru otomatis role "karyawan" (Prompt 5)
          const namaPengguna = cred.user.displayName || cred.user.email?.split("@")[0] || "Pengguna";
          const dataBaru = {
            nama: namaPengguna,
            email: cred.user.email || "",
            role: "karyawan",
          };
          await setDoc(userRef, dataBaru);
        }

        const kembali = searchParams.get("kembali");
        if (kembali && (role === "hrd" || !kembali.startsWith("/admin"))) {
          router.push(kembali);
        } else {
          router.push(role === "hrd" ? "/admin" : "/beranda");
        }
      } else {
        // Mode demo Google
        const dataDemo = {
          uid: "demo-google",
          nama: "Pengguna Google",
          email: "google@sedap.id",
          role: "karyawan",
        };
        setPengguna(dataDemo);
        router.push("/beranda");
      }
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setPesan("Jendela masuk Google ditutup.");
      } else {
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
            placeholder="nama@sedap.id"
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
            placeholder="Minimal 6 karakter"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button
          type="submit"
          disabled={sedangMemproses}
          className="tombol-utama w-full py-3 text-lg"
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

export default function HalamanMasuk() {
  return (
    <Suspense fallback={<Memuat />}>
      <FormMasuk />
    </Suspense>
  );
}
