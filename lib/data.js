/**
 * Pengambilan dan manipulasi data melalui Cloud Firestore.
 * Semua fungsi mempertahankan bentuk data yang diharapkan oleh komponen halaman.
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
import { db } from "./firebase.js";
import { keTanggal, terlambat } from "./waktu.js";

/**
 * Mengubah objek Timestamp Firestore menjadi objek Date JavaScript standar
 */
function ubahTimestampKeDate(ts) {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts === "string" || typeof ts === "number") return new Date(ts);
  return ts;
}

/**
 * Normalisasi data presensi dari Firestore
 */
function normalisasiPresensi(id, data) {
  return {
    id,
    karyawanId: data.karyawanId,
    tanggal: data.tanggal,
    jamMasuk: ubahTimestampKeDate(data.jamMasuk),
    jamPulang: ubahTimestampKeDate(data.jamPulang),
  };
}

/**
 * Normalisasi data pengajuan cuti dari Firestore
 */
function normalisasiCuti(id, data, nama) {
  return {
    id,
    karyawanId: data.karyawanId,
    tanggalMulai: ubahTimestampKeDate(data.tanggalMulai),
    tanggalSelesai: ubahTimestampKeDate(data.tanggalSelesai),
    alasan: data.alasan || "",
    status: data.status || "menunggu",
    catatanHrd: data.catatanHrd || "",
    diajukanPada: ubahTimestampKeDate(data.diajukanPada),
    ...(nama !== undefined ? { nama } : {}),
  };
}

/**
 * Normalisasi data user/karyawan dari Firestore
 */
function normalisasiUser(id, data) {
  return {
    id,
    nama: data.nama || "",
    email: data.email || "",
    role: data.role || "karyawan",
  };
}

/**
 * Mengambil riwayat presensi karyawan untuk satu bulan (format: "2026-10")
 */
export async function ambilPresensi(karyawanId, bulan) {
  const q = query(collection(db, "presensi"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => normalisasiPresensi(d.id, d.data()))
    .filter((p) => p.tanggal && p.tanggal.startsWith(bulan))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

/**
 * Mengambil catatan presensi karyawan pada tanggal tertentu (format: "2026-10-09")
 */
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return normalisasiPresensi(snap.id, snap.data());
  }
  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId),
    where("tanggal", "==", tanggal)
  );
  const qSnap = await getDocs(q);
  if (!qSnap.empty) {
    const d = qSnap.docs[0];
    return normalisasiPresensi(d.id, d.data());
  }
  return null;
}

/**
 * Mencatat jam masuk karyawan hari ini
 */
export async function catatMasuk(karyawanId, tanggal, waktu = new Date()) {
  const docId = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", docId);
  const data = {
    karyawanId,
    tanggal,
    jamMasuk: Timestamp.fromDate(waktu),
    jamPulang: null,
  };
  await setDoc(docRef, data, { merge: true });
  return normalisasiPresensi(docId, data);
}

/**
 * Mencatat jam pulang karyawan hari ini
 */
export async function catatPulang(karyawanId, tanggal, waktu = new Date()) {
  const docId = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", docId);
  const jamPulangTs = Timestamp.fromDate(waktu);
  await updateDoc(docRef, {
    jamPulang: jamPulangTs,
  });
  const snap = await getDoc(docRef);
  return normalisasiPresensi(docId, snap.data());
}

/**
 * Mengambil semua riwayat pengajuan cuti milik seorang karyawan
 */
export async function ambilPengajuanCuti(karyawanId) {
  const q = query(collection(db, "pengajuan_cuti"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => normalisasiCuti(d.id, d.data()))
    .sort((a, b) => (b.diajukanPada?.getTime?.() ?? 0) - (a.diajukanPada?.getTime?.() ?? 0));
}

/**
 * Mengambil satu rincian pengajuan cuti beserta nama pemohon
 */
export async function ambilSatuPengajuan(id) {
  const docSnap = await getDoc(doc(db, "pengajuan_cuti", id));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  let nama = "(tidak dikenal)";
  if (data.karyawanId) {
    const userSnap = await getDoc(doc(db, "users", data.karyawanId));
    if (userSnap.exists()) {
      nama = userSnap.data().nama || nama;
    }
  }
  return normalisasiCuti(id, data, nama);
}

/**
 * Mengajukan cuti baru ke Firestore
 */
export async function ajukanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const snapshot = await getDocs(collection(db, "pengajuan_cuti"));
  let maksNomor = 0;
  snapshot.forEach((docSnap) => {
    const id = docSnap.id;
    if (id.startsWith("C")) {
      const n = parseInt(id.slice(1), 10);
      if (!isNaN(n) && n > maksNomor) maksNomor = n;
    }
  });
  const docId = `C${String(maksNomor + 1).padStart(3, "0")}`;
  const dMulai = typeof tanggalMulai === "string" ? new Date(`${tanggalMulai}T00:00:00`) : tanggalMulai;
  const dSelesai = typeof tanggalSelesai === "string" ? new Date(`${tanggalSelesai}T00:00:00`) : tanggalSelesai;
  const data = {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(dMulai),
    tanggalSelesai: Timestamp.fromDate(dSelesai),
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.now(),
  };
  await setDoc(doc(db, "pengajuan_cuti", docId), data);
  return normalisasiCuti(docId, data);
}

/**
 * HRD memutuskan pengajuan cuti (setujui / tolak beserta catatan)
 */
export async function putuskanCuti(id, status, catatanHrd = "") {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status,
    catatanHrd,
  });
  const snap = await getDoc(docRef);
  return normalisasiCuti(id, snap.data());
}

/**
 * Mengambil semua pengajuan cuti (dengan filter status opsional)
 */
export async function ambilSemuaPengajuan(status) {
  const [cutiSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, "pengajuan_cuti")),
    getDocs(collection(db, "users")),
  ]);

  const mapNama = new Map();
  usersSnap.forEach((u) => {
    mapNama.set(u.id, u.data().nama || "(tidak dikenal)");
  });

  const daftar = cutiSnap.docs.map((d) => {
    const data = d.data();
    return normalisasiCuti(d.id, data, mapNama.get(data.karyawanId) || "(tidak dikenal)");
  });

  return daftar
    .filter((c) => !status || status === "semua" || c.status === status)
    .sort((a, b) => (b.diajukanPada?.getTime?.() ?? 0) - (a.diajukanPada?.getTime?.() ?? 0));
}

/**
 * Mengambil seluruh data karyawan terdaftar
 */
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => normalisasiUser(d.id, d.data()))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

/**
 * Mengambil data satu karyawan berdasarkan ID dokumen
 */
export async function ambilKaryawan(id) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  return normalisasiUser(id, snap.data());
}

/**
 * Mengubah nama profil pengguna
 */
export async function ubahProfil(uid, { nama }) {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    nama,
  });
  const snap = await getDoc(docRef);
  return normalisasiUser(uid, snap.data());
}

/**
 * HRD mengubah peran karyawan (karyawan / hrd)
 */
export async function ubahPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, {
    role,
  });
  const snap = await getDoc(docRef);
  return normalisasiUser(id, snap.data());
}

/**
 * Mengambil angka ringkasan untuk Dasbor HRD
 */
export async function ambilRingkasanDasbor(tanggal) {
  const [presensiSnap, cutiSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  const daftarHariIni = presensiSnap.docs.map((d) => normalisasiPresensi(d.id, d.data()));
  return {
    hadir: daftarHariIni.length,
    terlambat: daftarHariIni.filter((p) => terlambat(p.jamMasuk)).length,
    cutiMenunggu: cutiSnap.size,
    jumlahKaryawan: usersSnap.size,
  };
}

/**
 * Rekap bulanan per karyawan untuk halaman Laporan HRD
 */
export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const daftarUsers = usersSnap.docs.map((d) => normalisasiUser(d.id, d.data()));
  const daftarPresensi = presensiSnap.docs
    .map((d) => normalisasiPresensi(d.id, d.data()))
    .filter((p) => p.tanggal && p.tanggal.startsWith(bulan));
  const daftarCuti = cutiSnap.docs.map((d) => normalisasiCuti(d.id, d.data()));

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
