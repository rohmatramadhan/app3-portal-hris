"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

/**
 * Route guard untuk membatasi akses halaman berdasarkan peran dan status autentikasi.
 * Sesuai arahan Prompt 9 dan Prompt 10:
 * - Selama peran/autentikasi masih dimuat: tampilkan Memuat...
 * - Belum masuk: arahkan ke /masuk (atau /masuk?kembali=...)
 * - Masuk ke /admin tapi bukan HRD: tampilkan Akses Ditolak
 */
export default function PenjagaRute({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pengguna, memuat } = usePengguna();

  useEffect(() => {
    if (memuat) return;

    // Pengguna belum masuk
    if (!pengguna) {
      if (pathname.startsWith("/admin")) {
        router.replace("/masuk");
      } else {
        router.replace(`/masuk?kembali=${encodeURIComponent(pathname)}`);
      }
    }
  }, [pengguna, memuat, pathname, router]);

  // Layar memuat selama profil/autentikasi masih dibaca
  if (memuat) {
    return (
      <div className="py-12">
        <Memuat />
      </div>
    );
  }

  // Jika belum masuk, tahan tampilan sembari pengalihan berjalan
  if (!pengguna) {
    return (
      <div className="py-12">
        <Memuat />
      </div>
    );
  }

  // Jika membuka halaman /admin tapi bukan role "hrd", tampilkan Akses Ditolak
  if (pathname.startsWith("/admin") && pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  // Akses diizinkan
  return children;
}
