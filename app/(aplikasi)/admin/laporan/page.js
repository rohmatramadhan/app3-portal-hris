
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAmbilData } from "@/lib/useAmbilData";
import { ambilRekapBulanan } from "@/lib/data";
import { bulanIni } from "@/lib/waktu";
import Memuat from "@/components/Memuat";

function HalamanLaporanIsi() {
  const searchParams = useSearchParams();
  const dariAlamat = searchParams.get("bulan");

  const bulanAwal =
    /^\d{4}-\d{2}$/.test(dariAlamat ?? "")
      ? dariAlamat
      : bulanIni();

  const [bulanDipilih, setBulanDipilih] = useState(bulanAwal);

  const bulan =
    /^\d{4}-\d{2}$/.test(bulanDipilih)
      ? bulanDipilih
      : bulanAwal;

  const { status, data, cobaLagi } = useAmbilData(
    () => ambilRekapBulanan(bulan),
    [bulan]
  );

  function ubahBulan(event) {
    setBulanDipilih(event.target.value);
  }

  return (
    <div className="space-y-6">
      {/* Banner judul seperti halaman Data Karyawan */}
      <section className="relative overflow-hidden rounded-2xl bg-tinta px-6 py-8 text-white shadow-kartu md:px-9 md:py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-10 text-[150px] font-black leading-none text-white/5"
        >
          HR
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Laporan Bulanan
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
            Rekap kehadiran, keterlambatan, dan cuti karyawan berdasarkan
            periode yang dipilih.
          </p>
        </div>
      </section>

      {/* Kartu utama seperti halaman Data Karyawan */}
      <section className="overflow-hidden rounded-2xl border border-tinta/10 bg-white shadow-kartu">
        {/* Filter periode */}
        <div className="flex flex-col gap-4 border-b border-tinta/10 p-5 md:flex-row md:items-end md:justify-between md:px-6">
          <div>
            <h2 className="text-lg font-bold text-tinta">
              Rekap Kehadiran Karyawan
            </h2>
            <p className="mt-1 text-sm text-redup">
              Pilih bulan untuk melihat ringkasan laporan.
            </p>
          </div>

          <div className="w-full md:w-60">
            <label
              htmlFor="periode-laporan"
              className="mb-2 block text-sm font-semibold text-tinta"
            >
              Periode laporan
            </label>
            <input
              id="periode-laporan"
              type="month"
              value={bulan}
              onChange={ubahBulan}
              className="w-full rounded-xl border border-tinta/15 bg-white px-4 py-3 text-sm text-tinta outline-none transition focus:border-sedap focus:ring-2 focus:ring-sedap/15"
            />
          </div>
        </div>

        {/* Status memuat */}
        {status === "memuat" && (
          <div className="p-6">
            <Memuat />
          </div>
        )}

        {/* Status gagal */}
        {status === "gagal" && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-6 text-center md:m-6">
            <p className="font-semibold text-red-700">
              Data laporan gagal dimuat.
            </p>
            <p className="mt-1 text-sm text-red-600">
              Periksa koneksi dan izin akses Firebase, lalu coba lagi.
            </p>
            <button
              type="button"
              onClick={cobaLagi}
              className="mt-4 rounded-xl bg-sedap px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Data berhasil dimuat */}
        {status !== "memuat" && status !== "gagal" && (
          <>
            {!data || data.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-kunyit/20 text-2xl text-tinta">
                  <span aria-hidden="true">i</span>
                </div>
                <h3 className="mt-4 font-bold text-tinta">
                  Belum ada data laporan
                </h3>
                <p className="mt-2 text-sm text-redup">
                  Belum ada rekap karyawan untuk periode {bulan}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-semibold md:px-6">
                        NAMA KARYAWAN
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        HARI HADIR
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        TERLAMBAT
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        HARI CUTI
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {data.map((item) => (
                      <tr
                        key={item.karyawanId}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tinta/10 bg-kunyit/20 font-bold text-tinta">
                              {(item.nama || "K")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <span className="font-semibold text-tinta">
                              {item.nama || "Tanpa nama"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {item.hariHadir ?? 0}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {item.terlambat ?? 0}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {item.cutiDisetujui ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Informasi jumlah data */}
            {data && data.length > 0 && (
              <div className="border-t border-tinta/10 bg-white px-5 py-4 text-sm text-redup md:px-6">
                Total {data.length} karyawan dalam laporan periode {bulan}.
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function HalamanLaporan() {
  return (
    <Suspense fallback={<Memuat />}>
      <HalamanLaporanIsi />
    </Suspense>
  );
}
