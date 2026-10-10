
import { Suspense } from "react";
import HalamanRincianCuti from "./CutiDetailClient";

export default function HalamanRincianCutiPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-gray-500">
          Memuat rincian cuti...
        </div>
      }
    >
      <HalamanRincianCuti />
    </Suspense>
  );
}
