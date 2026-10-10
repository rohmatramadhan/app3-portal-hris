"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import { simpanPengajuanCuti } from "@/lib/data";
import KepalaHalaman from "@/components/KepalaHalaman";
import Ikon from "@/components/Ikon";

const kosong = {
  tanggalMulai: "",
  tanggalSelesai: "",
  alasan: "",
};

export default function HalamanAjukanCuti() {
  const router = useRouter();
  const { pengguna, memuat: penggunaMemuat } = usePengguna();

  const [isian, setIsian] = useState(kosong);
  const [galat, setGalat] = useState({});
  const [tersimpan, setTersimpan] = useState(false);
  const [memproses, setMemproses] = useState(false);

  function ubah(e) {
    const { name, value } = e.target;

    setIsian((sebelumnya) => ({
      ...sebelumnya,
      [name]: value,
    }));

    setGalat((sebelumnya) => ({
      ...sebelumnya,
      [name]: "",
      umum: "",
    }));
  }

  async function kirim(e) {
    e.preventDefault();
    setGalat({});
    setTersimpan(false);

    const g = {};

    if (!isian.tanggalMulai) {
      g.tanggalMulai = "Tanggal mulai wajib diisi.";
    }

    if (!isian.tanggalSelesai) {
      g.tanggalSelesai = "Tanggal selesai wajib diisi.";
    } else if (
      isian.tanggalMulai &&
      isian.tanggalSelesai < isian.tanggalMulai
    ) {
      g.tanggalSelesai =
        "Tanggal selesai harus sama atau setelah tanggal mulai.";
    }

    if (!isian.alasan.trim()) {
      g.alasan = "Alasan wajib diisi.";
    }

    if (Object.keys(g).length > 0) {
      setGalat(g);
      return;
    }

    if (!pengguna?.uid) {
      setGalat({
        umum: "Sesi pengguna tidak ditemukan. Silakan masuk kembali.",
      });
      return;
    }

    setMemproses(true);

    try {
      // Simpan pengajuan ke koleksi pengajuan_cuti di Firestore.
      await simpanPengajuanCuti(pengguna.uid, {
        tanggalMulai: isian.tanggalMulai,
        tanggalSelesai: isian.tanggalSelesai,
        alasan: isian.alasan.trim(),
      });

      setTersimpan(true);

      // Kembali ke daftar setelah data berhasil disimpan.
      router.push("/cuti");
      router.refresh();
    } catch (error) {
      console.error("Gagal menyimpan pengajuan cuti:", error);

      setGalat({
        umum:
          error.code === "permission-denied"
            ? "Akses Firestore ditolak. Periksa Firestore Rules."
            : error.message || "Pengajuan cuti gagal disimpan.",
      });
    } finally {
      setMemproses(false);
    }
  }

  if (penggunaMemuat) {
    return (
      <div className="kartu p-6 text-center">
        Memeriksa sesi pengguna...
      </div>
    );
  }

  if (!pengguna) {
    return (
      <div className="max-w-2xl space-y-6">
        <KepalaHalaman
          judul="Ajukan Cuti"
          keterangan="Silakan masuk sebelum mengajukan cuti."
          warna="kunyit"
          ikon="tambah"
        />
        <div className="kartu p-6">
          <p>Sesi pengguna tidak ditemukan.</p>
          <Link href="/masuk" className="tombol-utama mt-4 inline-flex">
            Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <KepalaHalaman
        judul="Ajukan Cuti"
        keterangan="Isi tanggal dan alasan. HRD memutuskan pengajuanmu di halaman Persetujuan Cuti."
        warna="kunyit"
        ikon="tambah"
      >
        <Link href="/cuti" className="tombol-kedua">
          <Ikon nama="kembali" />
          Daftar Cuti
        </Link>
      </KepalaHalaman>

      <form onSubmit={kirim} noValidate className="kartu space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="tanggalMulai" className="label">
              Tanggal mulai
            </label>
            <input
              id="tanggalMulai"
              name="tanggalMulai"
              type="date"
              value={isian.tanggalMulai}
              onChange={ubah}
              className="isian tabular-nums"
              disabled={memproses}
            />
            {galat.tanggalMulai && (
              <p className="galat">{galat.tanggalMulai}</p>
            )}
          </div>

          <div>
            <label htmlFor="tanggalSelesai" className="label">
              Tanggal selesai
            </label>
            <input
              id="tanggalSelesai"
              name="tanggalSelesai"
              type="date"
              value={isian.tanggalSelesai}
              onChange={ubah}
              className="isian tabular-nums"
              disabled={memproses}
            />
            {galat.tanggalSelesai && (
              <p className="galat">{galat.tanggalSelesai}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="alasan" className="label">
            Alasan
          </label>
          <textarea
            id="alasan"
            name="alasan"
            rows={4}
            value={isian.alasan}
            onChange={ubah}
            className="isian"
            placeholder="Tuliskan alasan pengajuan cuti"
            disabled={memproses}
          />
          {galat.alasan && <p className="galat">{galat.alasan}</p>}
        </div>

        {galat.umum && (
          <p
            role="alert"
            className="rounded-xl border border-menunggu bg-menunggu/15 p-3 text-sm font-bold text-tinta"
          >
            {galat.umum}
          </p>
        )}

        {tersimpan && (
          <p
            role="status"
            className="rounded-xl border border-disetujui bg-disetujui/15 p-3 font-bold text-tinta"
          >
            Pengajuan berhasil disimpan.
          </p>
        )}

        <button
          type="submit"
          disabled={memproses}
          className="tombol-utama px-8 py-3 text-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {memproses ? "Menyimpan..." : "Kirim"}
        </button>
      </form>
    </div>
  );
}