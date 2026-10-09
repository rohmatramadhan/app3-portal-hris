"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BilahAtas from "@/components/BilahAtas";
import MenuSamping from "@/components/MenuSamping";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";
import { PenggunaProvider, usePengguna } from "@/lib/pengguna";

function KontenAplikasi({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!memuat && !pengguna) {
      router.replace(`/masuk?kembaliKe=${encodeURIComponent(pathname)}`);
    }
  }, [memuat, pengguna, router, pathname]);

  if (memuat) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-latar p-8">
        <Memuat />
      </div>
    );
  }

  if (!pengguna) {
    return null;
  }

  // Route guard untuk halaman HRD di /admin
  const diHalamanAdmin = pathname.startsWith("/admin");
  const bukanHrd = pengguna.role !== "hrd";

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
            {diHalamanAdmin && bukanHrd ? (
              <AksesDitolak />
            ) : (
              <Suspense fallback={<Memuat />}>{children}</Suspense>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Tata letak semua halaman setelah masuk. Halaman /masuk dan /daftar ada di luar
 * folder (aplikasi), jadi tampil tanpa bilah atas dan menu.
 * Suspense wajib karena menu dan halaman membaca alamat (usePathname, useSearchParams).
 */
export default function LayoutAplikasi({ children }) {
  return (
    <PenggunaProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-latar p-8">
            <Memuat />
          </div>
        }
      >
        <KontenAplikasi>{children}</KontenAplikasi>
      </Suspense>
    </PenggunaProvider>
  );
}
