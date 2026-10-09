import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { users as usersContoh, presensi as presensiContoh, pengajuan_cuti as cutiContoh } from "./dataContoh";
import { keTanggal, terlambat, tanggalHariIni } from "./waktu";
import { perbaruiPenggunaLokal } from "./pengguna";

// Helper konversi Timestamp Firestore ke Date JavaScript
function keDate(val) {
  if (!val) return null;
  if (val.toDate && typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
}

// Mengambil nama karyawan berdasarkan ID
async function dapatkanNamaKaryawan(karyawanId) {
  if (!isFirebaseConfigured) {
    return usersContoh.find((u) => u.id === karyawanId)?.nama ?? "(tidak dikenal)";
  }
  try {
    const snap = await getDoc(doc(db, "users", karyawanId));
    if (snap.exists()) return snap.data().nama || "(tanpa nama)";
  } catch (err) {
    console.error("Gagal membaca nama karyawan:", err);
  }
  return usersContoh.find((u) => u.id === karyawanId)?.nama ?? "(tidak dikenal)";
}

// ---------------------------------------------------------------------------
// 1. PRESENSI (CRUD)
// ---------------------------------------------------------------------------

/**
 * Mengambil daftar presensi karyawan di bulan tertentu (format "YYYY-MM")
 */
export async function ambilPresensi(karyawanId, bulan) {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, "presensi"),
        where("karyawanId", "==", karyawanId)
      );
      const snap = await getDocs(q);
      const hasil = [];
      snap.forEach((d) => {
        const item = d.data();
        if (item.tanggal && item.tanggal.startsWith(bulan)) {
          hasil.push({
            id: d.id,
            karyawanId: item.karyawanId,
            tanggal: item.tanggal,
            jamMasuk: keDate(item.jamMasuk),
            jamPulang: keDate(item.jamPulang),
          });
        }
      });
      if (hasil.length > 0) {
        return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      }
    } catch (err) {
      console.warn("Gagal mengambil presensi dari Firestore, beralih ke data contoh:", err);
    }
  }

  // Fallback ke data contoh
  return presensiContoh
    .filter((p) => p.karyawanId === karyawanId && p.tanggal.startsWith(bulan))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

/**
 * Mengambil catatan presensi karyawan pada tanggal tertentu ("YYYY-MM-DD")
 */
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  if (isFirebaseConfigured) {
    try {
      const idDokumen = `${karyawanId}-${tanggal}`;
      const snap = await getDoc(doc(db, "presensi", idDokumen));
      if (snap.exists()) {
        const item = snap.data();
        return {
          id: snap.id,
          karyawanId: item.karyawanId,
          tanggal: item.tanggal,
          jamMasuk: keDate(item.jamMasuk),
          jamPulang: keDate(item.jamPulang),
        };
      }
    } catch (err) {
      console.warn("Gagal mengambil presensi tanggal:", err);
    }
  }

  return presensiContoh.find((p) => p.karyawanId === karyawanId && p.tanggal === tanggal) ?? null;
}

/**
 * Mencatat jam masuk presensi
 */
export async function catatPresensiMasuk(karyawanId, tanggal = tanggalHariIni(), waktu = new Date()) {
  const idDokumen = `${karyawanId}-${tanggal}`;
  const data = {
    karyawanId,
    tanggal,
    jamMasuk: Timestamp.fromDate(waktu),
    jamPulang: null,
  };

  if (isFirebaseConfigured) {
    await setDoc(doc(db, "presensi", idDokumen), data);
  }
  return { id: idDokumen, ...data, jamMasuk: waktu };
}

/**
 * Mencatat jam pulang presensi
 */
export async function catatPresensiPulang(karyawanId, tanggal = tanggalHariIni(), waktu = new Date()) {
  const idDokumen = `${karyawanId}-${tanggal}`;

  if (isFirebaseConfigured) {
    await updateDoc(doc(db, "presensi", idDokumen), {
      jamPulang: Timestamp.fromDate(waktu),
    });
  }
  return { id: idDokumen, jamPulang: waktu };
}

// ---------------------------------------------------------------------------
// 2. CUTI (CRUD)
// ---------------------------------------------------------------------------

/**
 * Mengambil riwayat pengajuan cuti milik seorang karyawan
 */
export async function ambilPengajuanCuti(karyawanId) {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, "pengajuan_cuti"),
        where("karyawanId", "==", karyawanId)
      );
      const snap = await getDocs(q);
      const hasil = [];
      snap.forEach((d) => {
        const item = d.data();
        hasil.push({
          id: d.id,
          ...item,
          tanggalMulai: keDate(item.tanggalMulai),
          tanggalSelesai: keDate(item.tanggalSelesai),
          diajukanPada: keDate(item.diajukanPada),
        });
      });
      if (hasil.length > 0) {
        return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
      }
    } catch (err) {
      console.warn("Gagal mengambil cuti karyawan:", err);
    }
  }

  return cutiContoh.filter((c) => c.karyawanId === karyawanId).sort((a, b) => b.diajukanPada - a.diajukanPada);
}

/**
 * Mengambil satu rincian pengajuan cuti berdasarkan ID dokumen
 */
export async function ambilSatuPengajuan(id) {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, "pengajuan_cuti", id));
      if (snap.exists()) {
        const item = snap.data();
        const nama = await dapatkanNamaKaryawan(item.karyawanId);
        return {
          id: snap.id,
          ...item,
          nama,
          tanggalMulai: keDate(item.tanggalMulai),
          tanggalSelesai: keDate(item.tanggalSelesai),
          diajukanPada: keDate(item.diajukanPada),
        };
      }
    } catch (err) {
      console.warn("Gagal mengambil rincian cuti:", err);
    }
  }

  const c = cutiContoh.find((c) => c.id === id);
  if (!c) return null;
  const nama = usersContoh.find((u) => u.id === c.karyawanId)?.nama ?? "(tidak dikenal)";
  return { ...c, nama };
}

/**
 * Mengambil semua pengajuan cuti (untuk menu Persetujuan Cuti HRD)
 */
export async function ambilSemuaPengajuan(status) {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, "pengajuan_cuti"));
      const userMap = {};
      const userSnap = await getDocs(collection(db, "users"));
      userSnap.forEach((u) => {
        userMap[u.id] = u.data().nama;
      });

      const hasil = [];
      snap.forEach((d) => {
        const item = d.data();
        if (!status || status === "semua" || item.status === status) {
          hasil.push({
            id: d.id,
            ...item,
            nama: userMap[item.karyawanId] || "(tidak dikenal)",
            tanggalMulai: keDate(item.tanggalMulai),
            tanggalSelesai: keDate(item.tanggalSelesai),
            diajukanPada: keDate(item.diajukanPada),
          });
        }
      });
      if (hasil.length > 0) {
        return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
      }
    } catch (err) {
      console.warn("Gagal mengambil semua pengajuan cuti:", err);
    }
  }

  return cutiContoh
    .filter((c) => !status || status === "semua" || c.status === status)
    .sort((a, b) => b.diajukanPada - a.diajukanPada)
    .map((c) => ({
      ...c,
      nama: usersContoh.find((u) => u.id === c.karyawanId)?.nama ?? "(tidak dikenal)",
    }));
}

/**
 * Mengajukan cuti baru ke koleksi pengajuan_cuti di Firestore
 */
export async function simpanPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const sekarang = new Date();
  const nomorAcak = Math.floor(100 + Math.random() * 900);
  const idKustom = `C${nomorAcak}`;

  const data = {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(new Date(`${tanggalMulai}T00:00:00`)),
    tanggalSelesai: Timestamp.fromDate(new Date(`${tanggalSelesai}T23:59:59`)),
    alasan: alasan.trim(),
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(sekarang),
  };

  if (isFirebaseConfigured) {
    await setDoc(doc(db, "pengajuan_cuti", idKustom), data);
  }
  return { id: idKustom, ...data, tanggalMulai, tanggalSelesai, diajukanPada: sekarang };
}

/**
 * Menyetujui atau menolak cuti dan menambahkan catatan HRD
 */
export async function putuskanCuti(id, status, catatanHrd = "") {
  if (isFirebaseConfigured) {
    await updateDoc(doc(db, "pengajuan_cuti", id), {
      status,
      catatanHrd: catatanHrd.trim(),
    });
  }
  return { id, status, catatanHrd };
}

// ---------------------------------------------------------------------------
// 3. KARYAWAN & PROFIL (CRUD)
// ---------------------------------------------------------------------------

/**
 * Mengambil daftar seluruh karyawan untuk Dasbor HRD
 */
export async function ambilSemuaKaryawan() {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, "users"));
      const hasil = [];
      snap.forEach((d) => {
        hasil.push({ id: d.id, ...d.data() });
      });
      if (hasil.length > 0) {
        return hasil.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      }
    } catch (err) {
      console.warn("Gagal mengambil data karyawan:", err);
    }
  }

  return [...usersContoh].sort((a, b) => a.nama.localeCompare(b.nama));
}

/**
 * Mengambil satu data karyawan berdasarkan ID (uid)
 */
export async function ambilKaryawan(id) {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn("Gagal mengambil karyawan:", err);
    }
  }

  return usersContoh.find((u) => u.id === id) ?? null;
}

/**
 * Mengubah peran karyawan di users/{id} (dilakukan oleh HRD)
 */
export async function ubahPeranKaryawan(id, role) {
  if (isFirebaseConfigured) {
    await updateDoc(doc(db, "users", id), { role });
  }
  return { id, role };
}

/**
 * Mengubah nama profil pengguna sendiri di users/{uid}
 */
export async function ubahProfil(uid, { nama }) {
  if (isFirebaseConfigured) {
    await updateDoc(doc(db, "users", uid), { nama: nama.trim() });
  }
  perbaruiPenggunaLokal({ nama: nama.trim() });
  return { uid, nama: nama.trim() };
}

// ---------------------------------------------------------------------------
// 4. RINGKASAN & LAPORAN
// ---------------------------------------------------------------------------

/**
 * Angka ringkasan untuk Dasbor HRD
 */
export async function ambilRingkasanDasbor(tanggal) {
  if (isFirebaseConfigured) {
    try {
      const [snapPresensi, snapCuti, snapUsers] = await Promise.all([
        getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
        getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
        getDocs(collection(db, "users")),
      ]);

      let hadir = 0;
      let terlambatCount = 0;

      snapPresensi.forEach((d) => {
        hadir++;
        const p = d.data();
        if (p.jamMasuk && terlambat(keDate(p.jamMasuk))) {
          terlambatCount++;
        }
      });

      return {
        hadir,
        terlambat: terlambatCount,
        cutiMenunggu: snapCuti.size,
        jumlahKaryawan: snapUsers.size,
      };
    } catch (err) {
      console.warn("Gagal mengambil ringkasan dasbor:", err);
    }
  }

  const hariIni = presensiContoh.filter((p) => p.tanggal === tanggal);
  return {
    hadir: hariIni.length,
    terlambat: hariIni.filter((p) => terlambat(p.jamMasuk)).length,
    cutiMenunggu: cutiContoh.filter((c) => c.status === "menunggu").length,
    jumlahKaryawan: usersContoh.length,
  };
}

/**
 * Rekap bulanan untuk halaman Laporan HRD (PRD 4.9)
 */
export async function ambilRekapBulanan(bulan) {
  if (isFirebaseConfigured) {
    try {
      const [snapUsers, snapPresensi, snapCuti] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "presensi")),
        getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
      ]);

      const presensiList = [];
      snapPresensi.forEach((d) => {
        const item = d.data();
        if (item.tanggal && item.tanggal.startsWith(bulan)) {
          presensiList.push({ ...item, jamMasuk: keDate(item.jamMasuk) });
        }
      });

      const cutiList = [];
      snapCuti.forEach((d) => {
        const item = d.data();
        cutiList.push({
          ...item,
          tanggalMulai: keDate(item.tanggalMulai),
          tanggalSelesai: keDate(item.tanggalSelesai),
        });
      });

      const hasil = [];
      snapUsers.forEach((uDoc) => {
        const u = { id: uDoc.id, ...uDoc.data() };
        const hadir = presensiList.filter((p) => p.karyawanId === u.id);
        let cutiDisetujui = 0;
        for (const c of cutiList) {
          if (c.karyawanId !== u.id) continue;
          for (let d = new Date(c.tanggalMulai); d <= c.tanggalSelesai; d.setDate(d.getDate() + 1)) {
            if (keTanggal(d).startsWith(bulan)) cutiDisetujui++;
          }
        }
        hasil.push({
          karyawanId: u.id,
          nama: u.nama,
          hariHadir: hadir.length,
          terlambat: hadir.filter((p) => terlambat(p.jamMasuk)).length,
          cutiDisetujui,
        });
      });

      if (hasil.length > 0) {
        return hasil.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      }
    } catch (err) {
      console.warn("Gagal mengambil rekap bulanan:", err);
    }
  }

  return [...usersContoh]
    .sort((a, b) => a.nama.localeCompare(b.nama))
    .map((u) => {
      const hadir = presensiContoh.filter((p) => p.karyawanId === u.id && p.tanggal.startsWith(bulan));
      let cutiDisetujui = 0;
      for (const c of cutiContoh) {
        if (c.karyawanId !== u.id || c.status !== "disetujui") continue;
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
