"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import AksesDitolak from "./AksesDitolak";
import Memuat from "./Memuat";

export default function PenjagaRute({ children }) {
  const { pengguna, memuat } = usePengguna();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    // Jangan memutuskan apa pun selama status autentikasi & role masih dibaca
    if (memuat) return;

    if (!pengguna) {
      if (isAdmin) {
        router.replace("/masuk");
      } else {
        const alamatAsal =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : pathname;
        router.replace(`/masuk?kembali=${encodeURIComponent(alamatAsal)}`);
      }
    }
  }, [pengguna, memuat, pathname, isAdmin, router]);

  // Selama role belum selesai dibaca dari users/{uid}, tampilkan layar Memuat... dan jangan memutuskan apa pun
  if (memuat) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Memuat />
        </div>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </>
    );
  }

  // Pengguna yang belum masuk diarahkan ke /masuk (tampilkan layar Memuat... sambil dialihkan)
  if (!pengguna) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Memuat />
        </div>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </>
    );
  }

  // Khusus semua alamat /admin: hanya role "hrd" yang boleh membuka. Selain HRD, tampilkan halaman Akses Ditolak.
  if (isAdmin && pengguna.role !== "hrd") {
    return (
      <>
        <AksesDitolak />
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </>
    );
  }

  // Rute yang diizinkan untuk dibuka
  return children;
}

