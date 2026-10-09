"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

/**
 * Route Guard (PRD 6.2, Prompt 9 & 10).
 * 1. Menampilkan Memuat selama status masuk dan role masih dibaca.
 * 2. Mengarahkan pengguna yang belum masuk ke /masuk?kembali=<alamat asal>.
 * 3. Menampilkan AksesDitolak bila bukan HRD membuka halaman /admin.
 */
export default function PenjagaRute({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!memuat && !pengguna) {
      const parameterKembali = pathname && pathname !== "/masuk" ? `?kembali=${encodeURIComponent(pathname)}` : "";
      router.replace(`/masuk${parameterKembali}`);
    }
  }, [memuat, pengguna, router, pathname]);

  if (memuat) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Memuat />
      </div>
    );
  }

  if (!pengguna) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Memuat />
      </div>
    );
  }

  // Bukan HRD di halaman HRD (PRD 6.2 & Prompt 10)
  if (pathname.startsWith("/admin") && pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  return children;
}
