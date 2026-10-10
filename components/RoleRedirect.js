"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function RoleRedirect() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const role = snap.exists() ? snap.data().role : "";
          if (role === "karyawan") {
            router.replace("/beranda");
          } else if (role === "hrd") {
            router.replace("/admin");
          }
        } catch (e) {
          console.error("Role fetch error", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return null;
}
