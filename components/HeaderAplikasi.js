
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePengguna } from "@/lib/pengguna";

export default function HeaderAplikasi() {
    const router = useRouter();
    const { pengguna, memuat } = usePengguna();
    const [sedangKeluar, setSedangKeluar] = useState(false);
    const [pesanError, setPesanError] = useState("");

    async function handleKeluar() {
        if (sedangKeluar) return;
        if (!window.confirm("Yakin ingin keluar dari Portal HRIS Sedap?")) return;

        setSedangKeluar(true);
        setPesanError("");

        try {
            await signOut(auth);
            router.replace("/masuk");
            router.refresh();
        } catch (error) {
            console.error("Gagal keluar:", error);
            setPesanError("Gagal keluar. Silakan coba lagi.");
            setSedangKeluar(false);
        }
    }

    const nama = pengguna?.nama || "Pengguna";
    const role = pengguna?.role || "Karyawan";
    const inisial = nama.trim().charAt(0).toUpperCase() || "U";

    return (
        <header>
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-tinta/10 bg-kunyit text-xl font-bold text-tinta shadow-kartu">
                        S
                    </span>
                    <span className="text-xl font-bold text-white">
                        Portal HRIS
                    </span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-bold text-white">
                            {memuat ? "Memuat..." : nama}
                        </p>
                        <p className="text-xs font-semibold uppercase text-kunyit">
                            {role}
                        </p>
                    </div>

                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-krem text-base font-bold text-tinta">
                        {inisial}
                    </div>

                    <button
                        type="button"
                        onClick={handleKeluar}
                        disabled={sedangKeluar || memuat}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                        {sedangKeluar ? "Keluar..." : "Keluar"}
                    </button>
                </div>
            </div>

            {pesanError && (
                <p role="alert" className="mt-2 text-right text-sm text-white">
                    {pesanError}
                </p>
            )}
        </header>
    );
}
