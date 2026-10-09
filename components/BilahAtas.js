"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";

export default function BilahAtas() {
  const { pengguna, keluar } = usePengguna();
  const router = useRouter();

  async function handleKeluar() {
    await keluar();
    router.replace("/masuk");
  }

  return (
    <header className="flex items-center justify-between gap-4 bg-sedap px-4 py-3 text-white md:px-6">
      <Link href="/beranda" className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-tinta/10 bg-kunyit text-lg font-bold text-tinta shadow-tipis">
          S
        </span>
        <span className="text-xl font-bold tracking-tight">Portal HRIS</span>
      </Link>
      {pengguna && (
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <div className="text-sm font-bold">{pengguna.nama}</div>
            <div className="text-xs font-semibold text-kunyit">{pengguna.role === "hrd" ? "HRD" : "Karyawan"}</div>
          </div>
          {/* Inisial nama sebagai avatar */}
          <span className="grid h-10 w-10 place-items-center rounded-full border border-tinta/10 bg-krem font-bold text-tinta">
            {pengguna.nama?.charAt(0) || "U"}
          </span>
          <button
            type="button"
            onClick={handleKeluar}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Keluar
          </button>
        </div>
      )}
    </header>
  );
}
