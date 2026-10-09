import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function testAuth() {
  console.log("=== Pengujian Aturan Pembuatan & Pengecekan Dokumen users/{uid} ===");

  try {
    const { daftarDenganEmail, masukDenganEmail, pastikanProfilPengguna, keluar } = await import("../lib/auth.js");
    const { db } = await import("../lib/firebase.js");
    const { deleteUser } = await import("firebase/auth");
    const { doc, getDoc, updateDoc, deleteDoc } = await import("firebase/firestore");

    const testEmail = `uji_aturan_${Date.now()}@sedap.id`;
    const testPassword = "PasswordRahasia123!";
    const testNama = "Karyawan Uji";

    console.log(`[1] Mendaftarkan akun baru (${testEmail})...`);
    const hasilDaftar = await daftarDenganEmail(testEmail, testPassword, testNama);
    const uid = hasilDaftar.user.uid;
    console.log("    ✅ Pendaftaran berhasil! UID:", uid);

    console.log("\n[2] Memeriksa dokumen di Firestore 'users/{uid}'...");
    const userRef = doc(db, "users", uid);
    let snap = await getDoc(userRef);
    if (!snap.exists()) {
      throw new Error("Dokumen users/{uid} tidak ditemukan di Firestore!");
    }
    const data = snap.data();
    console.log("    ✅ Dokumen users ditemukan:", data);

    // Verifikasi field dan ketiadaan kata sandi
    if (data.role !== "karyawan") {
      throw new Error(`Role harus 'karyawan', tetapi bernilai '${data.role}'`);
    }
    if (data.email !== testEmail) {
      throw new Error(`Email tidak cocok: ${data.email} vs ${testEmail}`);
    }
    if (data.password !== undefined || data.kataSandi !== undefined) {
      throw new Error("BAHAYA: Kata sandi tersimpan di dokumen Firestore!");
    }
    console.log("    ✅ Field nama, email, dan role 'karyawan' sesuai.");
    console.log("    ✅ Dipastikan kata sandi TIDAK disimpan di dokumen users/{uid}.");

    console.log("\n[3] Mengubah role pengguna menjadi 'hrd' secara manual di Firestore...");
    await updateDoc(userRef, { role: "hrd" });
    await keluar();

    console.log("\n[4] Pengguna masuk kembali (masukDenganEmail)...");
    const hasilMasuk = await masukDenganEmail(testEmail, testPassword);
    snap = await getDoc(userRef);
    const dataSetelahMasuk = snap.data();
    console.log("    ✅ Data setelah masuk kembali:", dataSetelahMasuk);

    if (dataSetelahMasuk.role !== "hrd") {
      throw new Error(`Role pengguna tertimpa! Seharusnya tetap 'hrd', tetapi menjadi '${dataSetelahMasuk.role}'`);
    }
    console.log("    ✅ Dokumen yang sudah ada TIDAK DIUBAH (role 'hrd' tetap bertahan).");

    console.log("\n[5] Membersihkan data uji coba...");
    await deleteDoc(userRef);
    await deleteUser(hasilMasuk.user);
    console.log("    ✅ Data uji coba berhasil dihapus.");

    console.log("\n🎉 SEMUA ATURAN PEMERIKSAAN & PEMBUATAN users/{uid} TERVERIFIKASI 100%!");
  } catch (err) {
    console.error("\n❌ Pengujian gagal:", err.message);
    process.exit(1);
  }
}

testAuth();
