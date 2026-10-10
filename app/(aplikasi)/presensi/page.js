
import { Suspense } from "react";
import PresensiClient from "./PresensiClient";
import Memuat from "@/components/Memuat";

export default function HalamanPresensi() {
  return (
    <Suspense fallback={<Memuat />}>
      <PresensiClient />
    </Suspense>
  );
}
