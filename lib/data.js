/**
 * Semua halaman mengambil dan memanipulasi data lewat fungsi di sini.
 * Terhubung langsung ke Cloud Firestore (users, presensi, pengajuan_cuti).
 * Bentuk keluarannya dipertahankan sesuai kontrak awal agar halaman tidak rusak.
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
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { keTanggal, terlambat } from "./waktu";

// Helper mengubah Firestore Timestamp ke JavaScript Date
function toDate(val) {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  return null;
}

// ==========================================
// 1. PRESENSI
// ==========================================

// Ambil riwayat presensi satu karyawan untuk bulan tertentu ("2026-10")
export async function ambilPresensi(karyawanId, bulan) {
  if (!karyawanId) return [];
  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId),
    where("tanggal", ">=", `${bulan}-01`),
    where("tanggal", "<=", `${bulan}-31`)
  );
  const snap = await getDocs(q);
  const hasil = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      jamMasuk: toDate(data.jamMasuk),
      jamPulang: toDate(data.jamPulang),
    };
  });
  return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// Ambil satu catatan presensi pada tanggal tertentu ("2026-10-09")
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  if (!karyawanId || !tanggal) return null;
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    jamMasuk: toDate(data.jamMasuk),
    jamPulang: toDate(data.jamPulang),
  };
}

// Catat Masuk (buat dokumen presensi baru untuk hari ini)
export async function catatPresensiMasuk(karyawanId, tanggal, waktu = new Date()) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const data = {
    karyawanId,
    tanggal,
    jamMasuk: Timestamp.fromDate(waktu),
    jamPulang: null,
  };
  await setDoc(docRef, data);
  return {
    id: docRef.id,
    ...data,
    jamMasuk: waktu,
    jamPulang: null,
  };
}

// Catat Pulang (update field jamPulang pada catatan hari ini)
export async function catatPresensiPulang(karyawanId, tanggal, waktu = new Date()) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  await updateDoc(docRef, {
    jamPulang: Timestamp.fromDate(waktu),
  });
  return waktu;
}

// ==========================================
// 2. PENGAJUAN CUTI
// ==========================================

const terbaruDulu = (a, b) => (b.diajukanPada?.getTime?.() ?? 0) - (a.diajukanPada?.getTime?.() ?? 0);

// Helper untuk melengkapi nama karyawan pemohon
async function dapatkanPetaNama() {
  const snap = await getDocs(collection(db, "users"));
  const peta = {};
  snap.docs.forEach((d) => {
    peta[d.id] = d.data().nama ?? "(tidak dikenal)";
  });
  return peta;
}

// Ambil pengajuan cuti milik satu karyawan
export async function ambilPengajuanCuti(karyawanId) {
  if (!karyawanId) return [];
  const q = query(collection(db, "pengajuan_cuti"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  const hasil = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      tanggalMulai: toDate(data.tanggalMulai),
      tanggalSelesai: toDate(data.tanggalSelesai),
      diajukanPada: toDate(data.diajukanPada),
    };
  });
  return hasil.sort(terbaruDulu);
}

// Ambil satu detail pengajuan cuti berdasarkan ID dokumen
export async function ambilSatuPengajuan(id) {
  if (!id) return null;
  const docRef = doc(db, "pengajuan_cuti", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();

  // Dapatkan nama karyawan
  let nama = "(tidak dikenal)";
  if (data.karyawanId) {
    const userSnap = await getDoc(doc(db, "users", data.karyawanId));
    if (userSnap.exists()) nama = userSnap.data().nama;
  }

  return {
    id: snap.id,
    ...data,
    nama,
    tanggalMulai: toDate(data.tanggalMulai),
    tanggalSelesai: toDate(data.tanggalSelesai),
    diajukanPada: toDate(data.diajukanPada),
  };
}

// Ambil semua pengajuan cuti (untuk HRD) dengan opsi saringan status
export async function ambilSemuaPengajuan(status) {
  const petaNama = await dapatkanPetaNama();
  let q;
  if (status && status !== "semua") {
    q = query(collection(db, "pengajuan_cuti"), where("status", "==", status));
  } else {
    q = collection(db, "pengajuan_cuti");
  }
  const snap = await getDocs(q);
  const hasil = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      nama: petaNama[data.karyawanId] ?? "(tidak dikenal)",
      tanggalMulai: toDate(data.tanggalMulai),
      tanggalSelesai: toDate(data.tanggalSelesai),
      diajukanPada: toDate(data.diajukanPada),
    };
  });
  return hasil.sort(terbaruDulu);
}

// Buat pengajuan cuti baru
export async function ajukanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  // Format id C001, C002, dst atau ID unik
  const snapSemua = await getDocs(collection(db, "pengajuan_cuti"));
  const nomorBerikutnya = `C${String(snapSemua.size + 1).padStart(3, "0")}`;

  const docRef = doc(db, "pengajuan_cuti", nomorBerikutnya);
  const mulaiDate = new Date(`${tanggalMulai}T00:00:00`);
  const selesaiDate = new Date(`${tanggalSelesai}T00:00:00`);
  const sekarang = new Date();

  const data = {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(mulaiDate),
    tanggalSelesai: Timestamp.fromDate(selesaiDate),
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(sekarang),
  };

  await setDoc(docRef, data);
  return { id: docRef.id, ...data };
}

// Putuskan cuti oleh HRD (setujui / tolak)
export async function putuskanPengajuanCuti(id, status, catatanHrd = "") {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status,
    catatanHrd,
  });
}

// ==========================================
// 3. KARYAWAN & PROFIL (USERS)
// ==========================================

// Ambil semua karyawan
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  const hasil = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  return hasil.sort((a, b) => (a.nama ?? "").localeCompare(b.nama ?? ""));
}

// Ambil satu data karyawan
export async function ambilKaryawan(id) {
  if (!id) return null;
  const docRef = doc(db, "users", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
  };
}

// Ubah nama profil sendiri
export async function perbaruiProfil(uid, { nama }) {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, { nama: nama.trim() });
}

// Ubah peran karyawan oleh HRD
export async function perbaruiPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { role });
}

// ==========================================
// 4. RINGKASAN DASBOR & LAPORAN
// ==========================================

// Angka untuk Dasbor HRD
export async function ambilRingkasanDasbor(tanggal) {
  const [snapPresensi, snapCuti, snapUsers] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  const daftarPresensi = snapPresensi.docs.map((d) => {
    const data = d.data();
    return { ...data, jamMasuk: toDate(data.jamMasuk) };
  });

  return {
    hadir: daftarPresensi.length,
    terlambat: daftarPresensi.filter((p) => p.jamMasuk && terlambat(p.jamMasuk)).length,
    cutiMenunggu: snapCuti.size,
    jumlahKaryawan: snapUsers.size,
  };
}

// Rekap bulanan untuk Laporan HRD
export async function ambilRekapBulanan(bulan) {
  const [usersList, snapPresensi, snapCuti] = await Promise.all([
    ambilSemuaKaryawan(),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const semuaPresensi = snapPresensi.docs
    .map((d) => {
      const data = d.data();
      return {
        ...data,
        jamMasuk: toDate(data.jamMasuk),
      };
    })
    .filter((p) => p.tanggal && p.tanggal.startsWith(bulan));

  const semuaCuti = snapCuti.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      tanggalMulai: toDate(data.tanggalMulai),
      tanggalSelesai: toDate(data.tanggalSelesai),
    };
  });

  return usersList.map((u) => {
    const hadir = semuaPresensi.filter((p) => p.karyawanId === u.id);
    let cutiDisetujui = 0;
    for (const c of semuaCuti) {
      if (c.karyawanId !== u.id || !c.tanggalMulai || !c.tanggalSelesai) continue;
      for (let d = new Date(c.tanggalMulai); d <= c.tanggalSelesai; d.setDate(d.getDate() + 1)) {
        if (keTanggal(d).startsWith(bulan)) cutiDisetujui++;
      }
    }
    return {
      karyawanId: u.id,
      nama: u.nama,
      hariHadir: hadir.length,
      terlambat: hadir.filter((p) => p.jamMasuk && terlambat(p.jamMasuk)).length,
      cutiDisetujui,
    };
  });
}
