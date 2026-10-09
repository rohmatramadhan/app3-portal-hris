# Integrasi CRUD Firestore Portal HRIS Sedap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghubungkan seluruh fungsi CRUD (catat presensi, ajukan cuti, putuskan cuti, ubah profil, dan ubah data karyawan) beserta seluruh pembacaan data ke Cloud Firestore, menggantikan data contoh (dataContoh.js).

**Architecture:** Mengganti pembacaan dan penulisan di `lib/data.js` menggunakan Firestore SDK (`collection`, `doc`, `getDoc`, `getDocs`, `setDoc`, `updateDoc`, `addDoc`, `query`, `where`, `Timestamp`), lalu menyambungkan UI di halaman Presensi, Cuti Baru, Persetujuan Cuti, Profil, dan Rincian Karyawan ke fungsi-fungsi Firestore tersebut dengan menjaga bentuk keluaran data.

**Tech Stack:** Next.js 16 App Router, Firebase JS SDK 13 (Cloud Firestore), Tailwind CSS v4.

**Spec:** `docs/PRD_App_3.md` / `PRD_App_3_Portal_HRIS_Sedap.docx.md` dan `AGENTS.md`.

## Global Constraints

- Nama koleksi: `users`, `presensi`, `pengajuan_cuti` (AGENTS.md Aturan 1).
- Nama field: `nama`, `email`, `role`, `karyawanId`, `tanggal`, `jamMasuk`, `jamPulang`, `tanggalMulai`, `tanggalSelesai`, `alasan`, `status`, `catatanHrd`, `diajukanPada` (PRD 7.1).
- Bentuk keluaran data dari `lib/data.js` dipertahankan (tanggal/waktu bertipe `Date` atau `null`, ID dokumen sebagai `id`).
- Halaman mengambil data dan melakukan mutasi melalui fungsi di `lib/data.js`, bukan memanggil Firestore langsung di komponen (AGENTS.md Aturan 4).
- Jangan mengubah tampilan halaman yang tidak diminta (AGENTS.md Aturan 5).
- Bahasa antarmuka Indonesia (AGENTS.md Aturan 6).

## Review Focus

1. Konversi Firestore `Timestamp` ke JavaScript `Date` objek pada pembacaan data (`jamMasuk`, `jamPulang`, `tanggalMulai`, `tanggalSelesai`, `diajukanPada`).
2. Presensi hari ini: jika sudah presensi masuk, tombol "Catat Masuk" harus disabled dan menampilkan jam masuk; jika sudah presensi pulang, tombol "Catat Pulang" disabled.
3. ID dokumen presensi mengikuti format `${karyawanId}-${tanggal}` agar mencegah duplikasi per hari.
4. Pengajuan cuti baru harus tersimpan dengan status `"menunggu"` dan `catatanHrd: ""` serta terhubung dengan pemohon `karyawanId`.
5. HRD menyetujui atau menolak cuti harus memperbarui `status` dan `catatanHrd` langsung ke Firestore dan tampak pada daftar persetujuan.

---

### Task 1: Lapisan Data Firestore (`lib/data.js`)

**Files:**
- Modify: `lib/data.js`

**Interfaces:**
- Consumes: `db` dari `@/lib/firebase`, fungsi pembantu dari `@/lib/waktu`
- Produces:
  - `ambilPresensi(karyawanId, bulan)`
  - `ambilPresensiTanggal(karyawanId, tanggal)`
  - `catatPresensiMasuk(karyawanId, tanggal, jamMasuk)`
  - `catatPresensiPulang(karyawanId, tanggal, jamPulang)`
  - `ambilPengajuanCuti(karyawanId)`
  - `ambilSatuPengajuan(id)`
  - `ambilSemuaPengajuan(status)`
  - `tambahPengajuanCuti({ karyawanId, tanggalMulai, tanggalSelesai, alasan })`
  - `putuskanPengajuanCuti(id, status, catatanHrd)`
  - `ambilSemuaKaryawan()`
  - `ambilKaryawan(id)`
  - `perbaruiPeranKaryawan(id, role)`
  - `perbaruiProfil(uid, { nama })`
  - `ambilRingkasanDasbor(tanggal)`
  - `ambilRekapBulanan(bulan)`

- [ ] **Step 1: Implementasikan fungsi baca dan tulis Firestore di `lib/data.js`**
- [ ] **Step 2: Jalankan skrip tes verifikasi node untuk memastikan seluruh fungsi `lib/data.js` berjalan dengan Firestore**

---

### Task 2: Fitur Presensi (`app/(aplikasi)/presensi/page.js`)

**Files:**
- Modify: `app/(aplikasi)/presensi/page.js`

**Interfaces:**
- Consumes: `ambilPresensi`, `ambilPresensiTanggal`, `catatPresensiMasuk`, `catatPresensiPulang` dari `@/lib/data`

- [ ] **Step 1: Muat presensi hari ini dari Firestore menggunakan `ambilPresensiTanggal`**
- [ ] **Step 2: Hubungkan aksi Catat Masuk dan Catat Pulang ke `catatPresensiMasuk` dan `catatPresensiPulang`**
- [ ] **Step 3: Uji fungsional presensi di browser / unit verifikasi**

---

### Task 3: Fitur Ajukan Cuti (`app/(aplikasi)/cuti/baru/page.js`)

**Files:**
- Modify: `app/(aplikasi)/cuti/baru/page.js`

**Interfaces:**
- Consumes: `tambahPengajuanCuti` dari `@/lib/data`, `usePengguna` dari `@/lib/pengguna`

- [ ] **Step 1: Hubungkan pengiriman formulir ajukan cuti ke `tambahPengajuanCuti`**
- [ ] **Step 2: Alihkan pengguna ke `/cuti` setelah penyimpanan berhasil**
- [ ] **Step 3: Uji fungsional pengajuan cuti**

---

### Task 4: Fitur Persetujuan Cuti (`app/(aplikasi)/admin/cuti/page.js`)

**Files:**
- Modify: `app/(aplikasi)/admin/cuti/page.js`

**Interfaces:**
- Consumes: `ambilSemuaPengajuan`, `putuskanPengajuanCuti` dari `@/lib/data`

- [ ] **Step 1: Hubungkan tombol "Setujui" dan "Tolak" ke `putuskanPengajuanCuti`**
- [ ] **Step 2: Perbarui state lokal dan pesan konfirmasi setelah status tersimpan di Firestore**
- [ ] **Step 3: Uji fungsional persetujuan cuti**

---

### Task 5: Fitur Ubah Profil (`app/(aplikasi)/profil/page.js` & `lib/pengguna.js`)

**Files:**
- Modify: `lib/pengguna.js`
- Modify: `app/(aplikasi)/profil/page.js`

**Interfaces:**
- Consumes: `ambilKaryawan`, `perbaruiProfil` dari `@/lib/data`

- [ ] **Step 1: Hubungkan `usePengguna` agar memuat data profil aktual dari Firestore `users/dina`**
- [ ] **Step 2: Hubungkan form Profil ke `perbaruiProfil`**
- [ ] **Step 3: Uji fungsional ubah profil**

---

### Task 6: Fitur Ubah Data Karyawan (`app/(aplikasi)/admin/karyawan/[id]/page.js`)

**Files:**
- Modify: `app/(aplikasi)/admin/karyawan/[id]/page.js`

**Interfaces:**
- Consumes: `ambilKaryawan`, `perbaruiPeranKaryawan` dari `@/lib/data`

- [ ] **Step 1: Hubungkan FormPeran ke `perbaruiPeranKaryawan`**
- [ ] **Step 2: Tampilkan pesan konfirmasi setelah peran berhasil diubah di Firestore**
- [ ] **Step 3: Uji fungsional ubah data peran karyawan**

---

### Task 7: Verifikasi Akhir & Pelaporan Status CRUD

**Files:**
- Test all pages & build: `npm run lint`, `npm run build`

- [ ] **Step 1: Jalankan linter dan build check**
- [ ] **Step 2: Buat rangkuman status seluruh fitur CRUD untuk pengguna**
