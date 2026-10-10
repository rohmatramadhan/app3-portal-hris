// "use client"

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Memuat from "@/components/Memuat";
import AksesDitolak from "@/components/AksesDitolak";

/**
 * Guard component for admin pages. Ensures the user is signed in and has the "hrd" role.
 * - If not signed in, redirects to /masuk with a `kembali` query.
 * - While the role is being fetched, shows a loading screen.
 * - If the role is not "hrd", displays the AksesDitolak component.
 */
export default function AdminGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        const encodedPath = encodeURIComponent(pathname);
        router.replace(`/masuk?kembali=${encodedPath}`);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const userRole = snap.exists() ? snap.data().role : "";
        setRole(userRole);
        setChecking(false);
      } catch (e) {
        console.error("AdminGuard role fetch error", e);
        const encodedPath = encodeURIComponent(pathname);
        router.replace(`/masuk?kembali=${encodedPath}`);
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);

  if (checking) {
    return <Memuat />;
  }

  if (role !== "hrd") {
    return <AksesDitolak />;
  }

  return <>{children}</>;
}
