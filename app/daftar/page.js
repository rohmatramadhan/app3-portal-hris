"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KerangkaPublik from "@/components/KerangkaPublik";
import Memuat from "@/components/Memuat";
import { usePengguna } from "@/lib/pengguna";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

function FormDaftar() {
  const router = useRouter();
  const { pengguna, memuat, setPengguna } = usePengguna();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState({});
  const [pesan, setPesan] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // Prompt 8: Pengguna yang sudah masuk diarahkan sesuai perannya
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
    const g = {};
    if (!nama.trim()) g.nama = "Nama wajib diisi.";
    if (!email.trim()) g.email = "Email wajib diisi.";
    if (kataSandi.length < 6) g.kataSandi = "Kata sandi minimal 6 karakter.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    setSedangMemproses(true);
    setPesan("");

    try {
      if (isFirebaseConfigured) {
        // Buat akun di Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), kataSandi);
        await updateProfile(cred.user, { displayName: nama.trim() });

        // Prompt 5: Dokumen user di Firestore berisi nama, email, dan role "karyawan". Jangan simpan kata sandi!
        const userRef = doc(db, "users", cred.user.uid);
        const profil = {
          nama: nama.trim(),
          email: email.trim(),
          role: "karyawan",
        };
        await setDoc(userRef, profil);

        // Karyawan diarahkan ke /beranda
        router.push("/beranda");
      } else {
        // Mode demo
        const role = email.toLowerCase().includes("wulan") ? "hrd" : "karyawan";
        const dataDemo = {
          uid: email.split("@")[0],
          nama: nama.trim(),
          email: email.trim(),
          role,
        };
        setPengguna(dataDemo);
        router.push(role === "hrd" ? "/admin" : "/beranda");
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setPesan("Email ini sudah terdaftar. Silakan gunakan menu Masuk.");
      } else if (err.code === "auth/weak-password") {
        setPesan("Kata sandi terlalu lemah. Gunakan kombinasi yang lebih kuat.");
      } else {
        setPesan("Gagal mendaftar: " + (err.message || "Terjadi kesalahan."));
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
        const cred = await signInWithPopup(auth, googleProvider);
        const userRef = doc(db, "users", cred.user.uid);
        const userSnap = await getDoc(userRef);
        let role = "karyawan";

        if (userSnap.exists()) {
          role = userSnap.data().role || "karyawan";
        } else {
          // Buat dokumen pengguna baru role "karyawan" (Prompt 5)
          const namaPengguna = cred.user.displayName || cred.user.email?.split("@")[0] || "Pengguna";
          const dataBaru = {
            nama: namaPengguna,
            email: cred.user.email || "",
            role: "karyawan",
          };
          await setDoc(userRef, dataBaru);
        }

        router.push(role === "hrd" ? "/admin" : "/beranda");
      } else {
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
            placeholder="Nama lengkap"
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
            placeholder="nama@sedap.id"
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
            placeholder="Minimal 6 karakter"
          />
          {galat.kataSandi && <p className="galat">{galat.kataSandi}</p>}
        </div>
        <button
          type="submit"
          disabled={sedangMemproses}
          className="tombol-utama w-full py-3 text-lg"
        >
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

export default function HalamanDaftar() {
  return (
    <Suspense fallback={<Memuat />}>
      <FormDaftar />
    </Suspense>
  );
}
