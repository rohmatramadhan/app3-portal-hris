"use client";

import { useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import BilahAtas from "@/components/BilahAtas";
import MenuSamping from "@/components/MenuSamping";
import Memuat from "@/components/Memuat";
import { usePengguna } from "@/lib/pengguna";

/**
 * Komponen pelindung rute (route guard) untuk /beranda, /presensi, /cuti, /profil,
 * dan seluruh halaman turunannya di dalam area aplikasi.
 * - Pengguna yang belum masuk diarahkan ke /masuk?kembali=<alamat asal>.
 * - Pengguna dengan peran 'karyawan' maupun 'hrd' boleh membuka halaman ini.
 */
function PenjagaRute({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!memuat && !pengguna) {
      const qs = searchParams?.toString();
      const alamatAsal = qs ? `${pathname}?${qs}` : pathname;
      router.push(`/masuk?kembali=${encodeURIComponent(alamatAsal)}`);
    }
  }, [memuat, pengguna, router, pathname, searchParams]);

  if (memuat) {
    return <Memuat />;
  }

  if (!pengguna) {
    return null;
  }

  // Karyawan dan HRD boleh membuka halaman ini
  return children;
}

/**
 * Tata letak semua halaman setelah masuk.
 */
export default function LayoutAplikasi({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <BilahAtas />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="bg-tinta md:w-64 md:shrink-0">
          <Suspense>
            <MenuSamping />
          </Suspense>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <Suspense fallback={<Memuat />}>
              <PenjagaRute>{children}</PenjagaRute>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
