"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import { useAmbilData } from "@/lib/useAmbilData";
import { ambilPengajuanCutiFirebase } from "@/lib/data";
import { formatTanggal, lamaHari } from "@/lib/waktu";
import KepalaHalaman from "@/components/KepalaHalaman";
import Ikon from "@/components/Ikon";
import Memuat from "@/components/Memuat";
import Kosong from "@/components/Kosong";
import Gagal from "@/components/Gagal";
import PilStatus from "@/components/PilStatus";

export default function HalamanCuti() {
  const { pengguna, memuat: penggunaMemuat } = usePengguna();
  const router = useRouter();

  const uid = pengguna?.uid ?? "";

  const { status, data, cobaLagi } = useAmbilData(
    () => {
      if (!uid) {
        return Promise.resolve([]);
      }

      return ambilPengajuanCutiFirebase(uid);
    },
    [uid]
  );

  const tombolAjukan = (
    <Link href="/cuti/baru" className="tombol-utama">
      <Ikon nama="tambah" />
      Ajukan Cuti
    </Link>
  );

  if (penggunaMemuat) {
    return <Memuat />;
  }

  if (!pengguna) {
    return (
      <div className="space-y-8">
        <KepalaHalaman
          judul="Cuti Saya"
          keterangan="Silakan masuk untuk melihat pengajuan cuti."
          warna="kunyit"
          ikon="kalender"
        />

        <section className="kartu p-5">
          <p className="text-tinta">
            Sesi pengguna tidak ditemukan.
          </p>

          <Link
            href="/masuk?kembali=%2Fcuti"
            className="tombol-utama mt-4 inline-flex"
          >
            Masuk
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <KepalaHalaman
        judul="Cuti Saya"
        keterangan="Klik salah satu pengajuan untuk melihat rincian dan catatan HRD."
        warna="kunyit"
        ikon="kalender"
      >
        {tombolAjukan}
      </KepalaHalaman>

      <section className="kartu overflow-hidden">
        {status === "memuat" && <Memuat />}

        {status === "gagal" && (
          <div className="p-5">
            <Gagal onCobaLagi={cobaLagi} />
          </div>
        )}

        {status === "berhasil" && data.length === 0 && (
          <div className="p-5">
            <Kosong teks="Kamu belum pernah mengajukan cuti.">
              {tombolAjukan}
            </Kosong>
          </div>
        )}

        {status === "berhasil" && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Tanggal</th>
                  <th>Lama</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {data.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition hover:bg-krem"
                    onClick={() => router.push(`/cuti/${c.id}`)}
                  >
                    <td>
                      <Link
                        href={`/cuti/${c.id}`}
                        className="font-bold text-sedap hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {c.id}
                      </Link>
                    </td>

                    <td className="font-semibold">
                      {formatTanggal(c.tanggalMulai)} –{" "}
                      {formatTanggal(c.tanggalSelesai)}
                    </td>

                    <td>
                      {lamaHari(c.tanggalMulai, c.tanggalSelesai)} hari
                    </td>

                    <td>
                      <PilStatus status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}