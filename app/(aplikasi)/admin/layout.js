"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

/**
 * Guard untuk semua halaman /admin.
 * Urutan keputusan:
 *   1. Role belum selesai dibaca → tampilkan layar Memuat, jangan redirect dulu.
 *   2. Belum masuk (pengguna null) → redirect ke /masuk.
 *   3. Sudah masuk tapi bukan HRD → tampilkan AksesDitolak.
 *   4. HRD → render halaman normal.
 *
 * Route guard for all /admin pages.
 * Decision order:
 *   1. Role not yet resolved → show loading screen, make no decision yet.
 *   2. Not signed in → redirect to /masuk.
 *   3. Signed in but not HRD → show AksesDitolak.
 *   4. HRD → render page normally.
 */
export default function LayoutAdmin({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();

  useEffect(() => {
    // Tunggu hingga status auth & role selesai dibaca sebelum redirect
    if (!memuat && !pengguna) {
      router.replace("/masuk");
    }
  }, [pengguna, memuat, router]);

  // Masih memuat auth/role — jangan buat keputusan apa pun
  if (memuat) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Memuat />
      </div>
    );
  }

  // Belum masuk — sedang di-redirect, tampilkan loader sementara menunggu
  if (!pengguna) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Memuat />
      </div>
    );
  }

  // Sudah masuk tapi bukan HRD
  if (pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  // HRD — akses penuh
  return children;
}
