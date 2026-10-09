/**
 * Fungsi pembaca dan pembaru data yang tersambung langsung ke Cloud Firestore.
 * Mengikuti spesifikasi koleksi dan field pada PRD 7.1.
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

function normalisasiTimestamp(val) {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  return null;
}

const terbaruDulu = (a, b) => {
  const timeA = a.diajukanPada instanceof Date ? a.diajukanPada.getTime() : 0;
  const timeB = b.diajukanPada instanceof Date ? b.diajukanPada.getTime() : 0;
  return timeB - timeA;
};

async function ambilNamaKaryawan(id) {
  if (!id) return "(tidak dikenal)";
  try {
    const snap = await getDoc(doc(db, "users", id));
    if (snap.exists()) return snap.data().nama || "(tidak dikenal)";
  } catch (err) {
    console.error("Gagal mengambil nama karyawan:", err);
  }
  return "(tidak dikenal)";
}

// Mengambil presensi seorang karyawan untuk bulan tertentu (format YYYY-MM)
export async function ambilPresensi(karyawanId, bulan) {
  const q = query(collection(db, "presensi"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  const hasil = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      karyawanId: data.karyawanId,
      tanggal: data.tanggal,
      jamMasuk: normalisasiTimestamp(data.jamMasuk),
      jamPulang: normalisasiTimestamp(data.jamPulang),
    };
  });
  return hasil
    .filter((p) => p.tanggal && p.tanggal.startsWith(bulan))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// Mengambil presensi seorang karyawan pada tanggal tertentu
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      karyawanId: data.karyawanId,
      tanggal: data.tanggal,
      jamMasuk: normalisasiTimestamp(data.jamMasuk),
      jamPulang: normalisasiTimestamp(data.jamPulang),
    };
  }
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
      jamMasuk: normalisasiTimestamp(data.jamMasuk),
      jamPulang: normalisasiTimestamp(data.jamPulang),
    };
  }
  return null;
}

// Menyimpan catatan jam masuk presensi
export async function catatPresensiMasuk(karyawanId, tanggal, waktu = new Date()) {
  const id = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", id);
  await setDoc(
    docRef,
    {
      karyawanId,
      tanggal,
      jamMasuk: Timestamp.fromDate(waktu),
      jamPulang: null,
    },
    { merge: true }
  );
  return { id, karyawanId, tanggal, jamMasuk: waktu, jamPulang: null };
}

// Menyimpan catatan jam pulang presensi
export async function catatPresensiPulang(karyawanId, tanggal, waktu = new Date()) {
  const id = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", id);
  await updateDoc(docRef, {
    jamPulang: Timestamp.fromDate(waktu),
  });
  return { id, karyawanId, tanggal, jamPulang: waktu };
}

// Mengambil daftar pengajuan cuti milik seorang karyawan
export async function ambilPengajuanCuti(karyawanId) {
  const q = query(collection(db, "pengajuan_cuti"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        karyawanId: data.karyawanId,
        tanggalMulai: normalisasiTimestamp(data.tanggalMulai),
        tanggalSelesai: normalisasiTimestamp(data.tanggalSelesai),
        alasan: data.alasan,
        status: data.status,
        catatanHrd: data.catatanHrd || "",
        diajukanPada: normalisasiTimestamp(data.diajukanPada),
      };
    })
    .sort(terbaruDulu);
}

// Mengambil satu rincian pengajuan cuti berdasarkan nomor id
export async function ambilSatuPengajuan(id) {
  const docRef = doc(db, "pengajuan_cuti", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const nama = await ambilNamaKaryawan(data.karyawanId);
  return {
    id: snap.id,
    karyawanId: data.karyawanId,
    nama,
    tanggalMulai: normalisasiTimestamp(data.tanggalMulai),
    tanggalSelesai: normalisasiTimestamp(data.tanggalSelesai),
    alasan: data.alasan,
    status: data.status,
    catatanHrd: data.catatanHrd || "",
    diajukanPada: normalisasiTimestamp(data.diajukanPada),
  };
}

// Menambahkan pengajuan cuti baru ke koleksi pengajuan_cuti
export async function tambahPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const snap = await getDocs(collection(db, "pengajuan_cuti"));
  let maxNum = 0;
  snap.docs.forEach((d) => {
    const match = d.id.match(/^C(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  const id = `C${String(maxNum + 1).padStart(3, "0")}`;
  const tMulai = typeof tanggalMulai === "string" ? new Date(tanggalMulai + "T00:00:00") : tanggalMulai;
  const tSelesai = typeof tanggalSelesai === "string" ? new Date(tanggalSelesai + "T00:00:00") : tanggalSelesai;
  const diajukan = new Date();

  await setDoc(doc(db, "pengajuan_cuti", id), {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(tMulai),
    tanggalSelesai: Timestamp.fromDate(tSelesai),
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(diajukan),
  });

  return {
    id,
    karyawanId,
    tanggalMulai: tMulai,
    tanggalSelesai: tSelesai,
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: diajukan,
  };
}

// Mengambil semua pengajuan cuti untuk admin HRD (bisa disaring berdasarkan status)
export async function ambilSemuaPengajuan(status) {
  const [snapCuti, semuaKaryawan] = await Promise.all([
    getDocs(collection(db, "pengajuan_cuti")),
    ambilSemuaKaryawan(),
  ]);
  const petaNama = Object.fromEntries(semuaKaryawan.map((k) => [k.id, k.nama]));

  const semua = snapCuti.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      karyawanId: data.karyawanId,
      nama: petaNama[data.karyawanId] || "(tidak dikenal)",
      tanggalMulai: normalisasiTimestamp(data.tanggalMulai),
      tanggalSelesai: normalisasiTimestamp(data.tanggalSelesai),
      alasan: data.alasan,
      status: data.status,
      catatanHrd: data.catatanHrd || "",
      diajukanPada: normalisasiTimestamp(data.diajukanPada),
    };
  });

  return semua
    .filter((c) => !status || status === "semua" || c.status === status)
    .sort(terbaruDulu);
}

// HRD memutuskan pengajuan cuti (setujui atau tolak) dan memberi catatan
export async function putuskanPengajuanCuti(id, status, catatanHrd = "") {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status,
    catatanHrd,
  });
}

// Mengambil seluruh data karyawan dari koleksi users
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        nama: data.nama || "",
        email: data.email || "",
        role: data.role || "karyawan",
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

// Mengambil satu profil pengguna dari koleksi users
export async function ambilKaryawan(id) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    nama: d.nama || "",
    email: d.email || "",
    role: d.role || "karyawan",
  };
}

// Memperbarui nama profil pengguna di Firestore
export async function ubahProfil(id, { nama }) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { nama });
}

// Memperbarui peran akun karyawan di Firestore
export async function ubahPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { role });
}

/**
 * Cek dokumen users/{uid} di Firestore setelah pengguna berhasil masuk dengan cara apa pun.
 * Bila belum ada, buat dokumen baru berisi nama, email, dan role "karyawan".
 * Bila sudah ada, jangan diubah (pertahankan data yang sudah ada).
 * Kata sandi tidak pernah disimpan di dokumen ini.
 */
export async function pastikanProfilKaryawan(user, namaKustom = "") {
  if (!user?.uid) return null;
  const docRef = doc(db, "users", user.uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    const dataBaru = {
      nama: (namaKustom || user.displayName || user.email?.split("@")[0] || "Karyawan").trim(),
      email: user.email || "",
      role: "karyawan",
    };
    await setDoc(docRef, dataBaru);
    return dataBaru;
  }
  return snap.data();
}

// Menghitung angka ringkasan untuk Dasbor HRD
export async function ambilRingkasanDasbor(tanggal) {
  const [snapPresensi, snapCuti, snapUsers] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  const hariIni = snapPresensi.docs.map((d) => ({
    ...d.data(),
    jamMasuk: normalisasiTimestamp(d.data().jamMasuk),
  }));

  return {
    hadir: hariIni.length,
    terlambat: hariIni.filter((p) => p.jamMasuk && terlambat(p.jamMasuk)).length,
    cutiMenunggu: snapCuti.size,
    jumlahKaryawan: snapUsers.size,
  };
}

// Menyusun rekapitulasi bulanan per karyawan untuk halaman Laporan
export async function ambilRekapBulanan(bulan) {
  const [karyawanList, snapPresensi, snapCuti] = await Promise.all([
    ambilSemuaKaryawan(),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const semuaPresensi = snapPresensi.docs
    .map((d) => ({
      ...d.data(),
      jamMasuk: normalisasiTimestamp(d.data().jamMasuk),
    }))
    .filter((p) => p.tanggal && p.tanggal.startsWith(bulan));

  const semuaCutiDisetujui = snapCuti.docs.map((d) => ({
    ...d.data(),
    tanggalMulai: normalisasiTimestamp(d.data().tanggalMulai),
    tanggalSelesai: normalisasiTimestamp(d.data().tanggalSelesai),
  }));

  return karyawanList.map((u) => {
    const hadir = semuaPresensi.filter((p) => p.karyawanId === u.id);
    let cutiDisetujui = 0;
    for (const c of semuaCutiDisetujui) {
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
