"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

/**
 * PenjagaAkses (Route Guard) Sesi 6:
 * 1. Selama memuat status masuk dan role: tampilkan Memuat.js (PRD 6.1).
 * 2. Belum masuk: arahkan ke /masuk (PRD 6.2).
 * 3. Bukan HRD membuka rute di bawah /admin: tampilkan AksesDitolak.js (PRD 6.2 & AGENTS.md).
 */
export default function PenjagaAkses({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!memuat && !pengguna) {
      router.replace("/masuk");
    }
  }, [memuat, pengguna, router]);

  // 1. Masih membaca status login
  if (memuat) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-latar">
        <Memuat />
      </div>
    );
  }

  // 2. Belum masuk (tunggu redirect useEffect)
  if (!pengguna) {
    return null;
  }

  // 3. Rute /admin dijaga khusus untuk role 'hrd'
  const diRuteAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (diRuteAdmin && pengguna.role !== "hrd") {
    return <AksesDitolak />;
  }

  return children;
}
