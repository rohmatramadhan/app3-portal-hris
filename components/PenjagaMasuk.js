"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "./Memuat";

/**
 * Route guard untuk area (aplikasi).
 * - Saat SSR / prerender (PPR), merender children agar segment tidak di-drop oleh Next.js.
 * - Saat client mount, memeriksa status autentikasi:
 *   - Belum login diarahkan ke /masuk.
 *   - Menampilkan Memuat selama state masih dibaca.
 */
export default function PenjagaMasuk({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();

  useEffect(() => {
    if (!memuat && !pengguna) {
      router.replace("/masuk");
    }
  }, [memuat, pengguna, router]);

  if (memuat || !pengguna) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-latar p-8">
        <Memuat />
      </div>
    );
  }

  return children;
}
