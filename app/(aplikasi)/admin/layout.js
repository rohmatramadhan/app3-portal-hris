"use client";

import { usePengguna } from "@/lib/pengguna";
import AksesDitolak from "@/components/AksesDitolak";
import Memuat from "@/components/Memuat";

/**
 * Route guard untuk seluruh halaman di bawah /admin (PRD 6.2 & AGENTS.md).
 * Halaman di bawah admin tidak memeriksa peran sendiri.
 * Jika pengguna bukan HRD, tampilkan AksesDitolak dan cegah halaman admin dirender.
 */
export default function LayoutAdmin({ children }) {
  const { pengguna, memuat } = usePengguna();

  // Jika status login sedang dibaca, tampilkan indikator memuat di area konten
  if (memuat) {
    return (
      <div className="py-14">
        <Memuat />
      </div>
    );
  }

  // Jika bukan HRD, langsung tampilkan Akses Ditolak tanpa merender halaman admin
  if (pengguna?.role !== "hrd") {
    return <AksesDitolak />;
  }

  return children;
}
