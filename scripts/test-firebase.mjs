import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());



async function verifyFirebase() {
  console.log("=== Pemeriksaan Konfigurasi Firebase ===");
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  let missing = [];
  for (const v of requiredEnvVars) {
    if (!process.env[v] || process.env[v].trim() === "") {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Variabel environment wajib berikut belum diisi di .env.local:");
    missing.forEach((m) => console.error(`   - ${m}`));
    console.log("\nSilakan lengkapi file .env.local terlebih dahulu.");
    process.exit(1);
  }

  console.log("✅ Semua variabel konfigurasi ditemukan di .env.local.");
  console.log(`   Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`   Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);

  console.log("\n=== Menguji Inisialisasi Firebase SDK ===");
  let app, auth, db, getDoc, doc, fs;
  try {
    const fb = await import("../lib/firebase.js");
    fs = await import("firebase/firestore");
    app = fb.app;
    auth = fb.auth;
    db = fb.db;
    getDoc = fs.getDoc;
    doc = fs.doc;

    console.log(`✅ Firebase App terinisialisasi: [${app.name}]`);
    console.log(`✅ Firebase Auth siap: provider ID = ${auth.app.name}`);
    console.log(`✅ Firestore Database siap: ${db.type}`);
  } catch (err) {
    console.error("❌ Gagal menginisialisasi Firebase SDK:", err.message);
    process.exit(1);
  }

  console.log("\n=== Menguji Konektivitas Cloud Firestore ===");
  try {
    // Mencoba membaca dokumen uji coba untuk memastikan server Firebase dapat dihubungi
    const testDocRef = doc(db, "_connection_test", "ping");
    await getDoc(testDocRef);
    console.log("✅ Koneksi ke Cloud Firestore berhasil (server merespons).");
    console.log("\n🎉 Konfigurasi Firebase dan Firestore terverifikasi aktif!");
    if (fs.terminate) await fs.terminate(db);
    process.exit(0);
  } catch (err) {
    if (fs.terminate) await fs.terminate(db).catch(() => {});
    const msg = (err.message || "") + " " + (err.code || "");
    if (err.code === "permission-denied" && !msg.includes("Cloud Firestore API has not been used")) {
      console.log("✅ Terhubung ke Firestore! (Server merespons dengan aturan keamanan: permission-denied)");
      console.log("\n🎉 Konfigurasi Firebase dan koneksi Firestore terverifikasi!");
      process.exit(0);
    } else {
      console.error("\n❌ Cloud Firestore belum dibuat atau API belum diaktifkan di Firebase Console!");
      console.error("   Detail error:", err.code || err.message);
      console.log("\n👉 Langkah yang perlu dilakukan di Firebase Console:");
      console.log("   1. Buka https://console.firebase.google.com");
      console.log(`   2. Pilih project '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}'`);
      console.log("   3. Buka menu Build -> Firestore Database -> Klik 'Create database'");
      console.log("   4. Pilih lokasi database (misal: asia-southeast2 / Jakarta)");
      console.log("   5. Pilih 'Start in test mode' lalu klik 'Create'");
      process.exit(1);
    }
  }
}

verifyFirebase().catch((err) => {
  console.error("Terjadi galat:", err);
  process.exit(1);
});
