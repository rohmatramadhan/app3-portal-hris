/**
 * Pengambilan dan manipulasi data Firestore untuk Portal HRIS Sedap.
 * Nama koleksi dan field mengikuti PRD 7.1 dan AGENTS.md.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { keTanggal, terlambat, tanggalHariIni } from "./waktu.js";

// Mengubah Timestamp Firestore atau string tanggal ke objek Date JavaScript
function keDate(nilai) {
  if (!nilai) return null;
  if (typeof nilai.toDate === "function") return nilai.toDate();
  if (nilai instanceof Date) return nilai;
  return new Date(nilai);
}

function normalisasiPresensi(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    karyawanId: data.karyawanId,
    tanggal: data.tanggal,
    jamMasuk: keDate(data.jamMasuk),
    jamPulang: keDate(data.jamPulang),
  };
}

function normalisasiCuti(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    karyawanId: data.karyawanId,
    tanggalMulai: keDate(data.tanggalMulai),
    tanggalSelesai: keDate(data.tanggalSelesai),
    alasan: data.alasan ?? "",
    status: data.status,
    catatanHrd: data.catatanHrd ?? "",
    diajukanPada: keDate(data.diajukanPada),
  };
}

function normalisasiUser(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    nama: data.nama ?? "",
    email: data.email ?? "",
    role: data.role ?? "karyawan",
  };
}

// Sinkronisasi akun auth dengan dokumen profil users/{uid}, sekaligus membersihkan placeholder lama
export async function singkronkanPengguna(user, namaAwal = "") {
  if (!user?.uid) return null;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  let dataUser = null;
  if (userSnap.exists()) {
    dataUser = userSnap.data();
  } else {
    // Cari apakah ada dokumen placeholder lama dengan email yang sama (misal "rama", "sari")
    const usersSnap = await getDocs(collection(db, "users"));
    let oldDocId = null;
    let oldData = null;

    usersSnap.forEach((d) => {
      if (d.id !== user.uid && d.data().email?.toLowerCase() === user.email?.toLowerCase()) {
        oldDocId = d.id;
        oldData = d.data();
      }
    });

    const nama = namaAwal.trim() || oldData?.nama || user.displayName || user.email?.split("@")[0] || "Pengguna";
    const email = user.email || oldData?.email || "";
    const role = oldData?.role || "karyawan";

    dataUser = { nama, email, role };
    await setDoc(userRef, dataUser);

    if (oldDocId) {
      // Hapus dokumen placeholder lama
      await deleteDoc(doc(db, "users", oldDocId));

      // Migrasikan presensi lama ke UID baru
      const presensiSnap = await getDocs(collection(db, "presensi"));
      for (const p of presensiSnap.docs) {
        const pData = p.data();
        if (pData.karyawanId === oldDocId || p.id.startsWith(oldDocId + "-")) {
          const newDocId = `${user.uid}-${pData.tanggal}`;
          await setDoc(doc(db, "presensi", newDocId), {
            ...pData,
            karyawanId: user.uid,
          });
          if (p.id !== newDocId) {
            await deleteDoc(doc(db, "presensi", p.id));
          }
        }
      }

      // Migrasikan pengajuan cuti lama
      const cutiSnap = await getDocs(collection(db, "pengajuan_cuti"));
      for (const c of cutiSnap.docs) {
        if (c.data().karyawanId === oldDocId) {
          await updateDoc(doc(db, "pengajuan_cuti", c.id), {
            karyawanId: user.uid,
          });
        }
      }
    }
  }

  return { id: user.uid, ...dataUser };
}

// Mengambil riwayat presensi karyawan untuk bulan tertentu ("2026-10")
export async function ambilPresensi(karyawanId, bulan) {
  const q = query(collection(db, "presensi"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  return snap.docs
    .map(normalisasiPresensi)
    .filter((p) => p.tanggal.startsWith(bulan))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// Mengambil catatan presensi karyawan pada tanggal tertentu ("2026-10-09")
export async function ambilPresensiTanggal(karyawanId, tanggal) {
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return normalisasiPresensi(snap);
  }
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

// Mencatat jam masuk hari ini ke Firestore
export async function catatMasuk(karyawanId, tanggal = tanggalHariIni()) {
  const docId = `${karyawanId}-${tanggal}`;
  const sekarang = new Date();
  const docRef = doc(db, "presensi", docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().jamMasuk) {
    throw new Error("Presensi masuk hari ini sudah tercatat.");
  }
  const data = {
    karyawanId,
    tanggal,
    jamMasuk: Timestamp.fromDate(sekarang),
    jamPulang: null,
  };
  await setDoc(docRef, data, { merge: true });
  return { id: docId, ...data, jamMasuk: sekarang, jamPulang: null };
}

// Mencatat jam pulang hari ini ke Firestore
export async function catatPulang(karyawanId, tanggal = tanggalHariIni()) {
  const docId = `${karyawanId}-${tanggal}`;
  const sekarang = new Date();
  const docRef = doc(db, "presensi", docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Belum ada catatan masuk untuk hari ini.");
  }
  await updateDoc(docRef, {
    jamPulang: Timestamp.fromDate(sekarang),
  });
  return {
    id: docId,
    ...docSnap.data(),
    jamMasuk: keDate(docSnap.data().jamMasuk),
    jamPulang: sekarang,
  };
}

// Mengambil daftar pengajuan cuti milik satu karyawan
export async function ambilPengajuanCuti(karyawanId) {
  const q = query(collection(db, "pengajuan_cuti"), where("karyawanId", "==", karyawanId));
  const snap = await getDocs(q);
  return snap.docs
    .map(normalisasiCuti)
    .sort((a, b) => b.diajukanPada - a.diajukanPada);
}

// Mengambil satu pengajuan cuti beserta nama pemohonnya
export async function ambilSatuPengajuan(id) {
  const docRef = doc(db, "pengajuan_cuti", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const c = normalisasiCuti(docSnap);
  const userSnap = await getDoc(doc(db, "users", c.karyawanId));
  const nama = userSnap.exists() ? userSnap.data().nama : "(tidak dikenal)";
  return { ...c, nama };
}

// Mengambil semua pengajuan cuti untuk halaman Persetujuan Cuti HRD
export async function ambilSemuaPengajuan(status) {
  const [usersSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "pengajuan_cuti")),
  ]);

  const userMap = {};
  usersSnap.forEach((d) => {
    userMap[d.id] = d.data().nama;
  });

  return cutiSnap.docs
    .map((d) => {
      const c = normalisasiCuti(d);
      return {
        ...c,
        nama: userMap[c.karyawanId] ?? "(tidak dikenal)",
      };
    })
    .filter((c) => !status || status === "semua" || c.status === status)
    .sort((a, b) => b.diajukanPada - a.diajukanPada);
}

// Mengajukan cuti baru ke koleksi pengajuan_cuti
export async function ajukanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  const snap = await getDocs(collection(db, "pengajuan_cuti"));
  let maxNum = 0;
  snap.forEach((d) => {
    const match = d.id.match(/^C(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const idBaru = `C${String(maxNum + 1).padStart(3, "0")}`;

  const tglMulai = typeof tanggalMulai === "string" ? new Date(tanggalMulai + "T00:00:00") : tanggalMulai;
  const tglSelesai = typeof tanggalSelesai === "string" ? new Date(tanggalSelesai + "T00:00:00") : tanggalSelesai;
  const sekarang = new Date();

  const data = {
    karyawanId,
    tanggalMulai: Timestamp.fromDate(tglMulai),
    tanggalSelesai: Timestamp.fromDate(tglSelesai),
    alasan: alasan.trim(),
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: Timestamp.fromDate(sekarang),
  };

  await setDoc(doc(db, "pengajuan_cuti", idBaru), data);
  return { id: idBaru, ...data, tanggalMulai: tglMulai, tanggalSelesai: tglSelesai, diajukanPada: sekarang };
}

// HRD memutuskan pengajuan cuti (setujui atau tolak) beserta catatan
export async function putuskanPengajuanCuti(id, { status, catatanHrd = "" }) {
  const docRef = doc(db, "pengajuan_cuti", id);
  await updateDoc(docRef, {
    status,
    catatanHrd: (catatanHrd ?? "").trim(),
  });
}

// Mengambil semua data karyawan dari koleksi users
export async function ambilSemuaKaryawan() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(normalisasiUser).sort((a, b) => a.nama.localeCompare(b.nama));
}

// Mengambil satu data karyawan dari koleksi users
export async function ambilKaryawan(id) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  return normalisasiUser(snap);
}

// Memperbarui nama profil pengguna di koleksi users
export async function ubahProfil(id, { nama }) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, {
    nama: nama.trim(),
  });
}

// HRD mengubah peran karyawan (karyawan atau hrd) di koleksi users
export async function ubahPeranKaryawan(id, role) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, {
    role,
  });
}

// Angka ringkasan untuk Dasbor HRD
export async function ambilRingkasanDasbor(tanggal) {
  const [presensiSnap, cutiSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, "presensi"), where("tanggal", "==", tanggal))),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "menunggu"))),
    getDocs(collection(db, "users")),
  ]);

  const presensiHariIni = presensiSnap.docs.map(normalisasiPresensi);
  return {
    hadir: presensiHariIni.length,
    terlambat: presensiHariIni.filter((p) => p.jamMasuk && terlambat(p.jamMasuk)).length,
    cutiMenunggu: cutiSnap.size,
    jumlahKaryawan: usersSnap.size,
  };
}

// Rekap kehadiran dan cuti per karyawan untuk halaman Laporan HRD
export async function ambilRekapBulanan(bulan) {
  const [usersSnap, presensiSnap, cutiSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "presensi")),
    getDocs(query(collection(db, "pengajuan_cuti"), where("status", "==", "disetujui"))),
  ]);

  const usersList = usersSnap.docs.map(normalisasiUser).sort((a, b) => a.nama.localeCompare(b.nama));
  const presensiList = presensiSnap.docs.map(normalisasiPresensi).filter((p) => p.tanggal.startsWith(bulan));
  const cutiList = cutiSnap.docs.map(normalisasiCuti);

  return usersList.map((u) => {
    const hadir = presensiList.filter((p) => p.karyawanId === u.id);
    let cutiDisetujui = 0;
    for (const c of cutiList) {
      if (c.karyawanId !== u.id) continue;
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
