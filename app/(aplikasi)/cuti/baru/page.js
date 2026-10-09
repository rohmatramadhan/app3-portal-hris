"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePengguna } from "@/lib/pengguna";
import { buatPengajuanCuti } from "@/lib/data";
import KepalaHalaman from "@/components/KepalaHalaman";
import Ikon from "@/components/Ikon";

const kosong = { tanggalMulai: "", tanggalSelesai: "", alasan: "" };

// Ajukan Cuti (PRD 4.4.1). Tersambung penuh ke Firestore
export default function HalamanAjukanCuti() {
  const router = useRouter();
  const { pengguna } = usePengguna();
  const [isian, setIsian] = useState(kosong);
  const [galat, setGalat] = useState({});
  const [tersimpan, setTersimpan] = useState(false);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [pesanGalat, setPesanGalat] = useState("");

  const ubah = (e) => setIsian({ ...isian, [e.target.name]: e.target.value });

  async function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!isian.tanggalMulai) g.tanggalMulai = "Tanggal mulai wajib diisi.";
    if (!isian.tanggalSelesai) g.tanggalSelesai = "Tanggal selesai wajib diisi.";
    else if (isian.tanggalMulai && isian.tanggalSelesai < isian.tanggalMulai)
      g.tanggalSelesai = "Tanggal selesai harus sama atau setelah tanggal mulai";
    if (!isian.alasan.trim()) g.alasan = "Alasan wajib diisi.";
    setGalat(g);
    if (Object.keys(g).length > 0) return;

    if (!pengguna?.uid) {
      setPesanGalat("Kamu harus masuk terlebih dahulu.");
      return;
    }

    setSedangKirim(true);
    setPesanGalat("");
    try {
      const idBaru = await buatPengajuanCuti({
        karyawanId: pengguna.uid,
        tanggalMulai: isian.tanggalMulai,
        tanggalSelesai: isian.tanggalSelesai,
        alasan: isian.alasan.trim(),
      });

      setTersimpan(true);
      setTimeout(() => {
        router.push(`/cuti/${idBaru}`);
      }, 800);
    } catch (err) {
      console.error("Gagal mengajukan cuti:", err);
      setPesanGalat(`Gagal mengajukan cuti: ${err.message}`);
    } finally {
      setSedangKirim(false);
    }
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
            />
            {galat.tanggalMulai && <p className="galat">{galat.tanggalMulai}</p>}
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
            />
            {galat.tanggalSelesai && <p className="galat">{galat.tanggalSelesai}</p>}
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
          />
          {galat.alasan && <p className="galat">{galat.alasan}</p>}
        </div>

        {pesanGalat && (
          <p role="status" className="rounded-xl border border-ditolak/30 bg-ditolak/10 p-3 text-sm font-bold text-red-700">
            {pesanGalat}
          </p>
        )}

        <button
          type="submit"
          disabled={tersimpan || sedangKirim}
          className="tombol-utama px-8 py-3 text-lg"
        >
          {sedangKirim ? "Menyimpan ke Firestore..." : "Kirim"}
        </button>
        {tersimpan && (
          <p role="status" className="rounded-xl border border-disetujui bg-disetujui/15 p-3 font-bold text-tinta">
            Pengajuan berhasil disimpan ke Firestore! Membuka rincian pengajuan...
          </p>
        )}
      </form>
    </div>
  );
}
