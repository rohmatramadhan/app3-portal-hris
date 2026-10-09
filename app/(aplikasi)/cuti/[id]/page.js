"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import { useAmbilData } from "@/lib/useAmbilData";
import { ambilSatuPengajuan } from "@/lib/data";
import { formatTanggal, formatJam, lamaHari } from "@/lib/waktu";
import KepalaHalaman from "@/components/KepalaHalaman";
import Ikon from "@/components/Ikon";
import Memuat from "@/components/Memuat";
import Gagal from "@/components/Gagal";
import Kosong from "@/components/Kosong";
import PilStatus from "@/components/PilStatus";

// Rincian Cuti (PRD 4.4.2) / Leave detail (PRD 4.4.2)
export default function HalamanRincianCuti() {
  const { id } = useParams();
  const { pengguna } = usePengguna();
  const { status, data: c, cobaLagi } = useAmbilData(
    () => ambilSatuPengajuan(id, pengguna),
    [id, pengguna?.uid]
  );


  return (
    <div className="max-w-2xl space-y-8">
      <KepalaHalaman judul={c ? `Cuti ${c.id}` : "Rincian Cuti"} keterangan={c && <PilStatus status={c.status} />} warna="kunyit" ikon="kalender">
        <Link href="/cuti" className="tombol-kedua">
          <Ikon nama="kembali" />
          Daftar Cuti
        </Link>
      </KepalaHalaman>

      {status === "memuat" && <Memuat />}
      {status === "gagal" && <Gagal onCobaLagi={cobaLagi} />}
      {status === "berhasil" && c === null && (
        <Kosong teks="Pengajuan tidak ditemukan">
          <Link href="/cuti" className="tombol-utama">Lihat Daftar Cuti</Link>
        </Kosong>
      )}
      {status === "berhasil" && c && (
        <section className="kartu overflow-hidden">
          <div className="grid border-b border-tinta/10 sm:grid-cols-2">
            <div className="border-b border-tinta/10 p-5 sm:border-r sm:border-b-0">
              <p className="text-xs font-semibold tracking-wide text-redup uppercase">Tanggal</p>
              <p className="mt-1 text-lg font-bold text-tinta tabular-nums">
                {formatTanggal(c.tanggalMulai)} – {formatTanggal(c.tanggalSelesai)}
              </p>
            </div>
            <div className="bg-krem p-5">
              <p className="text-xs font-semibold tracking-wide text-redup uppercase">Lama</p>
              <p className="mt-1 text-lg font-bold text-tinta tabular-nums">{lamaHari(c.tanggalMulai, c.tanggalSelesai)} hari</p>
            </div>
          </div>
          <dl className="space-y-5 p-5">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-redup uppercase">Alasan</dt>
              <dd className="mt-1 font-semibold">{c.alasan}</dd>
            </div>
            <div className="rounded-xl border border-dashed border-tinta/20 p-4">
              <dt className="text-xs font-semibold tracking-wide text-terong uppercase">Catatan HRD</dt>
              <dd className="mt-1 font-semibold">{c.catatanHrd || <span className="text-redup">HRD belum memberi catatan.</span>}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-redup uppercase">Diajukan</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {formatTanggal(c.diajukanPada)}, pukul {formatJam(c.diajukanPada)}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
