/**
 * Script untuk menaikkan peran pengguna menjadi HRD di Firestore (Prompt 6).
 * Contoh pemakaian: node scripts/jadikan-hrd.mjs wulan@sedap.id
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const envPath = resolve(process.cwd(), ".env.local");
const envVars = {};
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      envVars[k.trim()] = v.join("=").trim();
    }
  }
}

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const emailTarget = process.argv[2] || "wulan@sedap.id";

if (!firebaseConfig.projectId) {
  console.error("❌ Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID belum diisi di .env.local!");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log(`🔍 Mencari pengguna dengan email: ${emailTarget}...`);

  // Cari di koleksi users berdasarkan email
  const q = query(collection(db, "users"), where("email", "==", emailTarget));
  const snap = await getDocs(q);

  if (snap.empty) {
    console.error(`❌ Dokumen pengguna dengan email ${emailTarget} belum ditemukan di koleksi users.`);
    console.log("Pastikan akun sudah mendaftar terlebih dahulu di halaman /daftar.");
    process.exit(1);
  }

  const userDoc = snap.docs[0];
  const uid = userDoc.id;
  console.log(`✓ Ditemukan uid: ${uid}`);

  // Ubah role menjadi "hrd"
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { role: "hrd" });

  const updatedSnap = await getDoc(userRef);
  console.log("✅ Berhasil memperbarui peran pengguna menjadi HRD!");
  console.log("Isi dokumen users/{" + uid + "}:", JSON.stringify(updatedSnap.data(), null, 2));
}

main().catch((err) => {
  console.error("❌ Gagal:", err);
  process.exit(1);
});
