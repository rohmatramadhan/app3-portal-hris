"use client";

import Link from "next/link";
import { usePengguna } from "@/lib/pengguna";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function BilahAtas() {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between gap-4 bg-sedap px-4 py-3 text-white md:px-6">
      <Link href="/beranda" className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-tinta/10 bg-kunyit text-lg font-bold text-tinta shadow-tipis">
          S
        </span>
        <span className="text-xl font-bold tracking-tight">Portal HRIS</span>
      </Link>
      {memuat ? (
        <span className="text-sm">Memuat...</span>
      ) : (
        pengguna && (
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-bold">{pengguna.nama}</div>
              <div className="text-xs font-semibold text-kunyit">{pengguna.role === "hrd" ? "HRD" : "Karyawan"}</div>
            </div>
            {/* Inisial nama sebagai avatar / Name initial as the avatar */}
            <span className="grid h-10 w-10 place-items-center rounded-full border border-tinta/10 bg-krem font-bold text-tinta">
              {pengguna.nama?.charAt(0)}
            </span>
            <button
              onClick={async () => {
                await signOut(auth);
                router.push('/masuk');
              }}
              className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
            >
              Keluar
            </button>
          </div>
        )
      )}
    </header>
  );
}
