/**
 * Mengambil dan mengelola data langsung dari Cloud Firestore.
 * Sesuai aturan PRD 7.1 dan AGENTS.md:
 * - Koleksi: users, presensi, pengajuan_cuti
 * - Timestamp dikonversi ke objek Date agar kompatibel dengan pembantu waktu
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { keTanggal, terlambat } from "./waktu";

function toJsDate(val) {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
}

// Mengambil riwayat presensi karyawan per bulan dari Firestore
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
        jamMasuk: toJsDate(data.jamMasuk),
        jamPulang: toJsDate(data.jamPulang),
      });
    }
  });

  return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// Mengambil catatan presensi karyawan pada tanggal tertentu dari Firestore
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  if (!karyawanId) return null;
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      karyawanId: data.karyawanId,
      tanggal: data.tanggal,
      jamMasuk: toJsDate(data.jamMasuk),
      jamPulang: toJsDate(data.jamPulang),
    };
  }

  // Fallback query jika id dokumen dibuat berbeda
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
      karyawanId: data.karyawanId,
      tanggal: data.tanggal,
      jamMasuk: toJsDate(data.jamMasuk),
      jamPulang: toJsDate(data.jamPulang),
    };
  }

  return null;
}

// Mencatat jam masuk atau jam pulang ke Firestore
export async function catatPresensi(karyawanId, tanggal, tipe) {
  const docId = `${karyawanId}-${tanggal}`;
  const ref = doc(db, "presensi", docId);
  const sekarang = new Date();

  if (tipe === "masuk") {
    await setDoc(
      ref,
      {
        karyawanId,
        tanggal,
        jamMasuk: Timestamp.fromDate(sekarang),
        jamPulang: null,
      },
      { merge: true }
    );
  } else if (tipe === "pulang") {
    await updateDoc(ref, {
      jamPulang: Timestamp.fromDate(sekarang),
    });
  }
}

// Mengambil riwayat pengajuan cuti milik seorang karyawan dari Firestore
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
      tanggalMulai: toJsDate(data.tanggalMulai),
      tanggalSelesai: toJsDate(data.tanggalSelesai),
      alasan: data.alasan,
      status: data.status,
      catatanHrd: data.catatanHrd,
      diajukanPada: toJsDate(data.diajukanPada),
    });
  });

  return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
}

// Mengambil satu pengajuan cuti beserta nama pemohon
export async function ambilSatuPengajuan(id) {
  const snap = await getDoc(doc(db, "pengajuan_cuti", id));
  if (!snap.exists()) return null;
  const data = snap.data();

  let nama = "(tidak dikenal)";
  if (data.karyawanId) {
    const userSnap = await getDoc(doc(db, "users", data.karyawanId));
    if (userSnap.exists()) {
      nama = userSnap.data().nama || nama;
    }
  }

  return {
    id: snap.id,
    karyawanId: data.karyawanId,
    tanggalMulai: toJsDate(data.tanggalMulai),
    tanggalSelesai: toJsDate(data.tanggalSelesai),
    alasan: data.alasan,
    status: data.status,
    catatanHrd: data.catatanHrd,
    diajukanPada: toJsDate(data.diajukanPada),
    nama,
  };
}

// Mengambil semua pengajuan cuti untuk HRD dari Firestore
export async function ambilSemuaPengajuan(status) {
  const snap = await getDocs(collection(db, "pengajuan_cuti"));
  const usersSnap = await getDocs(collection(db, "users"));
  const mapNama = {};
  usersSnap.forEach((u) => {
    mapNama[u.id] = u.data().nama;
  });

  const hasil = [];
  snap.forEach((d) => {
    const data = d.data();
    if (!status || status === "semua" || data.status === status) {
      hasil.push({
        id: d.id,
        karyawanId: data.karyawanId,
        tanggalMulai: toJsDate(data.tanggalMulai),
        tanggalSelesai: toJsDate(data.tanggalSelesai),
        alasan: data.alasan,
        status: data.status,
        catatanHrd: data.catatanHrd,
        diajukanPada: toJsDate(data.diajukanPada),
        nama: mapNama[data.karyawanId] ?? "(tidak dikenal)",
      });
    }
  });

  return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
}

// Menyimpan pengajuan cuti baru ke koleksi pengajuan_cuti di Firestore
export async function ajukanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const mulaiDate = new Date(`${tanggalMulai}T00:00:00`);
  const selesaiDate = new Date(`${tanggalSelesai}T00:00:00`);
  const sekarang = new Date();

  const ref = await addDoc(collection(db, "pengajuan_cuti"), {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(mulaiDate),
    tanggalSelesai: Timestamp.fromDate(selesaiDate),
    alasan: alasan.trim(),
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(sekarang),
  });

  return ref.id;
}

// Memperbarui status dan catatan pengajuan cuti oleh HRD
export async function putuskanCuti(id, status, catatanHrd = "") {
  await updateDoc(doc(db, "pengajuan_cuti", id), {
    status,
    catatanHrd: catatanHrd.trim(),
  });
}

// Mengambil semua data pengguna/karyawan dari Firestore
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  const hasil = [];
  snap.forEach((d) => {
    hasil.push({
      id: d.id,
      ...d.data(),
    });
  });
  return hasil.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
}

// Mengambil satu data karyawan dari Firestore
export async function ambilKaryawan(id) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
  };
}

// Memperbarui peran karyawan (role: "karyawan" | "hrd")
export async function ubahPeranKaryawan(id, role) {
  await updateDoc(doc(db, "users", id), {
    role,
  });
}

// Memperbarui nama profil pengguna
export async function ubahProfil(id, data) {
  await updateDoc(doc(db, "users", id), {
    nama: data.nama.trim(),
  });
}

// Menghitung angka ringkasan Dasbor HRD langsung dari Firestore
export async function ambilRingkasanDasbor(tanggal) {
  const [presensiSnap, cutiSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  let terlambatCount = 0;
  presensiSnap.forEach((d) => {
    const data = d.data();
    if (data.jamMasuk && terlambat(toJsDate(data.jamMasuk))) {
      terlambatCount++;
    }
  });

  return {
    hadir: presensiSnap.size,
    terlambat: terlambatCount,
    cutiMenunggu: cutiSnap.size,
    jumlahKaryawan: usersSnap.size,
  };
}

// Menghitung rekap bulanan kehadiran & cuti semua karyawan dari Firestore
export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const semuaUsers = [];
  usersSnap.forEach((d) => semuaUsers.push({ id: d.id, ...d.data() }));

  const presensiBulan = [];
  presensiSnap.forEach((d) => {
    const data = d.data();
    if (data.tanggal && data.tanggal.startsWith(bulan)) {
      presensiBulan.push({ ...data, jamMasuk: toJsDate(data.jamMasuk) });
    }
  });

  const cutiDisetujuiList = [];
  cutiSnap.forEach((d) => {
    const data = d.data();
    cutiDisetujuiList.push({
      ...data,
      tanggalMulai: toJsDate(data.tanggalMulai),
      tanggalSelesai: toJsDate(data.tanggalSelesai),
    });
  });

  return semuaUsers
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""))
    .map((u) => {
      const hadir = presensiBulan.filter((p) => p.karyawanId === u.id);
      let cutiDisetujui = 0;
      for (const c of cutiDisetujuiList) {
        if (c.karyawanId !== u.id) continue;
        for (let d = new Date(c.tanggalMulai); d <= c.tanggalSelesai; d.setDate(d.getDate() + 1)) {
          if (keTanggal(d).startsWith(bulan)) cutiDisetujui++;
        }
      }
      return {
        karyawanId: u.id,
        nama: u.nama || "(tanpa nama)",
        hariHadir: hadir.length,
        terlambat: hadir.filter((p) => p.jamMasuk && terlambat(p.jamMasuk)).length,
        cutiDisetujui,
      };
    });
}
