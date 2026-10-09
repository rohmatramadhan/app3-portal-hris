/**
 * Semua halaman mengambil dan mengubah data lewat fungsi di sini, langsung ke Cloud Firestore.
 * Bentuk keluarannya dipertahankan sama persis agar antarmuka tidak rusak.
 */
import { db } from "./firebase.js";
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
import { keTanggal, terlambat } from "./waktu.js";

// Helper mengubah Firestore Timestamp ke JavaScript Date
function ubahKeDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

// Helper peta nama karyawan { [karyawanId]: nama }
async function ambilPetaNamaKaryawan() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const peta = {};
    snap.forEach((d) => {
      peta[d.id] = d.data().nama ?? "(tidak dikenal)";
    });
    return peta;
  } catch {
    return {};
  }
}

/**
 * Mengambil catatan presensi karyawan untuk satu bulan (format: "2026-10").
 */
export async function ambilPresensi(karyawanId, bulan) {
  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId)
  );
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        jamMasuk: ubahKeDate(data.jamMasuk),
        jamPulang: ubahKeDate(data.jamPulang),
      };
    })
    .filter((p) => p.tanggal && p.tanggal.startsWith(bulan))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

/**
 * Mengambil catatan presensi karyawan untuk tanggal tertentu (format: "2026-10-08").
 */
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      jamMasuk: ubahKeDate(data.jamMasuk),
      jamPulang: ubahKeDate(data.jamPulang),
    };
  }

  // Fallback bila ID dokumen otomatis
  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId),
    where("tanggal", "==", tanggal)
  );
  const qSnap = await getDocs(q);
  if (!qSnap.empty) {
    const d = qSnap.docs[0];
    const data = d.data();
    return {
      id: d.id,
      ...data,
      jamMasuk: ubahKeDate(data.jamMasuk),
      jamPulang: ubahKeDate(data.jamPulang),
    };
  }

  return null;
}

/**
 * Mengambil riwayat pengajuan cuti milik satu karyawan.
 */
export async function ambilPengajuanCuti(karyawanId) {
  const q = query(
    collection(db, "pengajuan_cuti"),
    where("karyawanId", "==", karyawanId)
  );
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        tanggalMulai: ubahKeDate(data.tanggalMulai),
        tanggalSelesai: ubahKeDate(data.tanggalSelesai),
        diajukanPada: ubahKeDate(data.diajukanPada),
      };
    })
    .sort((a, b) => (b.diajukanPada?.getTime?.() ?? 0) - (a.diajukanPada?.getTime?.() ?? 0));
}

/**
 * Mengambil rincian satu pengajuan cuti berdasarkan ID dokumen.
 */
export async function ambilSatuPengajuan(id) {
  const snap = await getDoc(doc(db, "pengajuan_cuti", id));
  if (!snap.exists()) return null;

  const data = snap.data();
  let nama = "(tidak dikenal)";
  if (data.karyawanId) {
    const userSnap = await getDoc(doc(db, "users", data.karyawanId));
    if (userSnap.exists()) {
      nama = userSnap.data().nama ?? "(tidak dikenal)";
    }
  }

  return {
    id: snap.id,
    ...data,
    nama,
    tanggalMulai: ubahKeDate(data.tanggalMulai),
    tanggalSelesai: ubahKeDate(data.tanggalSelesai),
    diajukanPada: ubahKeDate(data.diajukanPada),
  };
}

/**
 * Mengambil semua pengajuan cuti untuk admin/HRD dengan penyaringan status.
 */
export async function ambilSemuaPengajuan(status) {
  const [cutiSnap, petaNama] = await Promise.all([
    getDocs(collection(db, "pengajuan_cuti")),
    ambilPetaNamaKaryawan(),
  ]);

  return cutiSnap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        nama: petaNama[data.karyawanId] ?? "(tidak dikenal)",
        tanggalMulai: ubahKeDate(data.tanggalMulai),
        tanggalSelesai: ubahKeDate(data.tanggalSelesai),
        diajukanPada: ubahKeDate(data.diajukanPada),
      };
    })
    .filter((c) => !status || status === "semua" || c.status === status)
    .sort((a, b) => (b.diajukanPada?.getTime?.() ?? 0) - (a.diajukanPada?.getTime?.() ?? 0));
}

/**
 * Mengambil daftar seluruh karyawan terdaftar di koleksi users.
 */
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
}

/**
 * Mengambil rincian profil satu karyawan dari koleksi users.
 */
export async function ambilKaryawan(id) {
  const snap = await getDoc(doc(db, "users", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Ringkasan angka untuk Dasbor HRD hari ini.
 */
export async function ambilRingkasanDasbor(tanggal) {
  const [presensiSnap, cutiSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  const hariIni = presensiSnap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      jamMasuk: ubahKeDate(data.jamMasuk),
    };
  });

  return {
    hadir: hariIni.length,
    terlambat: hariIni.filter((p) => terlambat(p.jamMasuk)).length,
    cutiMenunggu: cutiSnap.size,
    jumlahKaryawan: usersSnap.size,
  };
}

/**
 * Rekap bulanan presensi dan cuti untuk menu Laporan HRD.
 */
export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const users = usersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

  const presensiBulan = presensiSnap.docs
    .map((d) => {
      const data = d.data();
      return {
        ...data,
        jamMasuk: ubahKeDate(data.jamMasuk),
      };
    })
    .filter((p) => p.tanggal && p.tanggal.startsWith(bulan));

  const cutiDisetujui = cutiSnap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      tanggalMulai: ubahKeDate(data.tanggalMulai),
      tanggalSelesai: ubahKeDate(data.tanggalSelesai),
    };
  });

  return users.map((u) => {
    const hadir = presensiBulan.filter((p) => p.karyawanId === u.id);
    let totalHariCuti = 0;
    for (const c of cutiDisetujui) {
      if (c.karyawanId !== u.id || !c.tanggalMulai || !c.tanggalSelesai) continue;
      for (let d = new Date(c.tanggalMulai); d <= c.tanggalSelesai; d.setDate(d.getDate() + 1)) {
        if (keTanggal(d).startsWith(bulan)) totalHariCuti++;
      }
    }
    return {
      karyawanId: u.id,
      nama: u.nama,
      hariHadir: hadir.length,
      terlambat: hadir.filter((p) => terlambat(p.jamMasuk)).length,
      cutiDisetujui: totalHariCuti,
    };
  });
}

/* ============================================================
 * FUNGSI MUTASI (CRUD WRITE KE FIRESTORE)
 * ============================================================ */

/**
 * Mencatat jam masuk presensi ke koleksi presensi di Firestore.
 */
export async function catatMasuk(karyawanId, tanggal, jamMasuk = new Date()) {
  const docId = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", docId);
  await setDoc(
    docRef,
    {
      karyawanId,
      tanggal,
      jamMasuk: Timestamp.fromDate(jamMasuk),
      jamPulang: null,
    },
    { merge: true }
  );
  return docId;
}

/**
 * Mencatat jam pulang presensi ke koleksi presensi di Firestore.
 */
export async function catatPulang(karyawanId, tanggal, jamPulang = new Date()) {
  const docId = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", docId);
  await setDoc(
    docRef,
    {
      jamPulang: Timestamp.fromDate(jamPulang),
    },
    { merge: true }
  );
  return docId;
}

/**
 * Mengajukan cuti baru ke koleksi pengajuan_cuti di Firestore.
 */
export async function ajukanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const snap = await getDocs(collection(db, "pengajuan_cuti"));
  let counter = snap.size + 1;
  let docId = `C${String(counter).padStart(3, "0")}`;

  // Pastikan ID unik
  while ((await getDoc(doc(db, "pengajuan_cuti", docId))).exists()) {
    counter++;
    docId = `C${String(counter).padStart(3, "0")}`;
  }

  const dMulai = typeof tanggalMulai === "string" ? new Date(`${tanggalMulai}T00:00:00`) : tanggalMulai;
  const dSelesai = typeof tanggalSelesai === "string" ? new Date(`${tanggalSelesai}T00:00:00`) : tanggalSelesai;

  const docRef = doc(db, "pengajuan_cuti", docId);
  await setDoc(docRef, {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(dMulai),
    tanggalSelesai: Timestamp.fromDate(dSelesai),
    alasan: alasan.trim(),
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(new Date()),
  });

  return docId;
}

/**
 * Memutuskan status pengajuan cuti (disetujui / ditolak) oleh HRD.
 */
export async function putuskanCuti(id, status, catatanHrd = "") {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status,
    catatanHrd: (catatanHrd || "").trim(),
  });
}

/**
 * Mengubah nama profil pengguna di koleksi users.
 */
export async function ubahProfil(id, { nama }) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, {
    nama: nama.trim(),
  });
}

/**
 * Mengubah peran karyawan (karyawan / hrd) di koleksi users.
 */
export async function ubahPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, {
    role,
  });
}
