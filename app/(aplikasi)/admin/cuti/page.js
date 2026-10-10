
import { Suspense } from "react";
import HalamanPersetujuanCuti from "./CutiClient";

export default function HalamanPersetujuanCutiPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-gray-500">
          Memuat halaman persetujuan cuti...
        </div>
      }
    >
      <HalamanPersetujuanCuti />
    </Suspense>
  );
}
