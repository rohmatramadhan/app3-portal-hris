"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "./Memuat";

/**
 * GuardMasuk melindungi semua halaman di dalam grup (aplikasi).
 * Bila status auth masih dibaca, tampilkan layar muat.
 * Bila belum masuk, arahkan ke /masuk?kembali=<alamat asal>.
 * Karyawan dan HRD sama-sama boleh mengakses halaman di sini.
 *
 * GuardMasuk protects all pages inside the (aplikasi) route group.
 * Shows a loading screen while auth state is being resolved.
 * Redirects unauthenticated users to /masuk?kembali=<original path>.
 * Both karyawan and hrd roles are allowed.
 */
export default function GuardMasuk({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Tunggu hingga status auth selesai dibaca sebelum mengambil keputusan
    if (!memuat && !pengguna) {
      router.replace(`/masuk?kembali=${encodeURIComponent(pathname)}`);
    }
  }, [pengguna, memuat, router, pathname]);

  // Tampilkan layar muat selama auth dibaca atau sedang redirect
  if (memuat || !pengguna) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Memuat />
      </div>
    );
  }

  return children;
}
