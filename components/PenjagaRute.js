"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

/**
 * Penjaga Rute (Route Guard) Sesi 6 (Prompt 9 & Prompt 10).
 * - Menjaga semua rute aplikasi.
 * - Selama role belum selesai dibaca dari users/{uid}, tampilkan layar Memuat... dan jangan memutuskan apa pun.
 * - Pengguna yang belum masuk: diarahkan ke /masuk (atau /masuk?kembali=<alamat asal> untuk rute karyawan).
 * - Hanya role "hrd" yang boleh membuka semua rute /admin. Selain HRD, tampilkan halaman Akses Ditolak.
 * - Karyawan dan HRD boleh membuka rute karyawan (/beranda, /presensi, /cuti, /profil).
 */
export default function PenjagaRute({ children }) {
  const { pengguna, memuat } = usePengguna();
  const pathname = usePathname();
  const router = useRouter();

  const adalahAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    // Prompt 10: Selama role belum selesai dibaca, jangan memutuskan apa pun
    if (memuat) return;

    if (!pengguna) {
      if (adalahAdmin) {
        // Alamat /admin yang belum login diarahkan langsung ke /masuk
        router.replace("/masuk");
      } else {
        // Alamat karyawan diarahkan ke /masuk?kembali=<alamat asal>
        router.replace(`/masuk?kembali=${encodeURIComponent(pathname)}`);
      }
    }
  }, [pengguna, memuat, pathname, router, adalahAdmin]);

  // Prompt 10: Tampilkan layar Memuat... sampai role selesai dibaca
  if (memuat) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Memuat />
      </div>
    );
  }

  // Jika belum masuk, tahan tampilan sampai router.replace berjalan
  if (!pengguna) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Memuat />
      </div>
    );
  }

  // Prompt 10: Hanya role "hrd" yang boleh membuka /admin. Selain HRD, tampilkan Akses Ditolak
  if (adalahAdmin && pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  // Prompt 9: Karyawan dan HRD boleh membuka rute ini
  return children;
}
