# Implementation Plan: Audit & Perbaikan Menyeluruh Portal HRIS Sedap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menuntaskan audit menyeluruh dan perbaikan pada Portal HRIS Sedap berdasarkan PRD (PRD_App_3.md), mencakup penegakan Cloud Firestore Security Rules, penyelarasan alur bisnis dan otorisasi, penambahan automated test suite, serta verifikasi build dan kesiapan deployment Netlify.

**Architecture:** Menerapkan dua lapis pertahanan (two-tier defense) sesuai PRD 6.2: Route Guard di tingkat Next.js (App Router) untuk antarmuka pengguna, dan Cloud Firestore Security Rules yang ketat di tingkat basis data untuk menegakkan kepemilikan data dan pembatasan peran (RBAC). Seluruh mutasi dan query divalidasi pada batas kepercayaan (trust boundary) tanpa mengorbankan integritas data yang sudah ada.

**Tech Stack:** Next.js 16 (Turbopack, App Router, React 19), Firebase Web SDK v13 (Authentication & Cloud Firestore), Tailwind CSS v4, Node.js test scripts.

**Spec:** `docs/PRD_App_3.md` & `AGENTS.md`

## Global Constraints
- Nama koleksi: `users`, `presensi`, `pengajuan_cuti` (sesuai AGENTS.md dan database aktif).
- Nama field: `nama`, `email`, `role`, `karyawanId`, `tanggal`, `jamMasuk`, `jamPulang`, `tanggalMulai`, `tanggalSelesai`, `alasan`, `status`, `catatanHrd`, `diajukanPada` (PRD 7.1).
- Nilai `role` hanya `"karyawan"` atau `"hrd"`. Nilai `status` cuti hanya `"menunggu"`, `"disetujui"`, `"ditolak"`.
- Kata sandi tidak pernah disimpan di Firestore.
- Jangan mengubah proyek Firebase selain `app3-hris-sedap-ocha`.
- Jangan menampilkan secret/API key lengkap dalam laporan.
- Pertahankan struktur dan tampilan visual UI yang sudah ada.

## Review Focus
1. **Security Rules Bypass:** Karyawan mencoba mengubah perannya menjadi `hrd` atau menyetujui cuti sendiri melalui konsol browser/API Firestore langsung.
2. **Data Leakage across Employees:** Karyawan A mencoba membaca catatan presensi atau pengajuan cuti milik Karyawan B dengan memanggil query langsung atau membuka URL `/cuti/[id]`.
3. **Cuti Redirection Gap:** Karyawan setelah mengajukan cuti di `/cuti/baru` harus diarahkan langsung ke rincian pengajuannya `/cuti/[id]` (PRD 4.4.1), bukan kembali ke daftar `/cuti`.
4. **Cuti Detail Access Authorization:** Bila ID cuti milik orang lain dibuka oleh Karyawan biasa, halaman harus menampilkan "Pengajuan tidak ditemukan" (PRD 4.4.2), bukan error permission atau data orang lain.
5. **ID Generation Race Condition in Cuti:** `simpanPengajuanCuti` saat ini membaca seluruh dokumen `pengajuan_cuti` untuk menghitung ID (`snap.size + 1`), yang melanggar aturan hak baca karyawan dan rawan tabrakan data (race condition).

---

### Task 1: Audit dan Penyusunan Cloud Firestore Security Rules yang Ketat
Mengganti aturan mode uji (`allow read, write: if true;`) dengan Security Rules berbasis RBAC dan kepemilikan data sesuai PRD 2.3, 2.4, 6.2, dan 7.1.

**Files:**
- Modify: `firestore.rules`
- Test: `scripts/test-security-rules.mjs`

**Interfaces:**
- Menghasilkan aturan keamanan Firestore untuk koleksi `users`, `presensi`, dan `pengajuan_cuti`.
- Menyediakan helper function `masuk()`, `adalahPemilik(karyawanId)`, dan `adalahHrd()`.

- [ ] **Step 1: Buat skrip automated test untuk memvalidasi aturan keamanan Firestore**
  Tulis skrip `scripts/test-security-rules.mjs` yang menguji operasi:
  - Anonim membaca/menulis (harus ditolak).
  - Karyawan membaca data karyawan lain (harus ditolak).
  - Karyawan mengubah role-nya sendiri (harus ditolak).
  - Karyawan menyetujui pengajuannya sendiri (harus ditolak).
  - Karyawan mencatat presensi masuk/pulang sendiri (harus diizinkan).
  - HRD membaca semua dan memutuskan cuti (harus diizinkan).

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan pada rules lama**
  Run: `node scripts/test-security-rules.mjs`
  Expected: FAIL (aturan lama mengizinkan modifikasi ilegal).

- [ ] **Step 3: Implementasikan Security Rules ketat di `firestore.rules`**
  Tulis aturan dengan validasi tipe data, field yang diizinkan, dan batas peran:
  - `users/{uid}`: create dengan role="karyawan", update nama hanya oleh pemilik, update role hanya oleh HRD.
  - `presensi/{id}`: read/create/update jamPulang hanya oleh pemilik atau HRD.
  - `pengajuan_cuti/{id}`: create hanya dengan status="menunggu", status update hanya oleh HRD.

- [ ] **Step 4: Jalankan verifikasi test rules**
  Run: `node scripts/test-security-rules.mjs`
  Expected: PASS

---

### Task 2: Perbaikan Logika Bisnis & Otorisasi Pengajuan Cuti (PRD 4.4.1 & 4.4.2)
Memperbaiki alur pembuatan cuti (penghindaran query seluruh koleksi pengajuan oleh karyawan) dan pengalihan ke rincian `/cuti/[id]`, serta proteksi akses rincian cuti orang lain.

**Files:**
- Modify: `lib/data.js`
- Modify: `app/(aplikasi)/cuti/baru/page.js`
- Modify: `app/(aplikasi)/cuti/[id]/page.js`
- Test: `scripts/test-cuti-flow.mjs`

**Interfaces:**
- `simpanPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan })` -> mengembalikan `{ id }` tanpa melakukan scan seluruh koleksi yang dilarang.
- `HalamanRincianCuti` -> memverifikasi kepemilikan; jika bukan HRD dan bukan pemiliknya, menampilkan state kosong "Pengajuan tidak ditemukan".

- [ ] **Step 1: Tulis skrip pengujian untuk alur cuti**
  Buat `scripts/test-cuti-flow.mjs` untuk menguji:
  - Pembuatan cuti mengembalikan ID unik.
  - Karyawan dialihkan ke rincian ID tersebut.
  - Karyawan B tidak dapat melihat data cuti Karyawan A.

- [ ] **Step 2: Jalankan test untuk memverifikasi gap**
  Run: `node scripts/test-cuti-flow.mjs`
  Expected: FAIL

- [ ] **Step 3: Perbaiki `lib/data.js`, `app/(aplikasi)/cuti/baru/page.js`, dan `app/(aplikasi)/cuti/[id]/page.js`**
  - Di `lib/data.js`: buat ID dokumen pengajuan cuti secara aman (misal format `C` + timestamp acak terurut) sehingga karyawan tidak perlu membaca seluruh dokumen karyawan lain.
  - Di `app/(aplikasi)/cuti/baru/page.js`: arahkan router ke `/cuti/${res.id}` setelah berhasil disimpan.
  - Di `app/(aplikasi)/cuti/[id]/page.js`: jika `pengguna.role !== 'hrd' && c.karyawanId !== pengguna.uid`, tetapkan data menjadi `null` agar menampilkan "Pengajuan tidak ditemukan".

- [ ] **Step 4: Jalankan test untuk memastikan sukses**
  Run: `node scripts/test-cuti-flow.mjs`
  Expected: PASS

---

### Task 3: Audit dan Perbaikan Presensi & Validasi Tanggal (PRD 4.3)
Memastikan aturan presensi: satu catatan per hari per karyawan, jam masuk setelah 08.00 ditandai terlambat, tombol Catat Masuk tidak dapat ditekan dobel, dan jam pulang tersimpan pada catatan yang sama.

**Files:**
- Modify: `lib/data.js`
- Modify: `app/(aplikasi)/presensi/page.js`
- Test: `scripts/test-presensi-validation.mjs`

- [ ] **Step 1: Tulis skrip uji validasi presensi**
  Buat `scripts/test-presensi-validation.mjs` yang menguji:
  - Masuk jam 07.50 -> status tepat waktu.
  - Masuk jam 08.05 -> status terlambat.
  - Catat pulang memperbarui catatan yang sama.

- [ ] **Step 2: Jalankan skrip uji**
  Run: `node scripts/test-presensi-validation.mjs`

- [ ] **Step 3: Pastikan penanganan di `lib/data.js` dan UI `app/(aplikasi)/presensi/page.js` konsisten**

- [ ] **Step 4: Jalankan ulang skrip uji**
  Run: `node scripts/test-presensi-validation.mjs`
  Expected: PASS

---

### Task 4: Regression Testing, Linting & Verifikasi Kesiapan Deployment Netlify
Menjalankan seluruh rangkaian tes otomatis, pemeriksaan linter, verifikasi build Next.js, dan audit checklist konfigurasi Netlify.

**Files:**
- Modify: `package.json` (menambahkan test script terpadu)
- Verify: `netlify.toml` / konfigurasi build

- [ ] **Step 1: Jalankan linter ESLint**
  Run: `npm run lint`
  Expected: Exit code 0, 0 errors, 0 warnings.

- [ ] **Step 2: Jalankan build produksi Next.js**
  Run: `npm run build`
  Expected: Build sukses tanpa kesalahan rute atau kompilasi.

- [ ] **Step 3: Jalankan seluruh test suite**
  Run: `npm run test:crud` dan `npm run test:auth`
  Expected: Seluruh test pass 100%.

- [ ] **Step 4: Periksa konfigurasi Netlify & authorized domains**
  Verifikasi variabel environment, file build output, dan panduan domain Netlify untuk Firebase Authentication.
