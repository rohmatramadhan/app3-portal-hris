/**
 * Fungsi pengambil dan pengubah data langsung ke Cloud Firestore.
 * Mengikuti PRD 7.1 dan aturan AGENTS.md.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { keTanggal, terlambat } from "./waktu";

// Helper mengubah Timestamp Firestore ke objek Date
function ubahWaktu(w) {
  if (!w) return null;
  if (typeof w.toDate === "function") return w.toDate();
  return new Date(w);
}

// Ambil nama karyawan dari koleksi users
async function dapatkanNamaKaryawan(karyawanId) {
  try {
    const snap = await getDoc(doc(db, "users", karyawanId));
    if (snap.exists()) return snap.data().nama ?? "(tidak dikenal)";
  } catch (e) {
    console.error("Gagal mengambil nama karyawan:", e);
  }
  return "(tidak dikenal)";
}

/**
 * Mengambil daftar presensi seorang karyawan untuk bulan tertentu (misal: "2026-09")
 */
export async function ambilPresensi(karyawanId, bulan) {
  if (!karyawanId) return [];
  const q = query(collection(db, "presensi"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);

  const hasil = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.tanggal && data.tanggal.startsWith(bulan)) {
      hasil.push({
        id: d.id,
        karyawanId: data.karyawanId,
        tanggal: data.tanggal,
        jamMasuk: ubahWaktu(data.jamMasuk),
        jamPulang: ubahWaktu(data.jamPulang),
      });
    }
  });

  return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

/**
 * Mengambil catatan presensi seorang karyawan pada satu tanggal tertentu
 */
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  if (!karyawanId || !tanggal) return null;
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      karyawanId: data.karyawanId,
      tanggal: data.tanggal,
      jamMasuk: ubahWaktu(data.jamMasuk),
      jamPulang: ubahWaktu(data.jamPulang),
    };
  }
  return null;
}

/**
 * Mencatat jam masuk ke Firestore
 */
export async function catatMasuk(karyawanId, tanggal, jamMasuk = new Date()) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const data = {
    karyawanId,
    tanggal,
    jamMasuk: Timestamp.fromDate(jamMasuk),
    jamPulang: null,
  };
  await setDoc(docRef, data);
  return {
    id: docRef.id,
    ...data,
    jamMasuk,
  };
}

/**
 * Mencatat jam pulang ke Firestore
 */
export async function catatPulang(karyawanId, tanggal, jamPulang = new Date()) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  await updateDoc(docRef, {
    jamPulang: Timestamp.fromDate(jamPulang),
  });
  return {
    id: docRef.id,
    jamPulang,
  };
}

/**
 * Mengambil daftar pengajuan cuti milik seorang karyawan
 */
export async function ambilPengajuanCuti(karyawanId) {
  if (!karyawanId) return [];
  const q = query(collection(db, "pengajuan_cuti"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);

  const hasil = [];
  snap.forEach((d) => {
    const data = d.data();
    hasil.push({
      id: d.id,
      karyawanId: data.karyawanId,
      tanggalMulai: ubahWaktu(data.tanggalMulai),
      tanggalSelesai: ubahWaktu(data.tanggalSelesai),
      alasan: data.alasan,
      status: data.status,
      catatanHrd: data.catatanHrd || "",
      diajukanPada: ubahWaktu(data.diajukanPada),
    });
  });

  return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
}

/**
 * Mengambil satu rincian pengajuan cuti berdasarkan ID
 */
export async function ambilSatuPengajuan(id) {
  if (!id) return null;
  const docRef = doc(db, "pengajuan_cuti", id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  const data = snap.data();
  const nama = await dapatkanNamaKaryawan(data.karyawanId);

  return {
    id: snap.id,
    karyawanId: data.karyawanId,
    nama,
    tanggalMulai: ubahWaktu(data.tanggalMulai),
    tanggalSelesai: ubahWaktu(data.tanggalSelesai),
    alasan: data.alasan,
    status: data.status,
    catatanHrd: data.catatanHrd || "",
    diajukanPada: ubahWaktu(data.diajukanPada),
  };
}

/**
 * Mengambil semua pengajuan cuti untuk HRD (dengan penyaringan status opsional)
 */
export async function ambilSemuaPengajuan(status) {
  const snap = await getDocs(collection(db, "pengajuan_cuti"));
  const usersSnap = await getDocs(collection(db, "users"));
  const petaNama = {};
  usersSnap.forEach((u) => {
    petaNama[u.id] = u.data().nama;
  });

  const hasil = [];
  snap.forEach((d) => {
    const data = d.data();
    if (!status || status === "semua" || data.status === status) {
      hasil.push({
        id: d.id,
        karyawanId: data.karyawanId,
        nama: petaNama[data.karyawanId] ?? "(tidak dikenal)",
        tanggalMulai: ubahWaktu(data.tanggalMulai),
        tanggalSelesai: ubahWaktu(data.tanggalSelesai),
        alasan: data.alasan,
        status: data.status,
        catatanHrd: data.catatanHrd || "",
        diajukanPada: ubahWaktu(data.diajukanPada),
      });
    }
  });

  return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
}

/**
 * Membuat pengajuan cuti baru
 */
export async function buatPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const semuaSnap = await getDocs(collection(db, "pengajuan_cuti"));
  let nomorMaks = 0;
  semuaSnap.forEach((d) => {
    const num = parseInt(d.id.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num > nomorMaks) nomorMaks = num;
  });
  const idBaru = `C${String(nomorMaks + 1).padStart(3, "0")}`;

  const sekarang = new Date();
  const tMulai = new Date(`${tanggalMulai}T00:00:00`);
  const tSelesai = new Date(`${tanggalSelesai}T00:00:00`);

  const data = {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(tMulai),
    tanggalSelesai: Timestamp.fromDate(tSelesai),
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(sekarang),
  };

  await setDoc(doc(db, "pengajuan_cuti", idBaru), data);
  return idBaru;
}

/**
 * HRD memutuskan status pengajuan cuti (disetujui / ditolak) dan mengisi catatan
 */
export async function putuskanCuti(id, status, catatanHrd = "") {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status,
    catatanHrd,
  });
  return true;
}

/**
 * Mengambil semua data pengguna/karyawan
 */
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  const hasil = [];
  snap.forEach((d) => {
    const data = d.data();
    hasil.push({
      id: d.id,
      nama: data.nama || "(Tanpa Nama)",
      email: data.email || "",
      role: data.role || "karyawan",
    });
  });

  return hasil.sort((a, b) => a.nama.localeCompare(b.nama));
}

/**
 * Mengambil satu data pengguna/karyawan
 */
export async function ambilKaryawan(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    nama: data.nama || "(Tanpa Nama)",
    email: data.email || "",
    role: data.role || "karyawan",
  };
}

/**
 * Mengubah peran karyawan (karyawan / hrd)
 */
export async function ubahPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { role });
  return true;
}

/**
 * Mengubah nama pengguna di profil
 */
export async function ubahNamaPengguna(id, nama) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { nama });
  return true;
}

/**
 * Ringkasan angka untuk Dasbor HRD
 */
export async function ambilRingkasanDasbor(tanggal) {
  const [presensiSnap, cutiSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  let jumlahTerlambat = 0;
  presensiSnap.forEach((d) => {
    const data = d.data();
    if (data.jamMasuk && terlambat(ubahWaktu(data.jamMasuk))) {
      jumlahTerlambat++;
    }
  });

  return {
    hadir: presensiSnap.size,
    terlambat: jumlahTerlambat,
    cutiMenunggu: cutiSnap.size,
    jumlahKaryawan: usersSnap.size,
  };
}

/**
 * Rekap bulanan per karyawan untuk halaman Laporan
 */
export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(collection(db, "pengajuan_cuti")),
  ]);

  const daftarUsers = [];
  usersSnap.forEach((d) => {
    const data = d.data();
    daftarUsers.push({ id: d.id, nama: data.nama || "(Tanpa Nama)" });
  });

  const daftarPresensi = [];
  presensiSnap.forEach((d) => {
    const data = d.data();
    if (data.tanggal && data.tanggal.startsWith(bulan)) {
      daftarPresensi.push({
        karyawanId: data.karyawanId,
        jamMasuk: ubahWaktu(data.jamMasuk),
      });
    }
  });

  const daftarCuti = [];
  cutiSnap.forEach((d) => {
    const data = d.data();
    if (data.status === "disetujui") {
      daftarCuti.push({
        karyawanId: data.karyawanId,
        tanggalMulai: ubahWaktu(data.tanggalMulai),
        tanggalSelesai: ubahWaktu(data.tanggalSelesai),
      });
    }
  });

  return daftarUsers
    .sort((a, b) => a.nama.localeCompare(b.nama))
    .map((u) => {
      const hadir = daftarPresensi.filter((p) => p.karyawanId === u.id);
      let cutiDisetujui = 0;
      for (const c of daftarCuti) {
        if (c.karyawanId !== u.id || !c.tanggalMulai || !c.tanggalSelesai) continue;
        for (let d = new Date(c.tanggalMulai); d <= c.tanggalSelesai; d.setDate(d.getDate() + 1)) {
          if (keTanggal(d).startsWith(bulan)) cutiDisetujui++;
        }
      }

      return {
        karyawanId: u.id,
        nama: u.nama,
        hariHadir: hadir.length,
        terlambat: hadir.filter((p) => terlambat(p.jamMasuk)).length,
        cutiDisetujui,
      };
    });
}
