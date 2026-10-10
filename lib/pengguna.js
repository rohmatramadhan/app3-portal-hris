/**
 * SEMENTARA. Di Sesi 6 hook ini diganti dengan data dari Firebase Auth dan dokumen users/{uid}.
 * Role dibuat "hrd" supaya semua menu tampil saat starter diperiksa.
 * uid sengaja sama dengan Dina di lib/dataContoh.js supaya halaman karyawan berisi data.
 *
 * TEMPORARY. In Session 6 this hook is replaced with data from Firebase Auth and the users/{uid} document.
 * Role is "hrd" so every menu shows while the starter is being reviewed.
 * uid deliberately matches Dina in lib/dataContoh.js so the employee pages have data.
 */
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function usePengguna() {
  const [pengguna, setPengguna] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const data = userDoc.exists() ? userDoc.data() : {};
          setPengguna({
            uid: user.uid,
            nama: data.nama || user.displayName || user.email,
            email: user.email,
            role: data.role || "",
          });
        } catch (e) {
          console.error("Failed to fetch user data", e);
          setPengguna({
            uid: user.uid,
            nama: user.displayName || user.email,
            email: user.email,
            role: "",
          });
        }
      } else {
        setPengguna(null);
      }
      setMemuat(false);
    });
    return () => unsubscribe();
  }, []);

  return { pengguna, memuat };
}
