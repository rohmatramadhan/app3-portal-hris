"use client";

import { useEffect, useState } from "react";

/**
 * Menjalankan fungsi pengambil data dan melaporkan keadaannya: "memuat", "berhasil", atau "gagal".
 * Data diambil ulang setiap kali isi `kunci` berubah, misalnya bulan di alamat.
 * Keadaan "kosong" diputuskan halaman sendiri dari isi data.
 *
 * Contoh:
 *   const { status, data, cobaLagi } = useAmbilData(() => ambilPresensi(uid, bulan), [uid, bulan]);
 *
 * Runs a data-fetching function and reports its state: "memuat", "berhasil", or "gagal".
 * Data is fetched again whenever the contents of `kunci` change, e.g. the month in the URL.
 * The "kosong" (empty) state is decided by each page from the data itself.
 */
export function useAmbilData(ambil, kunci = []) {
  const [hasil, setHasil] = useState({ untuk: null, status: "memuat", data: null });
  const [percobaan, setPercobaan] = useState(0);
  const untuk = JSON.stringify([...kunci, percobaan]);

  useEffect(() => {
    // Abaikan jawaban lama bila kunci sudah berganti sebelum data tiba / Ignore stale responses if the key changed before data arrived
    let dibatalkan = false;
    ambil()
      .then((data) => {
        if (!dibatalkan) setHasil({ untuk, status: "berhasil", data });
      })
      .catch((error) => {
        console.error("Error fetching data:", {
          name: error?.name,
          code: error?.code,
          message: error?.message,
          stack: error?.stack,
        });
        if (!dibatalkan) setHasil({ untuk, status: "gagal", data: null });
      });
    return () => {
      dibatalkan = true;
    };
    // `ambil` dibuat ulang setiap render, jadi yang dipantau cukup `untuk` / `ambil` is recreated every render, so watching `untuk` is enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [untuk]);

  return {
    // Hasil milik kunci lama dianggap masih memuat / A result for an old key still counts as loading
    status: hasil.untuk === untuk ? hasil.status : "memuat",
    data: hasil.data,
    cobaLagi: () => setPercobaan((n) => n + 1),
  };
}
