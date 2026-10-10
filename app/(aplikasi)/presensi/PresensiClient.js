
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import { useAmbilData } from "@/lib/useAmbilData";
import {
  ambilPresensi,
  ambilPresensiTanggal,
  catatMasuk,
  catatPulang,
} from "@/lib/data";
import {
  bulanIni,
  formatBulan,
  formatJam,
  formatTanggal,
  keTanggal,
  terlambat,
} from "@/lib/waktu";
import KepalaHalaman from "@/components/KepalaHalaman";
import Ikon from "@/components/Ikon";
import Memuat from "@/components/Memuat";
import Kosong from "@/components/Kosong";
import Gagal from "@/components/Gagal";

export default function PresensiClient() {
  const { pengguna, memuat } = usePengguna();
  const router = useRouter();
  const searchParams = useSearchParams();

  const dariAlamat = searchParams.get("bulan");
  const bulan = /^\d{4}-\d{2}$/.test(dariAlamat ?? "")
    ? dariAlamat
    : bulanIni();

  const uid = pengguna?.uid;
  const tanggalHariIni = keTanggal(new Date());

  const { status, data, cobaLagi } = useAmbilData(
    () => (uid ? ambilPresensi(uid, bulan) : Promise.resolve([])),
    [uid, bulan]
  );

  const [presensiHariIni, setPresensiHariIni] = useState(null);
  const [memuatPresensiHariIni, setMemuatPresensiHariIni] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesanError, setPesanError] = useState("");

  useEffect(() => {
    let aktif = true;

    async function muatPresensiHariIni() {
      if (!uid) {
        setPresensiHariIni(null);
        setMemuatPresensiHariIni(false);
        return;
      }

      setMemuatPresensiHariIni(true);

      try {
        const hasil = await ambilPresensiTanggal(uid, tanggalHariIni);

        if (aktif) {
          setPresensiHariIni(hasil);
          setPesanError("");
        }
      } catch (error) {
        console.error("Gagal memuat presensi hari ini:", error);

        if (aktif) {
          setPesanError(
            "Presensi gagal dimuat. Periksa koneksi dan aturan akses Firebase."
          );
        }
      } finally {
        if (aktif) setMemuatPresensiHariIni(false);
      }
    }

    muatPresensiHariIni();

    return () => {
      aktif = false;
    };
  }, [uid, tanggalHariIni]);

  async function tanganiCatatMasuk() {
    if (!uid || menyimpan) return;

    setMenyimpan(true);
    setPesanError("");

    try {
      const hasil = await catatMasuk(uid, tanggalHariIni);
      setPresensiHariIni(hasil);
      await cobaLagi();
    } catch (error) {
      console.error("Gagal menyimpan jam masuk:", error);
      setPesanError(
        error?.code === "permission-denied"
          ? "Akses ditolak Firebase. Periksa Firestore Rules."
          : error?.message || "Jam masuk gagal disimpan."
      );
    } finally {
      setMenyimpan(false);
    }
  }

  async function tanganiCatatPulang() {
    if (!uid || !presensiHariIni || menyimpan) return;

    setMenyimpan(true);
    setPesanError("");

    try {
      const hasil = await catatPulang(uid, tanggalHariIni);
      setPresensiHariIni(hasil);
      await cobaLagi();
    } catch (error) {
      console.error("Gagal menyimpan jam pulang:", error);
      setPesanError(
        error?.code === "permission-denied"
          ? "Akses ditolak Firebase. Periksa Firestore Rules."
          : error?.message || "Jam pulang gagal disimpan."
      );
    } finally {
      setMenyimpan(false);
    }
  }

  const jumlahTerlambat = data
    ? data.filter((item) => terlambat(item.jamMasuk)).length
    : 0;

  if (memuat || !pengguna) {
    return <Memuat />;
  }

  const sudahMasuk = Boolean(presensiHariIni?.jamMasuk);
  const sudahPulang = Boolean(presensiHariIni?.jamPulang);

  return (
    <div className="space-y-8">
      <KepalaHalaman
        judul="Presensi Saya"
        keterangan="Catat jam masuk saat tiba dan jam pulang sebelum meninggalkan dapur."
        ikon="jam"
      />

      <section className="kartu grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold tracking-wide text-sedap uppercase">
            Hari ini
          </p>

          <p className="mt-1 text-2xl font-bold text-tinta tabular-nums">
            {memuatPresensiHariIni && "Memuat presensi..."}
            {!memuatPresensiHariIni &&
              !sudahMasuk &&
              "Belum presensi"}
            {!memuatPresensiHariIni &&
              sudahMasuk &&
              !sudahPulang &&
              `Masuk pukul ${formatJam(presensiHariIni.jamMasuk)}`}
            {!memuatPresensiHariIni &&
              sudahPulang &&
              `Pulang pukul ${formatJam(presensiHariIni.jamPulang)}`}
          </p>

          {!memuatPresensiHariIni && sudahMasuk && (
            <p className="mt-1 text-sm font-semibold text-redup">
              {terlambat(presensiHariIni.jamMasuk)
                ? "Terlambat."
                : "Tepat waktu."}
              {" "}
              Data tersimpan di Firebase.
            </p>
          )}

          {pesanError && (
            <p className="mt-2 text-sm font-semibold text-red-700">
              {pesanError}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={tanganiCatatMasuk}
            disabled={
              memuatPresensiHariIni ||
              sudahMasuk ||
              menyimpan
            }
            className="tombol-utama px-6 py-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ikon nama="masuk" />
            {menyimpan && !sudahMasuk ? "Menyimpan..." : "Catat Masuk"}
          </button>

          <button
            type="button"
            onClick={tanganiCatatPulang}
            disabled={
              memuatPresensiHariIni ||
              !sudahMasuk ||
              sudahPulang ||
              menyimpan
            }
            className="tombol-kunyit px-6 py-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ikon nama="keluar" />
            {menyimpan && sudahMasuk && !sudahPulang
              ? "Menyimpan..."
              : "Catat Pulang"}
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
              onChange={(e) =>
                e.target.value &&
                router.replace(`/presensi?bulan=${e.target.value}`)
              }
              className="isian w-auto py-1.5"
            />
          </label>

          {status === "berhasil" && (
            <div className="flex gap-3 tabular-nums">
              <span className="rounded-xl border border-tinta/10 bg-sedap px-4 py-1.5 font-bold text-white">
                <span className="text-xl font-bold">{data.length}</span>{" "}
                hadir
              </span>

              <span className="rounded-xl border border-tinta/10 bg-ditolak/15 px-4 py-1.5 font-bold text-tinta">
                <span className="text-xl font-bold">
                  {jumlahTerlambat}
                </span>{" "}
                terlambat
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          {status === "memuat" && <Memuat />}

          {status === "gagal" && <Gagal onCobaLagi={cobaLagi} />}

          {status === "berhasil" && data.length === 0 && (
            <Kosong
              teks={`Belum ada catatan presensi di ${formatBulan(
                bulan
              )}. Catat masuk untuk mulai membuat riwayat presensi.`}
            />
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
                  {data.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        terlambat(item.jamMasuk)
                          ? "bg-ditolak/5"
                          : ""
                      }
                    >
                      <td className="font-semibold">
                        {formatTanggal(item.tanggal)}
                      </td>
                      <td>{formatJam(item.jamMasuk)}</td>
                      <td>{formatJam(item.jamPulang)}</td>
                      <td>
                        {terlambat(item.jamMasuk) ? (
                          <span className="font-semibold text-red-700">
                            Terlambat
                          </span>
                        ) : (
                          <span className="font-semibold text-sedap">
                            Tepat waktu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
