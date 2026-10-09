import PenjagaAdmin from "@/components/PenjagaAdmin";

/**
 * Layout modul HRD (/admin).
 * Menggunakan PenjagaAdmin untuk memvalidasi hak akses HRD.
 */
export default function LayoutAdmin({ children }) {
  return <PenjagaAdmin>{children}</PenjagaAdmin>;
}
