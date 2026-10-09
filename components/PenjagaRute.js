"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

/**
 * Route Guard (PRD 6.2, AGENTS.md):
 * - Status auth dipisahkan dari pengambilan profil Firestore.
 * - Pengguna yang belum masuk (user === null) langsung dialihkan via router.replace tanpa menunggu query database.
 * - Untuk rute /admin (dan turunannya):
 *   - Hanya role "hrd" yang boleh membuka. Selain HRD, tampilkan halaman Akses Ditolak.
 *   - Pengguna yang belum masuk diarahkan ke /masuk.
 * - Untuk /beranda, /presensi, /cuti, /profil (dan turunannya):
 *   - Karyawan dan HRD boleh membuka halaman ini.
 *   - Pengguna yang belum masuk diarahkan ke /masuk?kembali=<alamat asal>.
 */
export default function PenjagaRute({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { pengguna, memuat, authLoading, adaPenggunaAuth } = usePengguna();

  const ruteAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    // 1. Tunggu sampai Firebase Auth selesai memeriksa sesi
    if (authLoading) return;

    // 2. Jika dipastikan tidak ada sesi login, SEGERA alihkan tanpa menunggu query Firestore!
    if (!adaPenggunaAuth) {
      if (ruteAdmin) {
        router.replace("/masuk");
      } else {
        const query = searchParams ? searchParams.toString() : "";
        const alamatAsal = query ? `${pathname}?${query}` : pathname;
        router.replace(`/masuk?kembali=${encodeURIComponent(alamatAsal)}`);
      }
    }
  }, [authLoading, adaPenggunaAuth, ruteAdmin, pathname, searchParams, router]);

  // Selama inisialisasi auth belum selesai ATAU profil user sedang dimuat, tampilkan Memuat...
  if (authLoading || (adaPenggunaAuth && memuat)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Memuat />
      </div>
    );
  }

  // Jika tidak ada sesi login, tampilkan Memuat... sementara router.replace mengalihkan
  if (!adaPenggunaAuth || !pengguna) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Memuat />
      </div>
    );
  }

  // Hanya role "hrd" yang boleh membuka alamat /admin. Selain HRD, tampilkan halaman Akses Ditolak.
  if (ruteAdmin && pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  // Karyawan dan HRD boleh membuka halaman ini (/beranda, /presensi, /cuti, /profil, dsb)
  return children;
}
