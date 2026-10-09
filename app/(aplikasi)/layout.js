"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BilahAtas from "@/components/BilahAtas";
import MenuSamping from "@/components/MenuSamping";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";
import { usePengguna } from "@/lib/pengguna";

/**
 * Route guard untuk melindungi halaman internal dan halaman admin HRD
 */
function KontenDenganPenjaga({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pengguna, memuat } = usePengguna();

  // Pengguna yang belum masuk diarahkan ke /masuk (hanya setelah role/auth selesai dimuat)
  useEffect(() => {
    // Selama role belum selesai dibaca dari users/{uid}, jangan memutuskan apa pun
    if (memuat) return;

    if (!pengguna) {
      const alamatAsal = encodeURIComponent(pathname);
      router.push(`/masuk?kembali=${alamatAsal}`);
    }
  }, [pengguna, memuat, pathname, router]);

  // Selama role belum selesai dibaca dari users/{uid}, tampilkan layar Memuat... dan jangan memutuskan apa pun
  if (memuat) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Memuat />
      </div>
    );
  }

  // Jika belum masuk, tampilkan layar Memuat... sambil proses pengalihan ke /masuk berjalan
  if (!pengguna) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Memuat />
      </div>
    );
  }

  // Route guard untuk semua alamat /admin
  const adalahRuteAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (adalahRuteAdmin) {
    // Hanya role "hrd" yang boleh membuka. Selain HRD, tampilkan halaman Akses Ditolak.
    if (pengguna.role !== "hrd") {
      return <AksesDitolak />;
    }
  }

  return children;
}

export default function LayoutAplikasi({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <BilahAtas />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="bg-tinta md:w-64 md:shrink-0">
          <Suspense fallback={<div className="p-4"><Memuat /></div>}>
            <MenuSamping />
          </Suspense>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <Suspense fallback={<Memuat />}>
              <KontenDenganPenjaga>{children}</KontenDenganPenjaga>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
