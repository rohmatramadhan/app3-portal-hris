"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import Ikon from "./Ikon";

// Menu HRD hanya untuk role "hrd" (PRD 3.1)
const menuHrd = [
  { href: "/admin", label: "Dasbor HRD", ikon: "dasbor" },
  { href: "/admin/karyawan", label: "Data Karyawan", ikon: "tim" },
  { href: "/admin/cuti", label: "Persetujuan Cuti", ikon: "centang" },
  { href: "/admin/laporan", label: "Laporan", ikon: "grafik" },
];

function TautanMenu({ href, label, ikon, aktif }) {
  return (
    <Link
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        aktif
          ? "bg-kunyit text-tinta shadow-tipis"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Ikon nama={ikon} />
      {label}
    </Link>
  );
}

export default function MenuSamping() {
  const pathname = usePathname();
  const router = useRouter();
  const { pengguna, keluar } = usePengguna();

  async function handleKeluar() {
    if (keluar) {
      await keluar();
    }
    router.replace("/masuk");
  }

  // Tanpa exact, menu induk ikut aktif di halaman anaknya, mis. /admin/karyawan/abc
  const aktif = (href, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // /cuti/baru punya menu sendiri, jadi Daftar Cuti tidak ikut aktif di sana
  const diCuti = aktif("/cuti");
  const diAjukanCuti = aktif("/cuti/baru", true);

  return (
    // Di layar kecil menu menjadi satu baris yang bisa digeser, di layar besar fleksibel memenuhi tinggi sidebar
    <nav className="flex flex-1 gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:p-4 md:justify-between">
      <div className="flex gap-1 md:flex-col">
        <TautanMenu href="/beranda" label="Beranda" ikon="rumah" aktif={aktif("/beranda")} />
        <TautanMenu href="/presensi" label="Presensi Saya" ikon="jam" aktif={aktif("/presensi")} />

        {/* <details> = menu buka-tutup bawaan peramban */}
        <details open={diCuti} className="group shrink-0">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
            <Ikon nama="kalender" />
            Cuti Saya
            <Ikon nama="bawah" className="ml-auto h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-1 flex gap-1 md:ml-4 md:flex-col md:border-l md:border-white/20 md:pl-2">
            <TautanMenu href="/cuti" label="Daftar Cuti" ikon="daftar" aktif={diCuti && !diAjukanCuti} />
            <TautanMenu href="/cuti/baru" label="Ajukan Cuti" ikon="tambah" aktif={diAjukanCuti} />
          </div>
        </details>

        <TautanMenu href="/profil" label="Profil" ikon="orang" aktif={aktif("/profil")} />

        {pengguna?.role === "hrd" && (
          <>
            <p className="hidden px-3 pt-6 pb-2 text-xs font-semibold tracking-wider text-kunyit uppercase md:block">
              Menu HRD
            </p>
            {menuHrd.map((m) => (
              <TautanMenu key={m.href} {...m} aktif={aktif(m.href, m.href === "/admin")} />
            ))}
          </>
        )}
      </div>

      {/* Tombol Logout di bagian paling bawah sidebar */}
      <div className="shrink-0 md:mt-auto md:border-t md:border-white/10 md:pt-4">
        <button
          type="button"
          onClick={handleKeluar}
          className="flex w-full shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-ditolak/20 hover:text-white"
        >
          <Ikon nama="keluar" />
          Keluar
        </button>
      </div>
    </nav>
  );
}
