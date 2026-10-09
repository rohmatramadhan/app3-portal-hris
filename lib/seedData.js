import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { users, presensi, pengajuan_cuti } from "./dataContoh";

/**
 * Mengisi seed data ke Firestore sesuai spesifikasi PRD 7.1 dan Prompt 2.
 * - 5+ karyawan di koleksi users
 * - Catatan presensi bulan ini di koleksi presensi
 * - 6 pengajuan cuti di koleksi pengajuan_cuti
 */
export async function isiSeedData() {
  console.log("Memulai pengisian seed data...");

  // 1. Koleksi users
  for (const u of users) {
    await setDoc(doc(db, "users", u.id), {
      nama: u.nama,
      email: u.email,
      role: u.role,
    });
  }
  console.log(`Berhasil mengisi ${users.length} data users.`);

  // 2. Koleksi presensi
  for (const p of presensi) {
    await setDoc(doc(db, "presensi", p.id), {
      karyawanId: p.karyawanId,
      tanggal: p.tanggal,
      jamMasuk: p.jamMasuk ? Timestamp.fromDate(new Date(p.jamMasuk)) : null,
      jamPulang: p.jamPulang ? Timestamp.fromDate(new Date(p.jamPulang)) : null,
    });
  }
  console.log(`Berhasil mengisi ${presensi.length} data presensi.`);

  // 3. Koleksi pengajuan_cuti
  for (const c of pengajuan_cuti) {
    await setDoc(doc(db, "pengajuan_cuti", c.id), {
      karyawanId: c.karyawanId,
      tanggalMulai: Timestamp.fromDate(new Date(c.tanggalMulai)),
      tanggalSelesai: Timestamp.fromDate(new Date(c.tanggalSelesai)),
      alasan: c.alasan,
      status: c.status,
      catatanHrd: c.catatanHrd || "",
      diajukanPada: Timestamp.fromDate(new Date(c.diajukanPada)),
    });
  }
  console.log(`Berhasil mengisi ${pengajuan_cuti.length} data pengajuan_cuti.`);

  return {
    users: users.length,
    presensi: presensi.length,
    pengajuan_cuti: pengajuan_cuti.length,
  };
}
