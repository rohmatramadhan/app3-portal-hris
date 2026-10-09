"use client";

import Link from "next/link";
import { usePengguna } from "@/lib/pengguna";
import { useAmbilData } from "@/lib/useAmbilData";
import { ambilPresensiTanggal, ambilPengajuanCuti } from "@/lib/data";
import { tanggalHariIni, formatTanggal, formatJam } from "@/lib/waktu";
import KepalaHalaman from "@/components/KepalaHalaman";
import Ikon from "@/components/Ikon";
import Memuat from "@/components/Memuat";
import Gagal from "@/components/Gagal";

// Beranda (PRD 4.2)
export default function HalamanBeranda() {
  const { pengguna } = usePengguna();

  // Dua data diambil bersamaan
  const { status, data, cobaLagi } = useAmbilData(async () => {
    if (!pengguna?.uid) return null;
    const hariIni = tanggalHariIni();
    const [presensi, cuti] = await Promise.all([
      ambilPresensiTanggal(pengguna.uid, hariIni),
      ambilPengajuanCuti(pengguna.uid),
    ]);
    return { hariIni, presensi, menunggu: cuti.filter((c) => c.status === "menunggu").length };
  }, [pengguna?.uid]);

  let teksPresensi = "Belum presensi hari ini";
  if (data?.presensi?.jamPulang) teksPresensi = "Sudah pulang";
  else if (data?.presensi) teksPresensi = `Sudah masuk pukul ${formatJam(data.presensi.jamMasuk)}`;

  return (
    <div className="space-y-8">
      <KepalaHalaman
        judul={`Halo, ${pengguna?.nama || "Karyawan"}!`}
        keterangan={data ? formatTanggal(data.hariIni) : "Ringkasan hari ini"}
        ikon="rumah"
      >
        <Link href="/presensi" className="tombol-kunyit">
          <Ikon nama="jam" />
          Catat Masuk
        </Link>
        <Link href="/cuti/baru" className="tombol-kedua">
          <Ikon nama="tambah" />
          Ajukan Cuti
        </Link>
      </KepalaHalaman>

      {status === "memuat" && <Memuat />}
      {status === "gagal" && <Gagal onCobaLagi={cobaLagi} />}
      {status === "berhasil" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Kartu presensi hari ini */}
          <Link
            href="/presensi"
            className="kartu group flex flex-col justify-between gap-6 p-6 transition hover:shadow-md"
          >
            <div>
              <p className="text-sm font-semibold tracking-wide text-sedap uppercase">Presensi hari ini</p>
              <p className="mt-2 text-2xl font-bold text-tinta">{teksPresensi}</p>
            </div>
            <span className="tombol-kedua self-start">
              <Ikon nama="jam" />
              Buka Presensi
            </span>
          </Link>

          {/* Kartu pengajuan cuti yang masih menunggu */}
          <Link
            href="/cuti"
            className="kartu group flex flex-col justify-between gap-6 p-6 transition hover:shadow-md"
          >
            <div>
              <p className="text-sm font-semibold tracking-wide text-kunyit uppercase">Cuti menunggu</p>
              <p className="mt-2 text-4xl font-bold text-tinta tabular-nums">
                {data?.menunggu ?? 0}{" "}
                <span className="text-lg font-medium text-redup">pengajuan</span>
              </p>
            </div>
            <span className="tombol-kedua self-start">
              <Ikon nama="kalender" />
              Buka Cuti Saya
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
