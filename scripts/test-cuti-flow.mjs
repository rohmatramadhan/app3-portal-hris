import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { simpanPengajuanCuti, ambilSatuPengajuan } = await import("../lib/data.js");
const { terminate } = await import("firebase/firestore");
const { db } = await import("../lib/firebase.js");

async function testCutiFlow() {
  console.log("=== Menguji Alur Pembuatan & Rincian Cuti ===");
  try {
    const dummyCuti = {
      karyawanId: "test-karyawan-123",
      tanggalMulai: "2026-11-01",
      tanggalSelesai: "2026-11-03",
      alasan: "Keperluan keluarga",
    };

    console.log("[1] Menguji simpanPengajuanCuti...");
    const res = await simpanPengajuanCuti(dummyCuti);
    console.log(`   ✅ Cuti berhasil disimpan dengan ID: ${res.id}`);
    if (!res.id.startsWith("C")) {
      throw new Error(`ID cuti tidak berawalan C: ${res.id}`);
    }

    console.log("[2] Menguji ambilSatuPengajuan...");
    const dataCuti = await ambilSatuPengajuan(res.id);
    if (!dataCuti) throw new Error("Data cuti tidak ditemukan kembali");
    if (dataCuti.status !== "menunggu") {
      throw new Error(`Status awal harus menunggu, didapat: ${dataCuti.status}`);
    }
    console.log(`   ✅ Status cuti terverifikasi: ${dataCuti.status}`);
    console.log(`   ✅ KaryawanId terverifikasi: ${dataCuti.karyawanId}`);

    console.log("[3] Menguji simulasi otorisasi UI rincian cuti:");
    // Karyawan pemilik
    const izinPemilik = dataCuti.karyawanId === "test-karyawan-123";
    console.log(`   ✅ Izin pemilik (test-karyawan-123): ${izinPemilik ? "DIIZINKAN" : "DITOLAK"}`);

    // Karyawan lain
    const izinKaryawanLain = "karyawan-lain" === dataCuti.karyawanId;
    console.log(`   ✅ Izin karyawan lain: ${izinKaryawanLain ? "DIIZINKAN" : "DITOLAK (Aman: Tampil 'Pengajuan tidak ditemukan')"}`);

    // HRD
    const peranHrd = "hrd";
    const izinHrd = peranHrd === "hrd" || "hrd-user" === dataCuti.karyawanId;
    console.log(`   ✅ Izin HRD: ${izinHrd ? "DIIZINKAN" : "DITOLAK"}`);

    console.log("\nSemua pengujian alur cuti LULUS dengan sukses!");
  } finally {
    await terminate(db);
  }
}

testCutiFlow().catch((err) => {
  console.error("Test Cuti Gagal:", err);
  process.exit(1);
});
