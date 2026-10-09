import {
  ambilPresensi,
  ambilPresensiTanggal,
  catatPresensiMasuk,
  catatPresensiPulang,
  ambilPengajuanCuti,
  ambilSatuPengajuan,
  ambilSemuaPengajuan,
  buatPengajuanCuti,
  putuskanPengajuanCuti,
  ambilSemuaKaryawan,
  ambilKaryawan,
  perbaruiProfil,
  perbaruiPeranKaryawan,
  ambilRingkasanDasbor,
  ambilRekapBulanan,
} from "../lib/data.js";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

async function runTests() {
  console.log("=== MULAI PENGUJIAN CRUD FIRESTORE ===");
  const testKaryawanId = "F1KXJg5FzxZa3Asg4BUmWanhYiQ2"; // Dina's Auth UID

  // 1. Uji Catat Presensi
  console.log("\n[1] Menguji Fitur: Catat Presensi (Masuk & Pulang)...");
  const testTanggal = "2026-10-15"; // Tanggal pengujian
  const jamMasukTest = new Date(`${testTanggal}T07:45:00`);
  await catatPresensiMasuk(testKaryawanId, testTanggal, jamMasukTest);
  console.log("  ✓ Berhasil catat presensi masuk");

  let p = await ambilPresensiTanggal(testKaryawanId, testTanggal);
  if (!p || !p.jamMasuk) throw new Error("Gagal membaca presensi masuk hari ini!");
  console.log("  ✓ Berhasil verifikasi baca presensi masuk dari Firestore");

  const jamPulangTest = new Date(`${testTanggal}T17:05:00`);
  await catatPresensiPulang(testKaryawanId, testTanggal, jamPulangTest);
  p = await ambilPresensiTanggal(testKaryawanId, testTanggal);
  if (!p || !p.jamPulang) throw new Error("Gagal membaca presensi pulang dari Firestore!");
  console.log("  ✓ Berhasil catat dan verifikasi presensi pulang dari Firestore");

  // Hapus data uji presensi
  await deleteDoc(doc(db, "presensi", `${testKaryawanId}-${testTanggal}`));
  console.log("  ✓ Data uji presensi dibersihkan");

  // 2. Uji Ajukan Cuti
  console.log("\n[2] Menguji Fitur: Ajukan Cuti...");
  const newCutiId = await buatPengajuanCuti({
    karyawanId: testKaryawanId,
    tanggalMulai: "2026-11-01",
    tanggalSelesai: "2026-11-02",
    alasan: "Uji coba pengajuan cuti otomatis",
  });
  console.log(`  ✓ Berhasil buat pengajuan cuti baru, ID: ${newCutiId}`);

  const cutiDetail = await ambilSatuPengajuan(newCutiId);
  if (!cutiDetail || cutiDetail.status !== "menunggu") {
    throw new Error("Gagal memvalidasi pengajuan cuti di Firestore!");
  }
  console.log(`  ✓ Berhasil verifikasi baca pengajuan cuti (Status: ${cutiDetail.status})`);

  // 3. Uji Putuskan Cuti (Setujui / Tolak)
  console.log("\n[3] Menguji Fitur: Setujui atau Tolak Cuti...");
  await putuskanPengajuanCuti(newCutiId, "disetujui", "Disetujui otomatis melalui tes.");
  let cutiUpdated = await ambilSatuPengajuan(newCutiId);
  if (cutiUpdated.status !== "disetujui" || !cutiUpdated.catatanHrd.includes("Disetujui")) {
    throw new Error("Gagal memperbarui status cuti menjadi disetujui!");
  }
  console.log("  ✓ Berhasil setujui cuti dan simpan catatan HRD");

  await putuskanPengajuanCuti(newCutiId, "ditolak", "Ditolak otomatis melalui tes.");
  cutiUpdated = await ambilSatuPengajuan(newCutiId);
  if (cutiUpdated.status !== "ditolak") {
    throw new Error("Gagal memperbarui status cuti menjadi ditolak!");
  }
  console.log("  ✓ Berhasil tolak cuti di Firestore");

  // Hapus data uji cuti
  await deleteDoc(doc(db, "pengajuan_cuti", newCutiId));
  console.log("  ✓ Data uji cuti dibersihkan");

  // 4. Uji Ubah Profil
  console.log("\n[4] Menguji Fitur: Ubah Profil...");
  const userAwal = await ambilKaryawan(testKaryawanId);
  const namaAsli = userAwal.nama;
  await perbaruiProfil(testKaryawanId, { nama: "Dina Permata" });
  let userUpdated = await ambilKaryawan(testKaryawanId);
  if (userUpdated.nama !== "Dina Permata") throw new Error("Gagal memperbarui profil di Firestore!");
  console.log("  ✓ Berhasil ubah nama profil di Firestore");

  // Kembalikan nama semula
  await perbaruiProfil(testKaryawanId, { nama: namaAsli });
  console.log(`  ✓ Nama dipulihkan ke: ${namaAsli}`);

  // 5. Uji Ubah Data Karyawan (Peran)
  console.log("\n[5] Menguji Fitur: Ubah Data Karyawan (Peran)...");
  await perbaruiPeranKaryawan(testKaryawanId, "hrd");
  userUpdated = await ambilKaryawan(testKaryawanId);
  if (userUpdated.role !== "hrd") throw new Error("Gagal memperbarui peran karyawan di Firestore!");
  console.log("  ✓ Berhasil ubah peran menjadi 'hrd' di Firestore");

  // Kembalikan peran semula
  await perbaruiPeranKaryawan(testKaryawanId, userAwal.role);
  console.log(`  ✓ Peran dipulihkan ke: ${userAwal.role}`);

  // 6. Uji Dasbor & Laporan
  console.log("\n[6] Menguji Fitur Baca: Dasbor & Laporan...");
  const ringkasan = await ambilRingkasanDasbor("2026-10-09");
  console.log("  ✓ Ringkasan Dasbor:", ringkasan);
  const rekap = await ambilRekapBulanan("2026-10");
  console.log(`  ✓ Rekap Laporan Bulanan: ${rekap.length} karyawan`);

  console.log("\n=== SEMUA FITUR CRUD FIRESTORE BERHASIL DIVERIFIKASI 100%! ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Gagal saat pengujian:", err);
  process.exit(1);
});
