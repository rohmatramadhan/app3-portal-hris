import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Ensure a user document exists in the "users" collection.
 * If the document does not exist, it will be created with minimal profile fields.
 *
 * @param {string} uid - Firebase Authentication UID of the user.
 * @param {string} email - Email address of the user (may be undefined for some providers).
 * @param {string} [nama] - Optional display name of the user.
 * @returns {Promise<boolean>} Resolves to true when the operation completes.
 */
export async function ensureUserDoc(uid, email, nama) {
  if (!uid) {
    throw new Error("ID pengguna tidak ditemukan.");
  }

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: uid,
      email: email || "",
      nama: nama || (email ? email.split("@")[0] : "Pengguna"),
      role: "karyawan",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return true;
}

