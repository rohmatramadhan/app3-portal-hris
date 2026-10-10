
"use client";

import { useEffect, useState, useCallback } from "react";
import { ambilRingkasanDasbor } from "@/lib/data";
import { usePengguna } from "@/lib/pengguna";
import { tanggalHariIni, formatTanggal } from "@/lib/waktu";
import KepalaHalaman from "@/components/KepalaHalaman";
import Memuat from "@/components/Memuat";
import Gagal from "@/components/Gagal";

export default function HalamanAdmin() {
  const { pengguna, memuat: memuatPengguna } = usePengguna();

  const [data, setData] = useState(null);
  const [memuatData, setMemuatData] = useState(true);
  const [error, setError] = useState(false);

  const muatData = useCallback(async () => {
    setMemuatData(true);
    setError(false);

    try {
      const hasil = await ambilRingkasanDasbor(tanggalHariIni());
      setData(hasil);
    } catch (err) {
      console.error("Gagal memuat dasbor HRD:", err);
      setError(true);
    } finally {
      setMemuatData(false);
    }
  }, []);

  useEffect(() => {
    if (!memuatPengguna && pengguna?.uid && pengguna.role === "hrd") {
      muatData();
    }
  }, [memuatPengguna, pengguna, muatData]);

  if (memuatPengguna || memuatData) {
    return <Memuat />;
  }

  if (!pengguna || pengguna.role !== "hrd") {
    return (
      <div className="kartu p-6 text-center">
        <p className="text-tinta">
          Halaman ini hanya dapat diakses oleh HRD.
        </p>
      </div>
    );
  }

  if (error) {
    return <Gagal onCobaLagi={muatData} />;
  }

  return (
    <div className="space-y-8">
      <KepalaHalaman
        judul={`Halo, ${pengguna.nama || "HRD"}!`}
        keterangan={`Ringkasan HRIS · ${formatTanggal(tanggalHariIni())}`}
        ikon="rumah"
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kartu p-6">
          <p className="text-sm text-redup">Total karyawan</p>
          <p className="mt-2 text-3xl font-bold text-tinta">
            {data?.jumlahKaryawan ?? 0}
          </p>
        </div>

        <div className="kartu p-6">
          <p className="text-sm text-redup">Hadir hari ini</p>
          <p className="mt-2 text-3xl font-bold text-tinta">
            {data?.hadir ?? 0}
          </p>
        </div>

        <div className="kartu p-6">
          <p className="text-sm text-redup">Terlambat</p>
          <p className="mt-2 text-3xl font-bold text-tinta">
            {data?.terlambat ?? 0}
          </p>
        </div>

        <div className="kartu p-6">
          <p className="text-sm text-redup">Cuti menunggu</p>
          <p className="mt-2 text-3xl font-bold text-tinta">
            {data?.cutiMenunggu ?? 0}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={muatData}
        className="tombol-utama"
      >
        Muat ulang data
      </button>
    </div>
  );
}
