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
import { keTanggal, terlambat, tanggalHariIni } from "./waktu.js";

/**
 * Konversi field Timestamp dari Firestore ke Date JavaScript
 * agar kompatibel dengan seluruh fungsi pembantu tanggal & komponen UI.
 */
function konversiData(id, data) {
  if (!data) return null;
  const hasil = { id, ...data };
  for (const kunci of ["jamMasuk", "jamPulang", "tanggalMulai", "tanggalSelesai", "diajukanPada"]) {
    if (hasil[kunci] && typeof hasil[kunci].toDate === "function") {
      hasil[kunci] = hasil[kunci].toDate();
    } else if (hasil[kunci] && typeof hasil[kunci] === "string" && kunci !== "tanggal") {
      hasil[kunci] = new Date(hasil[kunci]);
    }
  }
  return hasil;
}

function konversiDoc(snap) {
  if (!snap.exists()) return null;
  return konversiData(snap.id, snap.data());
}

async function ambilPetaNama() {
  const snap = await getDocs(collection(db, "users"));
  const peta = {};
  snap.forEach((d) => {
    peta[d.id] = d.data().nama || d.id;
  });
  return peta;
}

// -------------------------------------------------------------
// READ QUERIES (Firestore)
// -------------------------------------------------------------

export async function ambilPresensi(karyawanId, bulan) {
  const q = query(collection(db, "presensi"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  const hasil = [];
  snap.forEach((docSnap) => {
    const p = konversiData(docSnap.id, docSnap.data());
    if (p.tanggal && p.tanggal.startsWith(bulan)) {
      hasil.push(p);
    }
  });
  return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export async function ambilPresensiTanggal(karyawanId, tanggal) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return konversiDoc(snap);
  }
  const q = query(
    collection(db, "presensi"),
    where("karyawanId", "==", karyawanId),
    where("tanggal", "==", tanggal)
  );
  const qSnap = await getDocs(q);
  if (!qSnap.empty) {
    return konversiDoc(qSnap.docs[0]);
  }
  return null;
}

export async function ambilPengajuanCuti(karyawanId) {
  const q = query(collection(db, "pengajuan_cuti"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  const hasil = [];
  snap.forEach((docSnap) => {
    hasil.push(konversiData(docSnap.id, docSnap.data()));
  });
  return hasil.sort((a, b) => (b.diajukanPada || 0) - (a.diajukanPada || 0));
}

export async function ambilSatuPengajuan(id) {
  const snap = await getDoc(doc(db, "pengajuan_cuti", id));
  if (!snap.exists()) return null;
  const c = konversiDoc(snap);
  let nama = "(tidak dikenal)";
  if (c.karyawanId) {
    const userSnap = await getDoc(doc(db, "users", c.karyawanId));
    if (userSnap.exists()) {
      nama = userSnap.data().nama || c.karyawanId;
    }
  }
  return { ...c, nama };
}

export async function ambilSemuaPengajuan(status) {
  const [cutiSnap, petaNama] = await Promise.all([
    getDocs(collection(db, "pengajuan_cuti")),
    ambilPetaNama(),
  ]);
  const hasil = [];
  cutiSnap.forEach((docSnap) => {
    const c = konversiData(docSnap.id, docSnap.data());
    if (!status || status === "semua" || c.status === status) {
      hasil.push({ ...c, nama: petaNama[c.karyawanId] || c.karyawanId || "(tidak dikenal)" });
    }
  });
  return hasil.sort((a, b) => (b.diajukanPada || 0) - (a.diajukanPada || 0));
}

export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  const hasil = [];
  snap.forEach((docSnap) => {
    hasil.push({ id: docSnap.id, ...docSnap.data() });
  });
  return hasil.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
}

export async function ambilKaryawan(id) {
  const snap = await getDoc(doc(db, "users", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function ambilRingkasanDasbor(tanggal) {
  const [presensiSnap, cutiSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  let hadir = 0;
  let jumlahTerlambat = 0;
  presensiSnap.forEach((docSnap) => {
    hadir++;
    const data = konversiData(docSnap.id, docSnap.data());
    if (data.jamMasuk && terlambat(data.jamMasuk)) {
      jumlahTerlambat++;
    }
  });

  return {
    hadir,
    terlambat: jumlahTerlambat,
    cutiMenunggu: cutiSnap.size,
    jumlahKaryawan: usersSnap.size,
  };
}

export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const daftarUser = [];
  usersSnap.forEach((d) => daftarUser.push({ id: d.id, ...d.data() }));
  daftarUser.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

  const semuaPresensi = [];
  presensiSnap.forEach((d) => {
    const p = konversiData(d.id, d.data());
    if (p.tanggal && p.tanggal.startsWith(bulan)) {
      semuaPresensi.push(p);
    }
  });

  const semuaCutiDisetujui = [];
  cutiSnap.forEach((d) => semuaCutiDisetujui.push(konversiData(d.id, d.data())));

  return daftarUser.map((u) => {
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

// -------------------------------------------------------------
// WRITE MUTATIONS (Firestore)
// -------------------------------------------------------------

export async function simpanPresensiMasuk(karyawanId) {
  const tanggal = tanggalHariIni();
  const id = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", id);
  const sekarang = Timestamp.now();
  await setDoc(
    docRef,
    {
      karyawanId,
      tanggal,
      jamMasuk: sekarang,
      jamPulang: null,
    },
    { merge: true }
  );
  return { id, karyawanId, tanggal, jamMasuk: sekarang.toDate(), jamPulang: null };
}

export async function simpanPresensiPulang(karyawanId) {
  const tanggal = tanggalHariIni();
  const id = `${karyawanId}-${tanggal}`;
  const docRef = doc(db, "presensi", id);
  const sekarang = Timestamp.now();
  await updateDoc(docRef, {
    jamPulang: sekarang,
  });
  return sekarang.toDate();
}

export async function simpanPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  // Buat ID unik dengan awalan 'C' tanpa perlu membaca seluruh koleksi
  const nomorBaru = "C" + Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
  const docRef = doc(db, "pengajuan_cuti", nomorBaru);
  const tMulai = Timestamp.fromDate(new Date(`${tanggalMulai}T00:00:00`));
  const tSelesai = Timestamp.fromDate(new Date(`${tanggalSelesai}T00:00:00`));
  const diajukanPada = Timestamp.now();
  await setDoc(docRef, {
    karyawanId,
    tanggalMulai: tMulai,
    tanggalSelesai: tSelesai,
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada,
  });
  return { id: nomorBaru };
}

export async function simpanKeputusanCuti(id, { status, catatanHrd = "" }) {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status,
    catatanHrd: catatanHrd || "",
  });
}

export async function simpanProfil(uid, { nama }) {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    nama,
  });
}

export async function simpanPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, {
    role,
  });
}
