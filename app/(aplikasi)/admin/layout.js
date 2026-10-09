"use client";

import { useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

function PenjagaAdmin({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pengguna yang belum masuk diarahkan ke /masuk
    if (!memuat && !pengguna) {
      const qs = searchParams?.toString();
      const alamatAsal = qs ? `${pathname}?${qs}` : pathname;
      router.push(`/masuk?kembali=${encodeURIComponent(alamatAsal)}`);
    }
  }, [memuat, pengguna, router, pathname, searchParams]);

  // 1. Selama role belum selesai dibaca dari users/{uid}, tampilkan layar Memuat... dan jangan memutuskan apa pun
  if (memuat) {
    return <Memuat />;
  }

  // 2. Pengguna belum masuk: jangan tampilkan apa pun sementara diarahkan ke /masuk
  if (!pengguna) {
    return null;
  }

  // 3. Selain HRD, tampilkan halaman Akses Ditolak
  if (pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  // 4. Hanya role "hrd" yang boleh membuka
  return children;
}

/**
 * Route guard untuk semua alamat /admin dan halaman turunannya (PRD 5.4 & 6.2).
 */
export default function LayoutAdmin({ children }) {
  return (
    <Suspense fallback={<Memuat />}>
      <PenjagaAdmin>{children}</PenjagaAdmin>
    </Suspense>
  );
}
