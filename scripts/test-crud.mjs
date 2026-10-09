import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const {
  ambilPresensi,
  ambilPresensiTanggal,
  simpanPresensiMasuk,
  simpanPresensiPulang,
  ambilPengajuanCuti,
  ambilSatuPengajuan,
  ambilSemuaPengajuan,
  simpanPengajuanCuti,
  simpanKeputusanCuti,
  ambilSemuaKaryawan,
  ambilKaryawan,
  simpanProfil,
  simpanPeranKaryawan,
  ambilRingkasanDasbor,
  ambilRekapBulanan,
} = await import("../lib/data.js");

const { db } = await import("../lib/firebase.js");
const { terminate } = await import("firebase/firestore");

async function testCRUD() {
  console.log("=== Menguji Seluruh Fitur CRUD dengan Cloud Firestore ===");

  // 1. Uji Baca Karyawan
  console.log("\n[1] Menguji Baca Karyawan (users)...");
  const semuaKaryawan = await ambilSemuaKaryawan();
  console.log(`   ✅ Berhasil mengambil ${semuaKaryawan.length} karyawan.`);
  const dina = await ambilKaryawan("dina");
  if (!dina) throw new Error("Karyawan 'dina' tidak ditemukan di Firestore");
  console.log(`   ✅ Detail Dina: Nama=${dina.nama}, Role=${dina.role}`);

  // 2. Uji Ubah Profil
  console.log("\n[2] Menguji Ubah Profil (users)...");
  const namaAsli = dina.nama;
  const namaBaru = "Dina Puspita";
  await simpanProfil("dina", { nama: namaBaru });
  const dinaBaru = await ambilKaryawan("dina");
  if (dinaBaru.nama !== namaBaru) throw new Error("Gagal mengubah nama profil Dina");
  console.log(`   ✅ Profil berhasil diubah menjadi: ${dinaBaru.nama}`);
  // Kembalikan nama asli
  await simpanProfil("dina", { nama: namaAsli });
  console.log(`   ✅ Profil dikembalikan ke nama awal: ${namaAsli}`);

  // 3. Uji Ubah Peran Karyawan
  console.log("\n[3] Menguji Ubah Peran Karyawan (users)...");
  const peranAsli = dina.role;
  await simpanPeranKaryawan("dina", "hrd");
  const dinaHrd = await ambilKaryawan("dina");
  if (dinaHrd.role !== "hrd") throw new Error("Gagal mengubah peran karyawan");
  console.log(`   ✅ Peran Dina berhasil diubah ke: ${dinaHrd.role}`);
  await simpanPeranKaryawan("dina", peranAsli);
  console.log(`   ✅ Peran Dina dikembalikan ke: ${peranAsli}`);

  // 4. Uji Catat Presensi (Masuk & Pulang)
  console.log("\n[4] Menguji Catat Presensi (presensi)...");
  const hasilMasuk = await simpanPresensiMasuk("dina");
  console.log(`   ✅ Catat masuk berhasil: Tanggal=${hasilMasuk.tanggal}, JamMasuk=${hasilMasuk.jamMasuk.toLocaleTimeString()}`);
  const hasilPulang = await simpanPresensiPulang("dina");
  console.log(`   ✅ Catat pulang berhasil: JamPulang=${hasilPulang.toLocaleTimeString()}`);
  const presensiHariIni = await ambilPresensiTanggal("dina", hasilMasuk.tanggal);
  if (!presensiHariIni || !presensiHariIni.jamPulang) throw new Error("Presensi hari ini tidak tersimpan sempurna");
  console.log(`   ✅ Verifikasi baca presensi hari ini: Sukses (JamPulang tercatat)`);

  const riwayatOktober = await ambilPresensi("dina", "2026-10");
  console.log(`   ✅ Riwayat presensi Oktober untuk Dina: ${riwayatOktober.length} catatan`);

  // 5. Uji Ajukan Cuti & Putuskan Cuti
  console.log("\n[5] Menguji Ajukan Cuti & Putuskan Cuti (pengajuan_cuti)...");
  const cutiBaru = await simpanPengajuanCuti({
    karyawanId: "dina",
    tanggalMulai: "2026-11-02",
    tanggalSelesai: "2026-11-03",
    alasan: "Keperluan keluarga di luar kota",
  });
  console.log(`   ✅ Pengajuan cuti baru berhasil dibuat: ID=${cutiBaru.id}`);

  const detailCuti = await ambilSatuPengajuan(cutiBaru.id);
  if (!detailCuti || detailCuti.status !== "menunggu") throw new Error("Detail pengajuan cuti baru tidak valid");
  console.log(`   ✅ Verifikasi baca pengajuan cuti: ID=${detailCuti.id}, Pemohon=${detailCuti.nama}, Status=${detailCuti.status}`);

  // Setujui cuti
  await simpanKeputusanCuti(cutiBaru.id, { status: "disetujui", catatanHrd: "Disetujui untuk uji coba" });
  const cutiDisetujui = await ambilSatuPengajuan(cutiBaru.id);
  if (cutiDisetujui.status !== "disetujui" || cutiDisetujui.catatanHrd !== "Disetujui untuk uji coba") {
    throw new Error("Gagal memperbarui status keputusan cuti");
  }
  console.log(`   ✅ Verifikasi keputusan cuti: Status=${cutiDisetujui.status}, Catatan="${cutiDisetujui.catatanHrd}"`);

  // 6. Uji Ringkasan Dasbor & Laporan
  console.log("\n[6] Menguji Ringkasan Dasbor & Laporan...");
  const dasbor = await ambilRingkasanDasbor(hasilMasuk.tanggal);
  console.log(`   ✅ Dasbor HRD: Hadir=${dasbor.hadir}, Terlambat=${dasbor.terlambat}, CutiMenunggu=${dasbor.cutiMenunggu}, Karyawan=${dasbor.jumlahKaryawan}`);

  const rekap = await ambilRekapBulanan("2026-10");
  console.log(`   ✅ Rekap Laporan Oktober: ${rekap.length} baris rekap karyawan`);

  console.log("\n🎉 SELURUH FITUR CRUD BERHASIL TERHUBUNG DAN TERUJI DENGAN FIRESTORE!");
  await terminate(db);
  process.exit(0);
}

testCRUD().catch(async (err) => {
  console.error("\n❌ Pengujian CRUD gagal:", err);
  try {
    await terminate(db);
  } catch {}
  process.exit(1);
});
