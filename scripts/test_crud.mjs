import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";
import {
  catatMasuk,
  catatPulang,
  ambilPresensiTanggal,
  ajukanCuti,
  ambilSatuPengajuan,
  putuskanCuti,
  ubahNamaProfil,
  ubahPeranKaryawan,
  ambilKaryawan,
} from "../lib/data.js";

async function runTests() {
  console.log("=== MEMULAI PENGUJIAN FITUR CRUD PADA FIRESTORE ===");
  const testId = "test-emp-" + Date.now();

  // 1. Uji Catat Presensi (Masuk & Pulang)
  console.log("\n[1] Menguji Catat Presensi...");
  const masuk = await catatMasuk(testId);
  console.log("-> Catat Masuk berhasil:", masuk.tanggal, "Jam:", masuk.jamMasuk?.toLocaleTimeString());

  const pulang = await catatPulang(testId);
  console.log("-> Catat Pulang berhasil:", "Jam:", pulang.jamPulang?.toLocaleTimeString());

  const cekPresensi = await ambilPresensiTanggal(testId, masuk.tanggal);
  if (cekPresensi && cekPresensi.jamMasuk && cekPresensi.jamPulang) {
    console.log("✓ Verifikasi Presensi Firestore: BERHASIL");
  } else {
    throw new Error("Presensi gagal diverifikasi dari Firestore");
  }

  // 2. Uji Ajukan Cuti
  console.log("\n[2] Menguji Ajukan Cuti...");
  const cutiBaru = await ajukanCuti({
    karyawanId: testId,
    tanggalMulai: "2026-10-25",
    tanggalSelesai: "2026-10-27",
    alasan: "Uji coba pengajuan cuti otomatis",
  });
  console.log("-> Pengajuan Cuti tersimpan ID:", cutiBaru.id, "Status:", cutiBaru.status);

  const satuCuti = await ambilSatuPengajuan(cutiBaru.id);
  if (satuCuti && satuCuti.status === "menunggu" && satuCuti.alasan === "Uji coba pengajuan cuti otomatis") {
    console.log("✓ Verifikasi Ajukan Cuti Firestore: BERHASIL");
  } else {
    throw new Error("Pengajuan cuti gagal diverifikasi dari Firestore");
  }

  // 3. Uji Setujui & Tolak Cuti (Persetujuan Cuti)
  console.log("\n[3] Menguji Setujui dan Tolak Cuti...");
  await putuskanCuti(cutiBaru.id, "disetujui", "Disetujui untuk uji coba.");
  let cutiUpdated = await ambilSatuPengajuan(cutiBaru.id);
  if (cutiUpdated.status === "disetujui" && cutiUpdated.catatanHrd === "Disetujui untuk uji coba.") {
    console.log("-> Putuskan Cuti 'disetujui' berhasil");
  } else {
    throw new Error("Gagal mengubah status menjadi disetujui");
  }

  await putuskanCuti(cutiBaru.id, "ditolak", "Ditolak untuk uji coba.");
  cutiUpdated = await ambilSatuPengajuan(cutiBaru.id);
  if (cutiUpdated.status === "ditolak" && cutiUpdated.catatanHrd === "Ditolak untuk uji coba.") {
    console.log("-> Putuskan Cuti 'ditolak' berhasil");
    console.log("✓ Verifikasi Setujui/Tolak Cuti Firestore: BERHASIL");
  } else {
    throw new Error("Gagal mengubah status menjadi ditolak");
  }

  // 4. Uji Ubah Profil
  console.log("\n[4] Menguji Ubah Profil...");
  await ubahNamaProfil("dina", "Dina Oktaviani");
  const dinaUpdated = await ambilKaryawan("dina");
  if (dinaUpdated.nama === "Dina Oktaviani") {
    console.log("-> Nama profil berhasil diubah:", dinaUpdated.nama);
    // Kembalikan ke nama awal
    await ubahNamaProfil("dina", "Dina");
    console.log("✓ Verifikasi Ubah Profil Firestore: BERHASIL");
  } else {
    throw new Error("Gagal memperbarui profil di Firestore");
  }

  // 5. Uji Ubah Peran Karyawan
  console.log("\n[5] Menguji Ubah Data Karyawan (Peran)...");
  await ubahPeranKaryawan("rama", "hrd");
  let ramaUpdated = await ambilKaryawan("rama");
  if (ramaUpdated.role === "hrd") {
    console.log("-> Peran berhasil diubah menjadi HRD");
    // Kembalikan ke role awal
    await ubahPeranKaryawan("rama", "karyawan");
    console.log("-> Peran berhasil dikembalikan menjadi Karyawan");
    console.log("✓ Verifikasi Ubah Peran Karyawan Firestore: BERHASIL");
  } else {
    throw new Error("Gagal memperbarui peran karyawan di Firestore");
  }

  // Bersihkan data tes presensi & cuti
  const { db } = await import("../lib/firebase.js");
  await deleteDoc(doc(db, "presensi", `${testId}-${masuk.tanggal}`));
  await deleteDoc(doc(db, "pengajuan_cuti", cutiBaru.id));
  console.log("\nData sementara pengujian telah dibersihkan.");

  console.log("\n=======================================================");
  console.log("SEMUA 5 FITUR CRUD BERFUNGSI SEMPURNA DENGAN FIRESTORE!");
  console.log("=======================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Gagal saat pengujian:", err);
  process.exit(1);
});
