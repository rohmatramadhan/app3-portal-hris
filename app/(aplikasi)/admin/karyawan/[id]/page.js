// Server component: ekspor generateStaticParams untuk static export
import RincianKaryawan from "./RincianKaryawan";

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <RincianKaryawan />;
}