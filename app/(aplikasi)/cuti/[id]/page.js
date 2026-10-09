// Server component: ekspor generateStaticParams untuk static export
// Client component RincianCuti mengambil data lewat useParams + Firestore
import RincianCuti from "./RincianCuti";

export async function generateStaticParams() {
  // Placeholder agar Next.js menghasilkan HTML; data asli diambil sisi klien
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <RincianCuti />;
}