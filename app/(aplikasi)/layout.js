import { Suspense } from "react";
import BilahAtas from "@/components/BilahAtas";
import MenuSamping from "@/components/MenuSamping";
import Memuat from "@/components/Memuat";
import PenjagaRute from "@/components/PenjagaRute";

export const instant = false;

/**
 * Tata letak semua halaman setelah masuk.
 * Layout utama berupa Server Component yang me-render isi halaman dengan PenjagaRute.
 */
export default function LayoutAplikasi({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <BilahAtas />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="bg-tinta md:w-64 md:shrink-0">
          <Suspense fallback={<div className="p-4 text-white/50">Memuat menu...</div>}>
            <MenuSamping />
          </Suspense>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <Suspense fallback={<Memuat />}>
              <PenjagaRute>{children}</PenjagaRute>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
