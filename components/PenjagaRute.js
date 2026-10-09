"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "./Memuat";
import AksesDitolak from "./AksesDitolak";

/**
 * Route guard untuk halaman di dalam (aplikasi):
 * 1. Selama role dan status masuk belum selesai dibaca dari users/{uid},
 *    tampilkan Memuat... dan jangan memutuskan apa pun.
 * 2. Pengguna belum masuk:
 *    - Di /beranda, /presensi, /cuti, /profil dan turunannya: diarahkan ke /masuk?kembali=<alamat asal>
 *    - Di /admin: diarahkan ke /masuk
 * 3. Pengguna sudah masuk:
 *    - Di /admin: hanya role "hrd" yang boleh membuka, selain HRD tampilkan AksesDitolak
 *    - Di halaman lain: Karyawan dan HRD boleh membuka
 */
export default function PenjagaRute({ children }) {
  const { pengguna, memuat } = usePengguna();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Jangan memutuskan apa pun selama role belum selesai dibaca
    if (memuat) return;

    if (!pengguna) {
      if (pathname.startsWith("/admin")) {
        router.replace("/masuk");
      } else {
        const query = searchParams?.toString();
        const alamatAsal = query ? `${pathname}?${query}` : pathname;
        router.replace(`/masuk?kembali=${encodeURIComponent(alamatAsal)}`);
      }
    }
  }, [memuat, pengguna, pathname, searchParams, router]);

  // Selama role belum selesai dibaca dari users/{uid}, tampilkan layar Memuat...
  if (memuat) {
    return <Memuat />;
  }

  // Pengguna belum masuk, menunggu pengalihan
  if (!pengguna) {
    return <Memuat />;
  }

  // Khusus halaman /admin: hanya role "hrd" yang diizinkan
  if (pathname.startsWith("/admin") && pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  // Karyawan dan HRD boleh membuka /beranda, /presensi, /cuti, /profil, dan halaman turunannya
  return children;
}
