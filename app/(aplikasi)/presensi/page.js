"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import { useAmbilData } from "@/lib/useAmbilData";
import { ambilPresensi, ambilPresensiTanggal, catatPresensi } from "@/lib/data";
import { bulanIni, formatBulan, formatJam, formatTanggal, tanggalHariIni, terlambat } from "@/lib/waktu";
import KepalaHalaman from "@/components/KepalaHalaman";
import Ikon from "@/components/Ikon";
import Memuat from "@/components/Memuat";
import Kosong from "@/components/Kosong";
import Gagal from "@/components/Gagal";

// Presensi Saya (PRD 4.3)
export default function HalamanPresensi() {
  const { pengguna } = usePengguna();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Bulan disimpan di alamat (?bulan=2026-09) supaya tetap terpilih saat dimuat ulang
  const dariAlamat = searchParams.get("bulan");
  const bulan = /^\d{4}-\d{2}$/.test(dariAlamat ?? "") ? dariAlamat : bulanIni();
  const hariIni = tanggalHariIni();

  const { status, data, cobaLagi } = useAmbilData(() => ambilPresensi(pengguna?.uid, bulan), [pengguna?.uid, bulan]);

  const [presensiHariIni, setPresensiHariIni] = useState(null);
  const [memproses, setMemproses] = useState(false);

  useEffect(() => {
    if (pengguna?.uid) {
      ambilPresensiTanggal(pengguna.uid, hariIni).then((res) => {
        setPresensiHariIni(res);
      });
    }
  }, [pengguna?.uid, hariIni]);

  const jamMasuk = presensiHariIni?.jamMasuk ?? null;
  const jamPulang = presensiHariIni?.jamPulang ?? null;
  const jumlahTerlambat = data ? data.filter((p) => p.jamMasuk && terlambat(p.jamMasuk)).length : 0;

  async function handleCatatMasuk() {
    setMemproses(true);
    try {
      await catatPresensi(pengguna.uid, hariIni, "masuk");
      const terbaru = await ambilPresensiTanggal(pengguna.uid, hariIni);
      setPresensiHariIni(terbaru);
      cobaLagi();
    } catch (err) {
      console.error("Gagal mencatat jam masuk:", err);
    } finally {
      setMemproses(false);
    }
  }

  async function handleCatatPulang() {
    setMemproses(true);
    try {
      await catatPresensi(pengguna.uid, hariIni, "pulang");
      const terbaru = await ambilPresensiTanggal(pengguna.uid, hariIni);
      setPresensiHariIni(terbaru);
      cobaLagi();
    } catch (err) {
      console.error("Gagal mencatat jam pulang:", err);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <div className="space-y-8">
      <KepalaHalaman judul="Presensi Saya" keterangan="Catat jam masuk saat tiba dan jam pulang sebelum meninggalkan dapur." ikon="jam" />

      <section className="kartu grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold tracking-wide text-sedap uppercase">Hari ini</p>
          <p className="mt-1 text-2xl font-bold text-tinta tabular-nums">
            {jamMasuk === null && "Belum presensi"}
            {jamMasuk !== null && jamPulang === null && `Masuk pukul ${formatJam(jamMasuk)}`}
            {jamPulang !== null && `Pulang pukul ${formatJam(jamPulang)}`}
          </p>
          {jamMasuk !== null && (
            <p className="mt-1 text-sm font-semibold text-redup">
              {terlambat(jamMasuk) ? "Terlambat (setelah 08.00)." : "Tepat waktu."}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCatatMasuk}
            disabled={jamMasuk !== null || memproses}
            className="tombol-utama px-6 py-3 text-lg disabled:opacity-60"
          >
            <Ikon nama="masuk" />
            Catat Masuk
          </button>
          <button
            type="button"
            onClick={handleCatatPulang}
            disabled={jamMasuk === null || jamPulang !== null || memproses}
            className="tombol-kunyit px-6 py-3 text-lg disabled:opacity-60"
          >
            <Ikon nama="keluar" />
            Catat Pulang
          </button>
        </div>
      </section>

      <section className="kartu overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tinta/10 p-5">
          <label className="flex items-center gap-3 font-bold text-tinta">
            Riwayat bulan
            <input
              type="month"
              value={bulan}
              onChange={(e) => e.target.value && router.replace(`/presensi?bulan=${e.target.value}`)}
              className="isian w-auto py-1.5"
            />
          </label>
          {status === "berhasil" && (
            <div className="flex gap-3 tabular-nums">
              <span className="rounded-xl border border-tinta/10 bg-sedap px-4 py-1.5 font-bold text-white">
                <span className="text-xl font-bold">{data.length}</span> hadir
              </span>
              <span className="rounded-xl border border-tinta/10 bg-ditolak/15 px-4 py-1.5 font-bold text-tinta">
                <span className="text-xl font-bold">{jumlahTerlambat}</span> terlambat
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          {status === "memuat" && <Memuat />}
          {status === "gagal" && <Gagal onCobaLagi={cobaLagi} />}
          {status === "berhasil" && data.length === 0 && (
            <Kosong teks={`Belum ada catatan presensi di ${formatBulan(bulan)}. Pilih bulan lain untuk melihat riwayat.`} />
          )}
          {status === "berhasil" && data.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-tinta/10">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jam Masuk</th>
                    <th>Jam Pulang</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => {
                    const telat = p.jamMasuk ? terlambat(p.jamMasuk) : false;
                    return (
                      <tr key={p.id}>
                        <td className="font-semibold text-tinta">{formatTanggal(p.tanggal)}</td>
                        <td className="tabular-nums font-semibold">{formatJam(p.jamMasuk)}</td>
                        <td className="tabular-nums font-semibold">{formatJam(p.jamPulang)}</td>
                        <td>
                          {telat ? (
                            <span className="inline-block rounded-full bg-ditolak/15 px-3 py-0.5 text-xs font-semibold text-ditolak">
                              Terlambat
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-disetujui/15 px-3 py-0.5 text-xs font-semibold text-disetujui">
                              Tepat waktu
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
