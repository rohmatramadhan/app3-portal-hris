/**
 * Fungsi pengambil dan pengubah data langsung dari Cloud Firestore.
 * Sesuai aturan PRD 7.1 dan AGENTS.md:
 * - Koleksi: users, presensi, pengajuan_cuti
 * - Bentuk keluaran data (objek Date, id dokumen) tetap dipertahankan
 */
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { keTanggal, terlambat } from "./waktu.js";

// Helper konversi Timestamp Firestore ke Date JavaScript
function keDate(val) {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
}

// ---------------------------------------------------------------------------
// PRESENSI (PRD 4.3)
// ---------------------------------------------------------------------------

/**
 * Mengambil riwayat presensi karyawan pada bulan tertentu (misal "2026-10")
 */
export async function ambilPresensi(karyawanId, bulan) {
  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId)
  );
  const snapshot = await getDocs(q);

  const daftar = [];
  snapshot.forEach((d) => {
    const data = d.data();
    if (data.tanggal && data.tanggal.startsWith(bulan)) {
      daftar.push({
        id: d.id,
        karyawanId: data.karyawanId,
        tanggal: data.tanggal,
        jamMasuk: keDate(data.jamMasuk),
        jamPulang: keDate(data.jamPulang),
      });
    }
  });

  return daftar.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

/**
 * Mengambil catatan presensi karyawan pada satu tanggal spesifik
 */
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  // Cek langsung berdasarkan ID dokumen terstandar ${karyawanId}-${tanggal}
  const idDokumen = `${karyawanId}-${tanggal}`;
  const ref = doc(db, "presensi", idDokumen);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      karyawanId: data.karyawanId,
      tanggal: data.tanggal,
      jamMasuk: keDate(data.jamMasuk),
      jamPulang: keDate(data.jamPulang),
    };
  }

  // Fallback query jika ID berbeda
  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId),
    where("tanggal", "==", tanggal)
  );
  const hasil = await getDocs(q);
  if (!hasil.empty) {
    const d = hasil.docs[0];
    const data = d.data();
    return {
      id: d.id,
      karyawanId: data.karyawanId,
      tanggal: data.tanggal,
      jamMasuk: keDate(data.jamMasuk),
      jamPulang: keDate(data.jamPulang),
    };
  }

  return null;
}

/**
 * Mencatat presensi masuk karyawan ke Firestore
 */
export async function catatPresensiMasuk(karyawanId, tanggal, jamMasuk = new Date()) {
  const idDokumen = `${karyawanId}-${tanggal}`;
  const ref = doc(db, "presensi", idDokumen);
  await setDoc(
    ref,
    {
      karyawanId,
      tanggal,
      jamMasuk: Timestamp.fromDate(jamMasuk),
    },
    { merge: true }
  );
  return idDokumen;
}

/**
 * Mencatat presensi pulang karyawan ke Firestore
 */
export async function catatPresensiPulang(karyawanId, tanggal, jamPulang = new Date()) {
  const idDokumen = `${karyawanId}-${tanggal}`;
  const ref = doc(db, "presensi", idDokumen);
  await updateDoc(ref, {
    jamPulang: Timestamp.fromDate(jamPulang),
  });
  return idDokumen;
}

// ---------------------------------------------------------------------------
// PENGAJUAN CUTI (PRD 4.4, 4.8)
// ---------------------------------------------------------------------------

const terbaruDulu = (a, b) => {
  const tA = a.diajukanPada ? a.diajukanPada.getTime() : 0;
  const tB = b.diajukanPada ? b.diajukanPada.getTime() : 0;
  return tB - tA;
};

/**
 * Mengambil semua pengajuan cuti milik seorang karyawan
 */
export async function ambilPengajuanCuti(karyawanId) {
  const q = query(
    collection(db, "pengajuan_cuti"),
    where("karyawanId", "==", karyawanId)
  );
  const snapshot = await getDocs(q);

  const daftar = [];
  snapshot.forEach((d) => {
    const data = d.data();
    daftar.push({
      id: d.id,
      karyawanId: data.karyawanId,
      tanggalMulai: keDate(data.tanggalMulai),
      tanggalSelesai: keDate(data.tanggalSelesai),
      alasan: data.alasan,
      status: data.status,
      catatanHrd: data.catatanHrd || "",
      diajukanPada: keDate(data.diajukanPada),
    });
  });

  return daftar.sort(terbaruDulu);
}

/**
 * Mengambil satu rincian pengajuan cuti berdasarkan ID dokumen
 */
export async function ambilSatuPengajuan(id) {
  const ref = doc(db, "pengajuan_cuti", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  const karyawan = await ambilKaryawan(data.karyawanId);

  return {
    id: snap.id,
    karyawanId: data.karyawanId,
    nama: karyawan?.nama ?? "(tidak dikenal)",
    tanggalMulai: keDate(data.tanggalMulai),
    tanggalSelesai: keDate(data.tanggalSelesai),
    alasan: data.alasan,
    status: data.status,
    catatanHrd: data.catatanHrd || "",
    diajukanPada: keDate(data.diajukanPada),
  };
}

/**
 * Mengambil semua pengajuan cuti untuk HRD dengan filter status opsional
 */
export async function ambilSemuaPengajuan(status) {
  const snapshot = await getDocs(collection(db, "pengajuan_cuti"));
  const semuaKaryawan = await ambilSemuaKaryawan();
  const namaMap = new Map(semuaKaryawan.map((k) => [k.id, k.nama]));

  const daftar = [];
  snapshot.forEach((d) => {
    const data = d.data();
    if (!status || status === "semua" || data.status === status) {
      daftar.push({
        id: d.id,
        karyawanId: data.karyawanId,
        nama: namaMap.get(data.karyawanId) ?? "(tidak dikenal)",
        tanggalMulai: keDate(data.tanggalMulai),
        tanggalSelesai: keDate(data.tanggalSelesai),
        alasan: data.alasan,
        status: data.status,
        catatanHrd: data.catatanHrd || "",
        diajukanPada: keDate(data.diajukanPada),
      });
    }
  });

  return daftar.sort(terbaruDulu);
}

/**
 * Membuat pengajuan cuti baru oleh karyawan ke Firestore
 */
export async function buatPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const mulaiDate = new Date(tanggalMulai + "T00:00:00");
  const selesaiDate = new Date(tanggalSelesai + "T00:00:00");

  const docRef = await addDoc(collection(db, "pengajuan_cuti"), {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(mulaiDate),
    tanggalSelesai: Timestamp.fromDate(selesaiDate),
    alasan: alasan.trim(),
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Memutuskan status pengajuan cuti oleh HRD (disetujui / ditolak)
 */
export async function putuskanPengajuanCuti(id, status, catatanHrd = "") {
  const ref = doc(db, "pengajuan_cuti", id);
  await updateDoc(ref, {
    status,
    catatanHrd: catatanHrd || "",
  });
}

// ---------------------------------------------------------------------------
// DATA KARYAWAN & PROFIL (PRD 4.5, 4.7)
// ---------------------------------------------------------------------------

/**
 * Mengambil seluruh data pengguna/karyawan dari koleksi 'users'
 */
export async function ambilSemuaKaryawan() {
  const snapshot = await getDocs(collection(db, "users"));
  const daftar = [];
  snapshot.forEach((d) => {
    daftar.push({ id: d.id, ...d.data() });
  });
  return daftar.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
}

/**
 * Mengambil satu data pengguna/karyawan berdasarkan ID
 */
export async function ambilKaryawan(id) {
  if (!id) return null;
  const ref = doc(db, "users", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Memperbarui nama profil pengguna di koleksi 'users'
 */
export async function perbaruiProfil(uid, { nama }) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    nama: nama.trim(),
  });
}

/**
 * Memperbarui peran (karyawan / hrd) pengguna oleh HRD
 */
export async function perbaruiPeranKaryawan(id, role) {
  const ref = doc(db, "users", id);
  await updateDoc(ref, { role });
}

// ---------------------------------------------------------------------------
// DASBOR & LAPORAN HRD (PRD 4.6, 4.9)
// ---------------------------------------------------------------------------

/**
 * Ringkasan untuk Dasbor HRD hari ini
 */
export async function ambilRingkasanDasbor(tanggal) {
  // 1. Presensi hari ini
  const presensiSnap = await getDocs(
    query(collection(db, "presensi"), where("tanggal", "==", tanggal))
  );
  let hadir = 0;
  let jumlahTerlambat = 0;

  presensiSnap.forEach((d) => {
    hadir++;
    const data = d.data();
    const jm = keDate(data.jamMasuk);
    if (jm && terlambat(jm)) {
      jumlahTerlambat++;
    }
  });

  // 2. Cuti menunggu
  const cutiSnap = await getDocs(
    query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))
  );
  const cutiMenunggu = cutiSnap.size;

  // 3. Jumlah karyawan terdaftar
  const usersSnap = await getDocs(collection(db, "users"));
  const jumlahKaryawan = usersSnap.size;

  return {
    hadir,
    terlambat: jumlahTerlambat,
    cutiMenunggu,
    jumlahKaryawan,
  };
}

/**
 * Rekap bulanan per karyawan untuk halaman Laporan
 */
export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const daftarKaryawan = [];
  usersSnap.forEach((d) => {
    daftarKaryawan.push({ id: d.id, ...d.data() });
  });

  const semuaPresensi = [];
  presensiSnap.forEach((d) => {
    const data = d.data();
    if (data.tanggal && data.tanggal.startsWith(bulan)) {
      semuaPresensi.push({
        karyawanId: data.karyawanId,
        jamMasuk: keDate(data.jamMasuk),
      });
    }
  });

  const semuaCuti = [];
  cutiSnap.forEach((d) => {
    const data = d.data();
    semuaCuti.push({
      karyawanId: data.karyawanId,
      tanggalMulai: keDate(data.tanggalMulai),
      tanggalSelesai: keDate(data.tanggalSelesai),
    });
  });

  return daftarKaryawan
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""))
    .map((u) => {
      const presensiUser = semuaPresensi.filter((p) => p.karyawanId === u.id);
      let cutiDisetujui = 0;

      for (const c of semuaCuti) {
        if (c.karyawanId !== u.id || !c.tanggalMulai || !c.tanggalSelesai) continue;
        const cur = new Date(c.tanggalMulai);
        while (cur <= c.tanggalSelesai) {
          if (keTanggal(cur).startsWith(bulan)) {
            cutiDisetujui++;
          }
          cur.setDate(cur.getDate() + 1);
        }
      }

      return {
        karyawanId: u.id,
        nama: u.nama,
        hariHadir: presensiUser.length,
        terlambat: presensiUser.filter((p) => p.jamMasuk && terlambat(p.jamMasuk)).length,
        cutiDisetujui,
      };
    });
}
