import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { keTanggal, terlambat } from "@/lib/waktu";

// ==================================================
// UTILITAS
// ==================================================

function tanggalISO(nilai) {
  if (!nilai) return "";

  if (typeof nilai === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return nilai;

    const hasil = new Date(nilai);
    return Number.isNaN(hasil.getTime())
      ? ""
      : hasil.toISOString().slice(0, 10);
  }

  if (typeof nilai?.toDate === "function") {
    return nilai.toDate().toISOString().slice(0, 10);
  }

  if (nilai instanceof Date) {
    return Number.isNaN(nilai.getTime())
      ? ""
      : nilai.toISOString().slice(0, 10);
  }

  return "";
}

function terbaruDulu(a, b) {
  function waktu(nilai) {
    if (typeof nilai?.toMillis === "function") {
      return nilai.toMillis();
    }

    if (!nilai) return 0;

    const hasil = new Date(nilai).getTime();
    return Number.isNaN(hasil) ? 0 : hasil;
  }

  return waktu(b.diajukanPada) - waktu(a.diajukanPada);
}

function ubahDokumen(dokumen) {
  return {
    id: dokumen.id,
    ...dokumen.data(),
  };
}

function tanggalHariIniISO() {
  const sekarang = new Date();

  return [
    sekarang.getFullYear(),
    String(sekarang.getMonth() + 1).padStart(2, "0"),
    String(sekarang.getDate()).padStart(2, "0"),
  ].join("-");
}

async function namaKaryawan(id) {
  if (!id) return "(tidak dikenal)";

  const hasil = await getDoc(doc(db, "users", id));

  if (!hasil.exists()) return "(tidak dikenal)";

  const data = hasil.data();
  return data.nama || data.email || "(tanpa nama)";
}

// ==================================================
// PENGAJUAN CUTI
// ==================================================

export async function simpanPengajuanCuti(karyawanId, dataCuti) {
  if (!karyawanId) {
    throw new Error("Pengguna belum login. Silakan masuk kembali.");
  }

  if (
    !dataCuti?.tanggalMulai ||
    !dataCuti?.tanggalSelesai ||
    !dataCuti?.alasan?.trim()
  ) {
    throw new Error(
      "Tanggal mulai, tanggal selesai, dan alasan wajib diisi."
    );
  }

  if (dataCuti.tanggalSelesai < dataCuti.tanggalMulai) {
    throw new Error(
      "Tanggal selesai tidak boleh sebelum tanggal mulai."
    );
  }

  const hasil = await addDoc(collection(db, "pengajuan_cuti"), {
    karyawanId,
    tanggalMulai: dataCuti.tanggalMulai,
    tanggalSelesai: dataCuti.tanggalSelesai,
    alasan: dataCuti.alasan.trim(),
    status: "menunggu",
    diajukanPada: serverTimestamp(),
  });

  return hasil.id;
}

export async function ambilPengajuanCutiFirebase(karyawanId) {
  if (!karyawanId) return [];

  const hasil = await getDocs(
    query(
      collection(db, "pengajuan_cuti"),
      where("karyawanId", "==", karyawanId)
    )
  );

  return hasil.docs.map(ubahDokumen).sort(terbaruDulu);
}

export async function ambilSemuaPengajuanFirebase(status = "semua") {
  const hasil = await getDocs(collection(db, "pengajuan_cuti"));

  return hasil.docs
    .map(ubahDokumen)
    .filter(
      (cuti) =>
        !status || status === "semua" || cuti.status === status
    )
    .sort(terbaruDulu);
}

export async function ambilSemuaPengajuan(status = "semua") {
  const cuti = await ambilSemuaPengajuanFirebase(status);

  return Promise.all(
    cuti.map(async (item) => ({
      ...item,
      nama: await namaKaryawan(item.karyawanId),
    }))
  );
}

export async function ambilPengajuanCuti(karyawanId) {
  return ambilPengajuanCutiFirebase(karyawanId);
}

export async function ambilSatuPengajuan(id) {
  if (!id) return null;

  const hasil = await getDoc(doc(db, "pengajuan_cuti", id));

  if (!hasil.exists()) return null;

  const data = hasil.data();

  return {
    id: hasil.id,
    ...data,
    nama: await namaKaryawan(data.karyawanId),
  };
}

// ==================================================
// KEPUTUSAN PENGAJUAN CUTI OLEH HRD
// ==================================================

export async function putuskanPengajuanCuti(
  cutiId,
  statusBaru,
  catatanHrd = ""
) {
  if (!cutiId) {
    throw new Error("ID pengajuan cuti tidak ditemukan.");
  }

  if (!["disetujui", "ditolak"].includes(statusBaru)) {
    throw new Error("Status keputusan tidak valid.");
  }

  const referensi = doc(db, "pengajuan_cuti", cutiId);
  const snapshot = await getDoc(referensi);

  if (!snapshot.exists()) {
    throw new Error("Pengajuan cuti tidak ditemukan.");
  }

  if (snapshot.data().status !== "menunggu") {
    throw new Error("Pengajuan cuti ini sudah diputuskan.");
  }

  const catatanBersih =
    typeof catatanHrd === "string" ? catatanHrd.trim() : "";

  await updateDoc(referensi, {
    status: statusBaru,
    catatanHrd: catatanBersih,
    diperbaruiPada: serverTimestamp(),
  });

  return {
    id: cutiId,
    status: statusBaru,
    catatanHrd: catatanBersih,
  };
}

// ==================================================
// PRESENSI
// ==================================================

export async function ambilPresensi(karyawanId, bulan) {
  if (!karyawanId || !bulan) return [];

  const hasil = await getDocs(
    query(
      collection(db, "presensi"),
      where("karyawanId", "==", karyawanId)
    )
  );

  return hasil.docs
    .map(ubahDokumen)
    .filter((item) => tanggalISO(item.tanggal).startsWith(bulan))
    .sort((a, b) =>
      tanggalISO(b.tanggal).localeCompare(tanggalISO(a.tanggal))
    );
}

export async function ambilPresensiTanggal(karyawanId, tanggal) {
  if (!karyawanId || !tanggal) return null;

  const hasil = await getDocs(
    query(
      collection(db, "presensi"),
      where("karyawanId", "==", karyawanId)
    )
  );

  const ditemukan = hasil.docs.find(
    (dokumen) => tanggalISO(dokumen.data().tanggal) === tanggal
  );

  return ditemukan ? ubahDokumen(ditemukan) : null;
}

export async function catatMasuk(karyawanId) {
  if (!karyawanId) {
    throw new Error("ID karyawan tidak ditemukan. Silakan masuk kembali.");
  }

  const tanggal = tanggalHariIniISO();
  const sekarang = new Date();

  const presensiLama = await ambilPresensiTanggal(
    karyawanId,
    tanggal
  );

  if (presensiLama) {
    throw new Error("Presensi masuk hari ini sudah tercatat.");
  }

  const dataBaru = {
    karyawanId,
    tanggal,
    jamMasuk: sekarang.toISOString(),
    jamPulang: null,
    status: "hadir",
    dibuatPada: serverTimestamp(),
  };

  const hasil = await addDoc(
    collection(db, "presensi"),
    dataBaru
  );

  return {
    id: hasil.id,
    ...dataBaru,
  };
}

export async function catatPulang(karyawanId) {
  if (!karyawanId) {
    throw new Error("ID karyawan tidak ditemukan. Silakan masuk kembali.");
  }

  const tanggal = tanggalHariIniISO();

  const hasil = await getDocs(
    query(
      collection(db, "presensi"),
      where("karyawanId", "==", karyawanId)
    )
  );

  const ditemukan = hasil.docs.find(
    (dokumen) => tanggalISO(dokumen.data().tanggal) === tanggal
  );

  if (!ditemukan) {
    throw new Error("Kamu belum mencatat presensi masuk hari ini.");
  }

  const data = ditemukan.data();

  if (data.jamPulang) {
    throw new Error("Presensi pulang sudah tercatat.");
  }

  const jamPulang = new Date().toISOString();

  await updateDoc(doc(db, "presensi", ditemukan.id), {
    jamPulang,
    diperbaruiPada: serverTimestamp(),
  });

  return {
    id: ditemukan.id,
    ...data,
    jamPulang,
  };
}

// ==================================================
// DATA KARYAWAN
// ==================================================

export async function ambilSemuaKaryawan() {
  const hasil = await getDocs(collection(db, "users"));

  return hasil.docs
    .map(ubahDokumen)
    .sort((a, b) =>
      (a.nama || a.email || "").localeCompare(
        b.nama || b.email || ""
      )
    );
}

export async function ambilKaryawan(id) {
  if (!id) return null;

  const hasil = await getDoc(doc(db, "users", id));

  if (!hasil.exists()) return null;

  return ubahDokumen(hasil);
}

// ==================================================
// RINGKASAN DASBOR HRD
// ==================================================

export async function ambilRingkasanDasbor(tanggal) {
  const tanggalTarget = tanggal || tanggalHariIniISO();

  const [hasilPresensi, hasilCuti, hasilKaryawan] =
    await Promise.all([
      getDocs(collection(db, "presensi")),
      getDocs(
        query(
          collection(db, "pengajuan_cuti"),
          where("status", "==", "menunggu")
        )
      ),
      getDocs(collection(db, "users")),
    ]);

  const presensiHariIni = hasilPresensi.docs
    .map(ubahDokumen)
    .filter((item) => tanggalISO(item.tanggal) === tanggalTarget);

  return {
    hadir: presensiHariIni.length,
    terlambat: presensiHariIni.filter((item) =>
      terlambat(item.jamMasuk)
    ).length,
    cutiMenunggu: hasilCuti.size,
    jumlahKaryawan: hasilKaryawan.docs.filter(
      (dokumen) => dokumen.data().role === "karyawan"
    ).length,
  };
}

export async function ambilRingkasanDasborFirebase(tanggal) {
  return ambilRingkasanDasbor(tanggal);
}

// ==================================================
// LAPORAN BULANAN
// ==================================================

export async function ambilRekapBulanan(bulan) {
  if (!bulan) return [];

  const [hasilKaryawan, hasilPresensi, hasilCuti] =
    await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "presensi")),
      getDocs(
        query(
          collection(db, "pengajuan_cuti"),
          where("status", "==", "disetujui")
        )
      ),
    ]);

  const karyawan = hasilKaryawan.docs
    .map(ubahDokumen)
    .filter((item) => item.role === "karyawan");

  const semuaPresensi = hasilPresensi.docs.map(ubahDokumen);
  const semuaCuti = hasilCuti.docs.map(ubahDokumen);

  return karyawan
    .sort((a, b) =>
      (a.nama || a.email || "").localeCompare(
        b.nama || b.email || ""
      )
    )
    .map((karyawanItem) => {
      const hadir = semuaPresensi.filter(
        (item) =>
          item.karyawanId === karyawanItem.id &&
          tanggalISO(item.tanggal).startsWith(bulan)
      );

      let cutiDisetujui = 0;

      for (const cuti of semuaCuti) {
        if (cuti.karyawanId !== karyawanItem.id) continue;

        const mulai = new Date(
          `${cuti.tanggalMulai}T00:00:00`
        );
        const selesai = new Date(
          `${cuti.tanggalSelesai}T00:00:00`
        );

        if (
          Number.isNaN(mulai.getTime()) ||
          Number.isNaN(selesai.getTime())
        ) {
          continue;
        }

        for (
          let tanggal = new Date(mulai);
          tanggal <= selesai;
          tanggal.setDate(tanggal.getDate() + 1)
        ) {
          if (keTanggal(tanggal).startsWith(bulan)) {
            cutiDisetujui++;
          }
        }
      }

      return {
        karyawanId: karyawanItem.id,
        nama:
          karyawanItem.nama ||
          karyawanItem.email ||
          "(tanpa nama)",
        hariHadir: hadir.length,
        terlambat: hadir.filter((item) =>
          terlambat(item.jamMasuk)
        ).length,
        cutiDisetujui,
      };
    });
}

export async function putusanPengajuanCuti(id, status, catatan = "") {
  if (!id) {
    throw new Error("ID pengajuan cuti tidak ditemukan.");
  }

  const statusValid = ["disetujui", "ditolak"];

  if (!statusValid.includes(status)) {
    throw new Error("Status persetujuan tidak valid.");
  }

  const pengajuanRef = doc(db, "pengajuan_cuti", id);

  await updateDoc(pengajuanRef, {
    status,
    catatanPersetujuan: catatan,
    diperbaruiPada: new Date().toISOString(),
  });
}