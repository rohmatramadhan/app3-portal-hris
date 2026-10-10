import { Inter } from "next/font/google";
import "./globals.css";

import RoleRedirect from "@/components/RoleRedirect";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Portal HRIS Sedap",
  description: "Presensi dan cuti karyawan Sedap",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">

        <RoleRedirect />
        {children}
      </body>
    </html>
  );
}
