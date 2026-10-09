"use client";

import { usePengguna } from "@/lib/pengguna";
import Memuat from "./Memuat";
import AksesDitolak from "./AksesDitolak";

/**
 * Route guard untuk modul HRD (/admin).
 * - Menampilkan Memuat selama state masih dibaca.
 * - Menampilkan AksesDitolak jika bukan HRD.
 * - Menampilkan children jika HRD.
 */
export default function PenjagaAdmin({ children }) {
  const { pengguna, memuat } = usePengguna();

  if (memuat) {
    return <Memuat />;
  }

  if (pengguna?.role !== "hrd") {
    return <AksesDitolak />;
  }

  return children;
}
