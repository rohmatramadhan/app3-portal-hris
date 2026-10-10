
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let aktif = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!aktif) return;

      setChecking(true);

      if (!user) {
        const kembali = encodeURIComponent(pathname || "/beranda");
        router.replace(`/masuk?kembali=${kembali}`);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!aktif) return;

        const role = snap.exists() ? snap.data().role : "";

        if (role !== "karyawan" && role !== "hrd") {
          router.replace("/masuk");
          return;
        }

        if (pathname.startsWith("/admin") && role !== "hrd") {
          router.replace("/beranda");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error("AuthGuard role check error:", error);

        if (aktif) {
          router.replace("/masuk");
        }
      }
    });

    return () => {
      aktif = false;
      unsubscribe();
    };
  }, [router, pathname]);

  if (checking) return null;

  return <>{children}</>;
}
