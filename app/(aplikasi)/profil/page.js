"use client";

import { useState } from "react";
import { usePengguna } from "@/lib/pengguna";
import { ubahProfil } from "@/lib/data";
import KepalaHalaman from "@/components/KepalaHalaman";

function FormProfil({ pengguna }) {
  const [nama, setNama] = useState(pengguna?.nama || "");
  const [pesan, setPesan] = useState("");
  const [sedangSimpan, setSedangSimpan] = useState(false);

  async function simpan(e) {
    e.preventDefault();
    if (!nama.trim()) {
      setPesan("Nama wajib diisi.");
      return;
    }

    setSedangSimpan(true);
    try {
      await ubahProfil(pengguna.uid, { nama: nama.trim() });
      setPesan("Nama profil berhasil diperbarui.");
    } catch (err) {
      setPesan("Gagal menyimpan profil: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setSedangSimpan(false);
    }
  }

  const initialAvatar = (nama.trim() || pengguna?.nama || "P").charAt(0);

  return (
    <form onSubmit={simpan} className="kartu overflow-hidden">
      <div className="flex items-center gap-4 border-b border-tinta/10 bg-krem p-6">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-tinta/10 bg-terong text-3xl font-bold text-white shadow-tipis">
          {initialAvatar}
        </span>
        <div>
          <p className="text-xl font-bold text-tinta">{nama.trim() || pengguna?.nama || "Pengguna"}</p>
          <span className="mt-1 inline-block rounded-full border border-tinta/10 bg-kunyit px-3 py-0.5 text-xs font-semibold text-tinta">
            {pengguna?.role === "hrd" ? "HRD" : "Karyawan"}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <label htmlFor="nama" className="label">Nama</label>
          <input id="nama" autoComplete="name" value={nama} onChange={(e) => setNama(e.target.value)} className="isian" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" value={pengguna?.email || ""} readOnly className="isian cursor-not-allowed bg-latar text-redup" />
        </div>
        <div>
          <label htmlFor="peran" className="label">Peran</label>
          <input
            id="peran"
            value={pengguna?.role === "hrd" ? "HRD" : "Karyawan"}
            readOnly
            className="isian cursor-not-allowed bg-latar text-redup"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={sedangSimpan} className="tombol-utama px-8 disabled:opacity-50">
            Simpan
          </button>
          {pesan && <p role="status" className="font-bold text-tinta">{pesan}</p>}
        </div>
      </div>
    </form>
  );
}

// Profil (PRD 4.5) / Profile (PRD 4.5)
export default function HalamanProfil() {
  const { pengguna } = usePengguna();

  return (
    <div className="max-w-2xl space-y-8">
      <KepalaHalaman judul="Profil" keterangan="Nama bisa kamu ubah. Email dan peran diatur oleh HRD." warna="terong" ikon="orang" />
      {pengguna && <FormProfil key={pengguna.uid} pengguna={pengguna} />}
    </div>
  );
}
