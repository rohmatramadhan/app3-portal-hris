/**
 * Semua halaman mengambil dan menyimpan data lewat fungsi di sini.
 * Terhubung langsung ke Cloud Firestore sesuai PRD 7.1.
 */
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { keTanggal, terlambat } from "./waktu.js";

// Mengubah dokumen Firestore presensi ke objek dengan Date standar
function normalisasiPresensi(docSnap) {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    karyawanId: d.karyawanId,
    tanggal: d.tanggal,
    jamMasuk: d.jamMasuk?.toDate ? d.jamMasuk.toDate() : d.jamMasuk ? new Date(d.jamMasuk) : null,
    jamPulang: d.jamPulang?.toDate ? d.jamPulang.toDate() : d.jamPulang ? new Date(d.jamPulang) : null,
  };
}

// Mengubah dokumen Firestore cuti ke objek dengan Date standar
function normalisasiCuti(docSnap) {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    karyawanId: d.karyawanId,
    tanggalMulai: d.tanggalMulai?.toDate ? d.tanggalMulai.toDate() : new Date(d.tanggalMulai),
    tanggalSelesai: d.tanggalSelesai?.toDate ? d.tanggalSelesai.toDate() : new Date(d.tanggalSelesai),
    alasan: d.alasan ?? "",
    status: d.status ?? "menunggu",
    catatanHrd: d.catatanHrd ?? "",
    diajukanPada: d.diajukanPada?.toDate ? d.diajukanPada.toDate() : new Date(d.diajukanPada),
  };
}

async function cariNamaKaryawan(id) {
  try {
    const snap = await getDoc(doc(db, "users", id));
    if (snap.exists()) return snap.data().nama ?? id;
  } catch {
    // Abaikan galat dan kembalikan fallback
  }
  return "(tidak dikenal)";
}

// Mengambil presensi seorang karyawan untuk bulan tertentu ("2026-10")
export async function ambilPresensi(karyawanId, bulan) {
  const q = query(collection(db, "presensi"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  const hasil = [];
  snap.forEach((d) => {
    const p = normalisasiPresensi(d);
    if (p.tanggal.startsWith(bulan)) {
      hasil.push(p);
    }
  });
  return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// Mengambil presensi karyawan pada tanggal tertentu ("2026-10-09")
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) return normalisasiPresensi(snap);

  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId),
    where("tanggal", "==", tanggal)
  );
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    return normalisasiPresensi(querySnap.docs[0]);
  }
  return null;
}

// Mencatat presensi masuk karyawan hari ini
export async function catatPresensiMasuk(karyawanId, tanggal, jamMasuk = new Date()) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const data = {
    karyawanId,
    tanggal,
    jamMasuk: Timestamp.fromDate(jamMasuk),
    jamPulang: null,
  };
  await setDoc(docRef, data, { merge: true });
  return { id: docRef.id, ...data, jamMasuk };
}

// Mencatat presensi pulang karyawan hari ini
export async function catatPresensiPulang(karyawanId, tanggal, jamPulang = new Date()) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  await updateDoc(docRef, {
    jamPulang: Timestamp.fromDate(jamPulang),
  });
  return { jamPulang };
}

// Mengambil seluruh pengajuan cuti milik satu karyawan
export async function ambilPengajuanCuti(karyawanId) {
  const q = query(collection(db, "pengajuan_cuti"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  const hasil = [];
  snap.forEach((d) => hasil.push(normalisasiCuti(d)));
  return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
}

// Mengambil satu pengajuan cuti berdasarkan ID beserta nama pemohonnya
export async function ambilSatuPengajuan(id) {
  const docRef = doc(db, "pengajuan_cuti", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const c = normalisasiCuti(snap);
  const nama = await cariNamaKaryawan(c.karyawanId);
  return { ...c, nama };
}

// Mengambil semua pengajuan cuti untuk HRD (dengan opsi saringan status)
export async function ambilSemuaPengajuan(status) {
  const [cutiSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, "pengajuan_cuti")),
    getDocs(collection(db, "users")),
  ]);

  const namaMap = {};
  usersSnap.forEach((u) => {
    namaMap[u.id] = u.data().nama ?? u.id;
  });

  const hasil = [];
  cutiSnap.forEach((d) => {
    const c = normalisasiCuti(d);
    if (!status || status === "semua" || c.status === status) {
      hasil.push({ ...c, nama: namaMap[c.karyawanId] ?? "(tidak dikenal)" });
    }
  });
  return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
}

// Mengajukan cuti baru ke koleksi pengajuan_cuti dengan penomoran atomik aman dari race condition
export async function ajukanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const counterRef = doc(db, "counters", "pengajuan_cuti");

  // Inisialisasi counter jika belum pernah ada
  const counterSnap = await getDoc(counterRef);
  if (!counterSnap.exists()) {
    const snap = await getDocs(collection(db, "pengajuan_cuti"));
    const existingIds = snap.docs.map((d) => d.id).filter((id) => /^C\d+$/.test(id));
    let maxNum = 0;
    if (existingIds.length > 0) {
      const nums = existingIds.map((id) => parseInt(id.slice(1), 10)).filter((n) => !isNaN(n));
      if (nums.length > 0) maxNum = Math.max(...nums);
    }
    await setDoc(counterRef, { terakhir: maxNum });
  }

  // Alokasikan ID baru secara atomik menggunakan transaksi Firestore
  return await runTransaction(db, async (transaction) => {
    const cSnap = await transaction.get(counterRef);
    const terakhir = cSnap.exists() ? cSnap.data().terakhir || 0 : 0;
    const nextNum = terakhir + 1;
    const id = `C${String(nextNum).padStart(3, "0")}`;
    const cutiRef = doc(db, "pengajuan_cuti", id);

    const data = {
      karyawanId,
      tanggalMulai: Timestamp.fromDate(new Date(tanggalMulai + "T00:00:00")),
      tanggalSelesai: Timestamp.fromDate(new Date(tanggalSelesai + "T00:00:00")),
      alasan,
      status: "menunggu",
      catatanHrd: "",
      diajukanPada: Timestamp.fromDate(new Date()),
    };

    transaction.set(counterRef, { terakhir: nextNum });
    transaction.set(cutiRef, data);

    return id;
  });
}

// HRD menyetujui atau menolak pengajuan cuti beserta catatan
export async function putuskanCuti(id, statusBaru, catatanHrd = "") {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status: statusBaru,
    catatanHrd: catatanHrd ?? "",
  });
}

// Mengambil semua karyawan di koleksi users
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  const hasil = [];
  snap.forEach((d) => hasil.push({ id: d.id, ...d.data() }));
  return hasil.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
}

// Mengambil data satu karyawan berdasarkan ID
export async function ambilKaryawan(id) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Mengubah profil (nama) karyawan
export async function ubahProfil(id, { nama }) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { nama });
}

// Mengubah peran karyawan oleh HRD
export async function ubahPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { role });
}

// Angka ringkasan untuk Dasbor HRD
export async function ambilRingkasanDasbor(tanggal) {
  const [presensiSnap, cutiSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  const hariIni = [];
  presensiSnap.forEach((d) => hariIni.push(normalisasiPresensi(d)));

  return {
    hadir: hariIni.length,
    terlambat: hariIni.filter((p) => terlambat(p.jamMasuk)).length,
    cutiMenunggu: cutiSnap.size,
    jumlahKaryawan: usersSnap.size,
  };
}

// Rekap kehadiran bulanan semua karyawan untuk Laporan HRD
export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const allUsers = [];
  usersSnap.forEach((d) => allUsers.push({ id: d.id, ...d.data() }));

  const allPresensi = [];
  presensiSnap.forEach((d) => allPresensi.push(normalisasiPresensi(d)));

  const allCuti = [];
  cutiSnap.forEach((d) => allCuti.push(normalisasiCuti(d)));

  return allUsers
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""))
    .map((u) => {
      const hadir = allPresensi.filter((p) => p.karyawanId === u.id && p.tanggal.startsWith(bulan));
      let cutiDisetujui = 0;
      for (const c of allCuti) {
        if (c.karyawanId !== u.id) continue;
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

