"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "./Memuat";
import AksesDitolak from "./AksesDitolak";

/**
 * Route guard untuk halaman di dalam (aplikasi).
 * - Menampilkan Memuat selama status login dan role masih dibaca dari Firebase.
 * - Mengalihkan ke /masuk jika belum login.
 * - Menampilkan AksesDitolak jika bukan HRD membuka halaman /admin.
 */
export default function PenjagaRute({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pengguna, memuat } = usePengguna();

  useEffect(() => {
    if (!memuat && !pengguna) {
      router.replace("/masuk");
    }
  }, [memuat, pengguna, router]);

  if (memuat) {
    return (
      <>
        <Memuat />
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </>
    );
  }

  if (!pengguna) {
    return <Memuat />;
  }

  if (pathname.startsWith("/admin") && pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  return children;
}
