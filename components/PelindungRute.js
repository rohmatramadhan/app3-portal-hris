"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Memuat from "./Memuat";

/**
 * Pelindung Autentikasi (Route Guard tingkat layout aplikasi).
 * Mencegah pengunjung yang belum login melihat konten atau layout aplikasi (PRD 6.1 & 6.2).
 */
export default function PelindungRute({ children }) {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();

  useEffect(() => {
    if (!memuat && !pengguna) {
      router.replace("/masuk");
    }
  }, [memuat, pengguna, router]);

  // Jika belum login atau status masih dibaca pertama kali:
  // tampilkan layar pemuatan bersih tanpa navbar/sidebar
  if (memuat || !pengguna) {
    return (
      <div className="grid min-h-screen place-items-center bg-latar">
        <Memuat />
      </div>
    );
  }

  return children;
}
