import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function setHrd(uid) {
  if (!uid) {
    console.error("Masukkan UID: node scripts/set-role-hrd.mjs <uid>");
    process.exit(1);
  }

  const { db } = await import("../lib/firebase.js");
  const { doc, getDoc, setDoc, updateDoc } = await import("firebase/firestore");

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    console.log("Dokumen lama:", snap.data());
    // Hanya ubah role, jangan ubah field lain
    await updateDoc(userRef, { role: "hrd" });
  } else {
    // Jika dokumen belum ada, buat dokumen dengan role hrd
    await setDoc(userRef, {
      nama: "Wulan",
      email: "wulan@sedap.id",
      role: "hrd",
    });
  }

  const updatedSnap = await getDoc(userRef);
  console.log("✅ Berhasil! Isi dokumen users/" + uid + ":");
  console.log(JSON.stringify(updatedSnap.data(), null, 2));
  process.exit(0);
}

const targetUid = process.argv[2];
setHrd(targetUid).catch(err => {
  console.error("Galat:", err);
  process.exit(1);
});
