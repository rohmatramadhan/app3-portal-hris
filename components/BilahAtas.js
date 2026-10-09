"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePengguna, keluar } from "@/lib/pengguna";

export default function BilahAtas() {
  const router = useRouter();
  const { pengguna } = usePengguna();
  const [terpasang, setTerpasang] = useState(false);

  useEffect(() => {
    setTerpasang(true);
  }, []);

  async function tanganiKeluar() {
    await keluar();
    router.push("/masuk");
  }

  return (
    <header className="flex items-center justify-between gap-4 bg-sedap px-4 py-3 text-white md:px-6">
      <Link
        href={pengguna?.role === "hrd" ? "/admin" : "/beranda"}
        className="flex items-center gap-2.5 transition hover:opacity-90"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-tinta/10 bg-kunyit text-lg font-bold text-tinta shadow-tipis">
          S
        </span>
        <span className="text-xl font-bold tracking-tight">Portal HRIS</span>
      </Link>
      {terpasang && pengguna && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right leading-tight">
            <div className="max-w-[120px] truncate text-sm font-bold sm:max-w-xs">
              {pengguna.nama}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-kunyit">
              {pengguna.role === "hrd" ? "HRD" : "Karyawan"}
            </div>
          </div>
          {/* Inisial nama sebagai avatar */}
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-tinta/10 bg-krem text-sm font-bold text-tinta">
            {pengguna.nama?.charAt(0)?.toUpperCase() || "U"}
          </span>
          <button
            type="button"
            onClick={tanganiKeluar}
            id="tombol-keluar"
            title="Keluar dari akun"
            className="ml-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-white/25 active:scale-95"
          >
            Keluar
          </button>
        </div>
      )}
    </header>
  );
}
