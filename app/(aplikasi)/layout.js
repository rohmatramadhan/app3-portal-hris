
import { Suspense } from "react";
import MenuSamping from "@/components/MenuSamping";
import HeaderAplikasi from "@/components/HeaderAplikasi";

export default function LayoutAplikasi({ children }) {
  return (
    <div className="min-h-screen bg-krem">
      {/* Navbar horizontal paling atas */}
      <div className="bg-sedap px-4 py-3 text-white md:px-7">
        <HeaderAplikasi />
      </div>

      {/* Sidebar dan konten di bawah navbar */}
      <div className="min-h-[calc(100vh-70px)] md:flex">
        <aside className="bg-tinta text-white md:min-h-[calc(100vh-70px)] md:w-64 md:shrink-0">
          <Suspense
            fallback={
              <nav className="p-4 text-sm text-white/70">
                Memuat menu...
              </nav>
            }
          >
            <MenuSamping />
          </Suspense>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
