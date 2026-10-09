/**
 * Semua halaman mengambil data lewat fungsi di sini, bukan langsung dari Firestore.
 * Mengambil dan menyimpan data ke Firestore dengan mempertahankan bentuk keluaran.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { keTanggal, terlambat } from "./waktu.js";

// Helper konversi Timestamp Firestore atau string ke Date
function keDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === "function") return val.toDate();
  return new Date(val);
}

// Ambil data user untuk mapping nama karyawan
async function dapatkanMapPengguna() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const map = {};
    snap.forEach((d) => {
      map[d.id] = d.data().nama;
    });
    // Mapping alias untuk uid auth
    map["qcIeHksMTWZwUJQ8VfNheE9WzWJ2"] = map["qcIeHksMTWZwUJQ8VfNheE9WzWJ2"] || map["dina"] || "Dina";
    map["jlKDa8Wz8MQwTczuulUMgGSozjH2"] = map["jlKDa8Wz8MQwTczuulUMgGSozjH2"] || map["wulan"] || "Wulan";
    return map;
  } catch (err) {
    console.error("Gagal mengambil map pengguna:", err);
    return {};
  }
}

// bulan berformat "2026-09" atau "2026-10"
export async function ambilPresensi(karyawanId, bulan) {
  if (!karyawanId) return [];
  try {
    const ids = [karyawanId];
    if (karyawanId === "qcIeHksMTWZwUJQ8VfNheE9WzWJ2") ids.push("dina");
    if (karyawanId === "jlKDa8Wz8MQwTczuulUMgGSozjH2") ids.push("wulan");
    if (karyawanId === "dina") ids.push("qcIeHksMTWZwUJQ8VfNheE9WzWJ2");
    if (karyawanId === "wulan") ids.push("jlKDa8Wz8MQwTczuulUMgGSozjH2");

    const snap = await getDocs(collection(db, "presensi"));
    const hasil = [];
    const tanggalSudah = new Set();
    snap.forEach((d) => {
      const data = d.data();
      if (ids.includes(data.karyawanId) && data.tanggal && data.tanggal.startsWith(bulan)) {
        if (!tanggalSudah.has(data.tanggal)) {
          tanggalSudah.add(data.tanggal);
          hasil.push({
            id: d.id,
            karyawanId: data.karyawanId,
            tanggal: data.tanggal,
            jamMasuk: keDate(data.jamMasuk),
            jamPulang: keDate(data.jamPulang),
          });
        }
      }
    });
    return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  } catch (err) {
    console.error("Gagal mengambil presensi:", err);
    throw err;
  }
}

export async function ambilPresensiTanggal(karyawanId, tanggal) {
  if (!karyawanId || !tanggal) return null;
  try {
    const ids = [karyawanId];
    if (karyawanId === "qcIeHksMTWZwUJQ8VfNheE9WzWJ2") ids.push("dina");
    if (karyawanId === "jlKDa8Wz8MQwTczuulUMgGSozjH2") ids.push("wulan");

    for (const id of ids) {
      const docRef = doc(db, "presensi", `${id}-${tanggal}`);
      const snap = await getDoc(docRef);
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
    }
    return null;
  } catch (err) {
    console.error("Gagal mengambil presensi tanggal:", err);
    return null;
  }
}

export async function catatMasuk(karyawanId) {
  if (!karyawanId) throw new Error("karyawanId wajib diisi");
  const tanggal = keTanggal(new Date());
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const jamMasuk = new Date();
  await setDoc(
    docRef,
    {
      karyawanId,
      tanggal,
      jamMasuk,
      jamPulang: null,
    },
    { merge: true }
  );

  // Jika karyawanId adalah UID auth dina, simpan juga untuk id "dina"
  if (karyawanId === "qcIeHksMTWZwUJQ8VfNheE9WzWJ2") {
    await setDoc(
      doc(db, "presensi", `dina-${tanggal}`),
      {
        karyawanId: "dina",
        tanggal,
        jamMasuk,
        jamPulang: null,
      },
      { merge: true }
    );
  }

  return { id: docRef.id, karyawanId, tanggal, jamMasuk, jamPulang: null };
}

export async function catatPulang(karyawanId) {
  if (!karyawanId) throw new Error("karyawanId wajib diisi");
  const tanggal = keTanggal(new Date());
  const docRef = doc(db, "presensi", `${karyawanId}-${tanggal}`);
  const jamPulang = new Date();
  await setDoc(
    docRef,
    {
      jamPulang,
    },
    { merge: true }
  );

  // Jika karyawanId adalah UID auth dina, simpan juga untuk id "dina"
  if (karyawanId === "qcIeHksMTWZwUJQ8VfNheE9WzWJ2") {
    await setDoc(
      doc(db, "presensi", `dina-${tanggal}`),
      {
        jamPulang,
      },
      { merge: true }
    );
  }

  return { id: docRef.id, jamPulang };
}

export async function ambilPengajuanCuti(karyawanId) {
  if (!karyawanId) return [];
  try {
    const ids = [karyawanId];
    if (karyawanId === "qcIeHksMTWZwUJQ8VfNheE9WzWJ2") ids.push("dina");
    if (karyawanId === "jlKDa8Wz8MQwTczuulUMgGSozjH2") ids.push("wulan");
    if (karyawanId === "dina") ids.push("qcIeHksMTWZwUJQ8VfNheE9WzWJ2");
    if (karyawanId === "wulan") ids.push("jlKDa8Wz8MQwTczuulUMgGSozjH2");

    const snap = await getDocs(collection(db, "pengajuan_cuti"));
    const hasil = [];
    const idSudah = new Set();
    snap.forEach((d) => {
      const data = d.data();
      if (ids.includes(data.karyawanId) && !idSudah.has(d.id)) {
        idSudah.add(d.id);
        hasil.push({
          id: d.id,
          karyawanId: data.karyawanId,
          tanggalMulai: keDate(data.tanggalMulai),
          tanggalSelesai: keDate(data.tanggalSelesai),
          alasan: data.alasan,
          status: data.status,
          catatanHrd: data.catatanHrd || "",
          diajukanPada: keDate(data.diajukanPada),
        });
      }
    });
    return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
  } catch (err) {
    console.error("Gagal mengambil pengajuan cuti:", err);
    throw err;
  }
}

export async function ajukanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan }) {
  if (!karyawanId || !tanggalMulai || !tanggalSelesai || !alasan) {
    throw new Error("Semua field cuti wajib diisi");
  }
  const id = `C${Math.floor(100 + Math.random() * 900)}`;
  const docRef = doc(db, "pengajuan_cuti", id);
  const data = {
    karyawanId,
    tanggalMulai: new Date(tanggalMulai),
    tanggalSelesai: new Date(tanggalSelesai),
    alasan,
    status: "menunggu",
    catatanHrd: "",
    diajukanPada: new Date(),
  };
  await setDoc(docRef, data);
  return { id, ...data };
}

export async function ambilSatuPengajuan(id) {
  if (!id) return null;
  try {
    const docRef = doc(db, "pengajuan_cuti", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();

    // Dapatkan nama karyawan
    let nama = "(tidak dikenal)";
    if (data.karyawanId) {
      const userSnap = await getDoc(doc(db, "users", data.karyawanId));
      if (userSnap.exists()) {
        nama = userSnap.data().nama;
      } else {
        const namaMap = await dapatkanMapPengguna();
        nama = namaMap[data.karyawanId] || "(tidak dikenal)";
      }
    }

    return {
      id: snap.id,
      karyawanId: data.karyawanId,
      nama,
      tanggalMulai: keDate(data.tanggalMulai),
      tanggalSelesai: keDate(data.tanggalSelesai),
      alasan: data.alasan,
      status: data.status,
      catatanHrd: data.catatanHrd || "",
      diajukanPada: keDate(data.diajukanPada),
    };
  } catch (err) {
    console.error("Gagal mengambil satu pengajuan:", err);
    return null;
  }
}

export async function ambilSemuaPengajuan(status) {
  try {
    const snap = await getDocs(collection(db, "pengajuan_cuti"));
    const namaMap = await dapatkanMapPengguna();
    const hasil = [];
    snap.forEach((d) => {
      const data = d.data();
      if (!status || status === "semua" || data.status === status) {
        hasil.push({
          id: d.id,
          karyawanId: data.karyawanId,
          nama: namaMap[data.karyawanId] ?? "(tidak dikenal)",
          tanggalMulai: keDate(data.tanggalMulai),
          tanggalSelesai: keDate(data.tanggalSelesai),
          alasan: data.alasan,
          status: data.status,
          catatanHrd: data.catatanHrd || "",
          diajukanPada: keDate(data.diajukanPada),
        });
      }
    });
    return hasil.sort((a, b) => b.diajukanPada - a.diajukanPada);
  } catch (err) {
    console.error("Gagal mengambil semua pengajuan cuti:", err);
    throw err;
  }
}

export async function putuskanCuti(id, status, catatanHrd = "") {
  if (!id || !status) throw new Error("ID dan status wajib ada");
  const docRef = doc(db, "pengajuan_cuti", id);
  await setDoc(
    docRef,
    {
      status,
      catatanHrd,
    },
    { merge: true }
  );
}

export async function ambilSemuaKaryawan() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const mapByEmail = new Map();
    snap.forEach((d) => {
      const data = d.data();
      const email = data.email || d.id;
      // Utamakan id yang ringkas (mis. 'dina') agar tabel lebih rapi
      if (!mapByEmail.has(email) || d.id.length < mapByEmail.get(email).id.length) {
        mapByEmail.set(email, {
          id: d.id,
          ...data,
        });
      }
    });
    return Array.from(mapByEmail.values()).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  } catch (err) {
    console.error("Gagal mengambil semua karyawan:", err);
    throw err;
  }
}

export async function ambilKaryawan(id) {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(db, "users", id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    // Coba cari jika id adalah email
    const all = await ambilSemuaKaryawan();
    return all.find((k) => k.id === id || k.email === id) || null;
  } catch (err) {
    console.error("Gagal mengambil karyawan:", err);
    return null;
  }
}

export async function ubahPeranKaryawan(id, role) {
  if (!id || !role) throw new Error("ID dan peran wajib ada");
  await setDoc(doc(db, "users", id), { role }, { merge: true });

  // Sinkronkan dokumen ber-email sama jika ada
  try {
    const userSnap = await getDoc(doc(db, "users", id));
    if (userSnap.exists() && userSnap.data().email) {
      const email = userSnap.data().email;
      const q = query(collection(db, "users"), where("email", "==", email));
      const qSnap = await getDocs(q);
      for (const d of qSnap.docs) {
        if (d.id !== id) {
          await setDoc(doc(db, "users", d.id), { role }, { merge: true });
        }
      }
    }
  } catch (e) {
    console.warn("Gagal sinkron peran dokumen sekunder:", e);
  }
}

export async function ubahNamaProfil(id, nama) {
  if (!id || !nama) throw new Error("ID dan nama wajib ada");
  await setDoc(doc(db, "users", id), { nama }, { merge: true });

  // Sinkronkan dokumen ber-email sama jika ada
  try {
    const userSnap = await getDoc(doc(db, "users", id));
    if (userSnap.exists() && userSnap.data().email) {
      const email = userSnap.data().email;
      const q = query(collection(db, "users"), where("email", "==", email));
      const qSnap = await getDocs(q);
      for (const d of qSnap.docs) {
        if (d.id !== id) {
          await setDoc(doc(db, "users", d.id), { nama }, { merge: true });
        }
      }
    }
  } catch (e) {
    console.warn("Gagal sinkron nama dokumen sekunder:", e);
  }
}

export async function ambilRingkasanDasbor(tanggal) {
  try {
    const [presensiSnap, cutiSnap, usersList] = await Promise.all([
      getDocs(collection(db, "presensi")),
      getDocs(collection(db, "pengajuan_cuti")),
      ambilSemuaKaryawan(),
    ]);

    const hadirHariIni = [];
    const karyawanHadir = new Set();
    presensiSnap.forEach((d) => {
      const data = d.data();
      if (data.tanggal === tanggal) {
        const kId = data.karyawanId;
        if (!karyawanHadir.has(kId)) {
          karyawanHadir.add(kId);
          hadirHariIni.push({
            ...data,
            jamMasuk: keDate(data.jamMasuk),
          });
        }
      }
    });

    let cutiMenunggu = 0;
    cutiSnap.forEach((d) => {
      if (d.data().status === "menunggu") cutiMenunggu++;
    });

    return {
      hadir: hadirHariIni.length,
      terlambat: hadirHariIni.filter((p) => terlambat(p.jamMasuk)).length,
      cutiMenunggu,
      jumlahKaryawan: usersList.length,
    };
  } catch (err) {
    console.error("Gagal mengambil ringkasan dasbor:", err);
    return { hadir: 0, terlambat: 0, cutiMenunggu: 0, jumlahKaryawan: 0 };
  }
}

export async function ambilRekapBulanan(bulan) {
  try {
    const [usersList, presensiSnap, cutiSnap] = await Promise.all([
      ambilSemuaKaryawan(),
      getDocs(collection(db, "presensi")),
      getDocs(collection(db, "pengajuan_cuti")),
    ]);

    const presensiList = [];
    presensiSnap.forEach((d) => {
      const data = d.data();
      presensiList.push({
        ...data,
        jamMasuk: keDate(data.jamMasuk),
      });
    });

    const cutiList = [];
    cutiSnap.forEach((d) => {
      const data = d.data();
      cutiList.push({
        ...data,
        tanggalMulai: keDate(data.tanggalMulai),
        tanggalSelesai: keDate(data.tanggalSelesai),
      });
    });

    return usersList.map((u) => {
      const ids = [u.id];
      if (u.id === "dina") ids.push("qcIeHksMTWZwUJQ8VfNheE9WzWJ2");
      if (u.id === "wulan") ids.push("jlKDa8Wz8MQwTczuulUMgGSozjH2");

      const tanggalHadir = new Set();
      const hadir = [];
      for (const p of presensiList) {
        if (ids.includes(p.karyawanId) && p.tanggal && p.tanggal.startsWith(bulan)) {
          if (!tanggalHadir.has(p.tanggal)) {
            tanggalHadir.add(p.tanggal);
            hadir.push(p);
          }
        }
      }

      let cutiDisetujui = 0;
      for (const c of cutiList) {
        if (!ids.includes(c.karyawanId) || c.status !== "disetujui") continue;
        if (!c.tanggalMulai || !c.tanggalSelesai) continue;
        for (
          let d = new Date(c.tanggalMulai);
          d <= c.tanggalSelesai;
          d.setDate(d.getDate() + 1)
        ) {
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
  } catch (err) {
    console.error("Gagal mengambil rekap bulanan:", err);
    throw err;
  }
}
