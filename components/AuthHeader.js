"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AuthHeader() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.role || "");
          }
        } catch (e) {
          console.error("Failed to fetch user data", e);
        }
      } else {
        setRole("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/masuk");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <header className="flex items-center justify-between bg-gray-100 px-4 py-2 shadow-md">
      <div className="text-sm text-gray-700">
        {user ? (
          <span>{user.displayName || user.email} ({role})</span>
        ) : (
          <span>Pengguna belum masuk</span>
        )}
      </div>
      {user && (
        <button onClick={handleLogout} className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">Keluar</button>
      )}
    </header>
  );
}
