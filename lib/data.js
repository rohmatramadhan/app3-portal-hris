/**
 * Semua halaman mengambil dan menyimpan data lewat fungsi di sini.
 * Di Sesi 6, fungsi-fungsi ini membaca dan menulis langsung ke Cloud Firestore.
 * Jika koneksi Firestore belum diisi di .env.local, fungsi menyediakan fallback
 * ke data memori agar aplikasi dapat diuji coba langsung.
 */
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
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  users as dataContohUsers,
  presensi as dataContohPresensi,
  pengajuan_cuti as dataContohCuti,
} from "./dataContoh";
import { keTanggal, terlambat } from "./waktu";

// Penyimpanan sementara dalam memori jika Firebase belum aktif
let memoriUsers = [...dataContohUsers];
let memoriPresensi = [...dataContohPresensi];
let memoriCuti = [...dataContohCuti];

const namaKaryawanDariMemori = (id) =>
  memoriUsers.find((u) => (u.id || u.uid) === id)?.nama ?? "(tidak dikenal)";
const terbaruDulu = (a, b) => {
  const tA = a.diajukanPada instanceof Date ? a.diajukanPada.getTime() : new Date(a.diajukanPada).getTime();
  const tB = b.diajukanPada instanceof Date ? b.diajukanPada.getTime() : new Date(b.diajukanPada).getTime();
  return tB - tA;
};

function formatTimestamp(t) {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (typeof t.toDate === "function") return t.toDate();
  return new Date(t);
}

// -------------------------------------------------------------
// 1. PRESENSI (BACA & TULIS)
// -------------------------------------------------------------

export async function ambilPresensi(karyawanId, bulan) {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, "presensi"),
        where("karyawanId", "==", karyawanId)
      );
      const snapshot = await getDocs(q);
      const hasil = [];
      snapshot.forEach((d) => {
        const item = d.data();
        if (item.tanggal && item.tanggal.startsWith(bulan)) {
          hasil.push({
            id: d.id,
            ...item,
            jamMasuk: formatTimestamp(item.jamMasuk),
            jamPulang: formatTimestamp(item.jamPulang),
          });
        }
      });
      return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    } catch (err) {
      console.warn("Gagal mengambil presensi dari Firestore, memakai memori:", err);
    }
  }

  return memoriPresensi
    .filter((p) => p.karyawanId === karyawanId && p.tanggal.startsWith(bulan))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export async function ambilPresensiTanggal(karyawanId, tanggal) {
  if (isFirebaseConfigured) {
    try {
      const docId = `${karyawanId}_${tanggal}`;
      const snap = await getDoc(doc(db, "presensi", docId));
      if (snap.exists()) {
        const item = snap.data();
        return {
          id: snap.id,
          ...item,
          jamMasuk: formatTimestamp(item.jamMasuk),
          jamPulang: formatTimestamp(item.jamPulang),
        };
      }
    } catch (err) {
      console.warn("Gagal mengambil presensi hari ini dari Firestore:", err);
    }
  }

  return memoriPresensi.find((p) => p.karyawanId === karyawanId && p.tanggal === tanggal) ?? null;
}

export async function catatPresensiMasuk(karyawanId, tanggal, jam = new Date()) {
  const docId = `${karyawanId}_${tanggal}`;
  const data = {
    karyawanId,
    tanggal,
    jamMasuk: jam,
    jamPulang: null,
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, "presensi", docId), {
        ...data,
        jamMasuk: Timestamp.fromDate(jam),
        jamPulang: null,
      }, { merge: true });
    } catch (err) {
      console.error("Gagal menyimpan presensi masuk ke Firestore:", err);
    }
  }

  const existingIndex = memoriPresensi.findIndex((p) => p.karyawanId === karyawanId && p.tanggal === tanggal);
  if (existingIndex >= 0) {
    memoriPresensi[existingIndex].jamMasuk = jam;
  } else {
    memoriPresensi.push({ id: docId, ...data });
  }

  return { id: docId, ...data };
}

export async function catatPresensiPulang(karyawanId, tanggal, jam = new Date()) {
  const docId = `${karyawanId}_${tanggal}`;

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "presensi", docId), {
        jamPulang: Timestamp.fromDate(jam),
      });
    } catch (err) {
      console.error("Gagal menyimpan presensi pulang ke Firestore:", err);
    }
  }

  const existing = memoriPresensi.find((p) => p.karyawanId === karyawanId && p.tanggal === tanggal);
  if (existing) {
    existing.jamPulang = jam;
  }

  return true;
}

// -------------------------------------------------------------
// 2. PENGAJUAN CUTI (BACA, AJUKAN, SETUJUI/TOLAK)
// -------------------------------------------------------------

export async function ambilPengajuanCuti(karyawanId) {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, "pengajuan_cuti"),
        where("karyawanId", "==", karyawanId)
      );
      const snapshot = await getDocs(q);
      const hasil = [];
      snapshot.forEach((d) => {
        const item = d.data();
        hasil.push({
          id: d.id,
          ...item,
          tanggalMulai: formatTimestamp(item.tanggalMulai),
          tanggalSelesai: formatTimestamp(item.tanggalSelesai),
          diajukanPada: formatTimestamp(item.diajukanPada),
        });
      });
      return hasil.sort(terbaruDulu);
    } catch (err) {
      console.warn("Gagal mengambil cuti dari Firestore, memakai memori:", err);
    }
  }

  return memoriCuti.filter((c) => c.karyawanId === karyawanId).sort(terbaruDulu);
}

export async function ambilSatuPengajuan(id) {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, "pengajuan_cuti", id));
      if (snap.exists()) {
        const item = snap.data();
        let nama = "(tidak dikenal)";
        const userSnap = await getDoc(doc(db, "users", item.karyawanId));
        if (userSnap.exists()) nama = userSnap.data().nama || nama;
        return {
          id: snap.id,
          ...item,
          nama,
          tanggalMulai: formatTimestamp(item.tanggalMulai),
          tanggalSelesai: formatTimestamp(item.tanggalSelesai),
          diajukanPada: formatTimestamp(item.diajukanPada),
        };
      }
    } catch (err) {
      console.warn("Gagal mengambil satu pengajuan dari Firestore:", err);
    }
  }

  const c = memoriCuti.find((c) => c.id === id);
  return c ? { ...c, nama: namaKaryawanDariMemori(c.karyawanId) } : null;
}

export async function ambilSemuaPengajuan(status) {
  if (isFirebaseConfigured) {
    try {
      const snapshot = await getDocs(collection(db, "pengajuan_cuti"));
      const userSnaps = await getDocs(collection(db, "users"));
      const petaUser = {};
      userSnaps.forEach((u) => {
        petaUser[u.id] = u.data().nama;
      });

      const hasil = [];
      snapshot.forEach((d) => {
        const item = d.data();
        if (!status || status === "semua" || item.status === status) {
          hasil.push({
            id: d.id,
            ...item,
            nama: petaUser[item.karyawanId] || "(tidak dikenal)",
            tanggalMulai: formatTimestamp(item.tanggalMulai),
            tanggalSelesai: formatTimestamp(item.tanggalSelesai),
            diajukanPada: formatTimestamp(item.diajukanPada),
          });
        }
      });
      return hasil.sort(terbaruDulu);
    } catch (err) {
      console.warn("Gagal mengambil semua pengajuan dari Firestore:", err);
    }
  }

  return memoriCuti
    .filter((c) => !status || status === "semua" || c.status === status)
    .sort(terbaruDulu)
    .map((c) => ({ ...c, nama: namaKaryawanDariMemori(c.karyawanId) }));
}

export async function buatPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const tanggalSekarang = new Date();
  const dMulai = new Date(tanggalMulai);
  const dSelesai = new Date(tanggalSelesai);

  let idBaru = `C${String(memoriCuti.length + 1).padStart(3, "0")}`;

  if (isFirebaseConfigured) {
    try {
      const ref = await addDoc(collection(db, "pengajuan_cuti"), {
        karyawanId,
        tanggalMulai: Timestamp.fromDate(dMulai),
        tanggalSelesai: Timestamp.fromDate(dSelesai),
        alasan,
        status: "menunggu",
        catatanHrd: "",
        diajukanPada: Timestamp.fromDate(tanggalSekarang),
      });
      idBaru = ref.id;
    } catch (err) {
      console.error("Gagal menambah pengajuan cuti ke Firestore:", err);
    }
  }

  const cutiBaru = {
    id: idBaru,
    karyawanId,
    tanggalMulai: dMulai,
    tanggalSelesai: dSelesai,
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: tanggalSekarang,
  };
  memoriCuti.unshift(cutiBaru);

  return cutiBaru;
}

export async function putuskanCuti(id, statusBaru, catatanHrd = "") {
  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "pengajuan_cuti", id), {
        status: statusBaru,
        catatanHrd,
      });
    } catch (err) {
      console.error("Gagal memperbarui status cuti di Firestore:", err);
    }
  }

  const target = memoriCuti.find((c) => c.id === id);
  if (target) {
    target.status = statusBaru;
    target.catatanHrd = catatanHrd;
  }

  return true;
}

// -------------------------------------------------------------
// 3. KARYAWAN & PROFIL (BACA & UBAH)
// -------------------------------------------------------------

export async function ambilSemuaKaryawan() {
  if (isFirebaseConfigured) {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const hasil = [];
      snapshot.forEach((d) => {
        hasil.push({ id: d.id, ...d.data() });
      });
      if (hasil.length > 0) {
        return hasil.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      }
    } catch (err) {
      console.warn("Gagal mengambil daftar karyawan dari Firestore:", err);
    }
  }

  return [...memoriUsers].sort((a, b) => a.nama.localeCompare(b.nama));
}

export async function ambilKaryawan(id) {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn("Gagal mengambil data karyawan dari Firestore:", err);
    }
  }

  return memoriUsers.find((u) => u.id === id || u.uid === id) ?? null;
}

export async function ubahPeranKaryawan(id, roleBaru) {
  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "users", id), {
        role: roleBaru,
      });
    } catch (err) {
      console.error("Gagal mengubah peran karyawan di Firestore:", err);
    }
  }

  const k = memoriUsers.find((u) => u.id === id || u.uid === id);
  if (k) {
    k.role = roleBaru;
  }

  return true;
}

export async function ubahProfilNama(uid, namaBaru) {
  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "users", uid), {
        nama: namaBaru,
      });
    } catch (err) {
      console.error("Gagal mengubah nama profil di Firestore:", err);
    }
  }

  const k = memoriUsers.find((u) => u.id === uid || u.uid === uid);
  if (k) {
    k.nama = namaBaru;
  }

  return true;
}

// -------------------------------------------------------------
// 4. RINGKASAN & LAPORAN
// -------------------------------------------------------------

export async function ambilRingkasanDasbor(tanggal) {
  const [semuaKaryawan, daftarCuti] = await Promise.all([
    ambilSemuaKaryawan(),
    ambilSemuaPengajuan("menunggu"),
  ]);

  let hariIni = [];
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, "presensi"), where("tanggal", "==", tanggal));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        const item = d.data();
        hariIni.push({
          id: d.id,
          ...item,
          jamMasuk: formatTimestamp(item.jamMasuk),
        });
      });
    } catch (err) {
      console.warn("Gagal mengambil ringkasan presensi hari ini:", err);
      hariIni = memoriPresensi.filter((p) => p.tanggal === tanggal);
    }
  } else {
    hariIni = memoriPresensi.filter((p) => p.tanggal === tanggal);
  }

  return {
    hadir: hariIni.length,
    terlambat: hariIni.filter((p) => terlambat(p.jamMasuk)).length,
    cutiMenunggu: daftarCuti.length,
    jumlahKaryawan: semuaKaryawan.length,
  };
}

export async function ambilRekapBulanan(bulan) {
  const semuaKaryawan = await ambilSemuaKaryawan();
  const semuaCuti = await ambilSemuaPengajuan("disetujui");

  let semuaPresensi = [];
  if (isFirebaseConfigured) {
    try {
      const snapshot = await getDocs(collection(db, "presensi"));
      snapshot.forEach((d) => {
        const item = d.data();
        if (item.tanggal && item.tanggal.startsWith(bulan)) {
          semuaPresensi.push({
            id: d.id,
            ...item,
            jamMasuk: formatTimestamp(item.jamMasuk),
          });
        }
      });
    } catch (err) {
      console.warn("Gagal mengambil presensi rekap bulanan:", err);
      semuaPresensi = memoriPresensi.filter((p) => p.tanggal.startsWith(bulan));
    }
  } else {
    semuaPresensi = memoriPresensi.filter((p) => p.tanggal.startsWith(bulan));
  }

  return semuaKaryawan
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""))
    .map((u) => {
      const hadir = semuaPresensi.filter((p) => p.karyawanId === (u.id || u.uid));
      let cutiDisetujui = 0;
      for (const c of semuaCuti) {
        if (c.karyawanId !== (u.id || u.uid)) continue;
        for (let d = new Date(c.tanggalMulai); d <= c.tanggalSelesai; d.setDate(d.getDate() + 1)) {
          if (keTanggal(d).startsWith(bulan)) cutiDisetujui++;
        }
      }
      return {
        karyawanId: u.id || u.uid,
        nama: u.nama,
        hariHadir: hadir.length,
        terlambat: hadir.filter((p) => terlambat(p.jamMasuk)).length,
        cutiDisetujui,
      };
    });
}
