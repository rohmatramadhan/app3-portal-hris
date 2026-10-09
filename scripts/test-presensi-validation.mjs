import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { terlambat, keTanggal, formatBulan } = await import("../lib/waktu.js");

function testPresensiValidation() {
  console.log("=== Menguji Logika Validasi & Perhitungan Presensi ===");

  // 1. Tepat Waktu (<= 08:00:00)
  const jam0755 = new Date("2026-10-09T07:55:00");
  const tepat0755 = !terlambat(jam0755);
  console.log(`[1] 07:55 WIB: ${tepat0755 ? "TEPAT WAKTU (LULUS)" : "GAGAL"}`);
  if (!tepat0755) throw new Error("07:55 seharusnya tepat waktu");

  const jam0800 = new Date("2026-10-09T08:00:00");
  const tepat0800 = !terlambat(jam0800);
  console.log(`[2] 08:00 WIB: ${tepat0800 ? "TEPAT WAKTU (LULUS)" : "GAGAL"}`);
  if (!tepat0800) throw new Error("08:00 seharusnya tepat waktu");

  // 2. Terlambat (> 08:00:00)
  const jam0801 = new Date("2026-10-09T08:01:00");
  const telat0801 = terlambat(jam0801);
  console.log(`[3] 08:01 WIB: ${telat0801 ? "TERLAMBAT (LULUS)" : "GAGAL"}`);
  if (!telat0801) throw new Error("08:01 seharusnya terlambat");

  const jam0830 = new Date("2026-10-09T08:30:00");
  const telat0830 = terlambat(jam0830);
  console.log(`[4] 08:30 WIB: ${telat0830 ? "TERLAMBAT (LULUS)" : "GAGAL"}`);
  if (!telat0830) throw new Error("08:30 seharusnya terlambat");

  console.log("\nSemua pengujian logika presensi LULUS dengan sukses!");
}

testPresensiValidation();
