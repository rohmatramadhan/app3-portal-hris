# Kredensial & Tautan Portal HRIS Sedap

Dokumen ini berisi tautan aplikasi produksi (*live deployment*) Portal HRIS Sedap serta akun pengujian untuk peran **HRD** dan **Karyawan**.

---

## 🌐 Tautan Aplikasi

| Keterangan | Tautan URL |
|---|---|
| **Aplikasi Live (Netlify)** | [https://hris-sedap-1.netlify.app](https://hris-sedap-1.netlify.app) |
| **Halaman Masuk (Login)** | [https://hris-sedap-1.netlify.app/masuk](https://hris-sedap-1.netlify.app/masuk) |
| **Halaman Pendaftaran** | [https://hris-sedap-1.netlify.app/daftar](https://hris-sedap-1.netlify.app/daftar) |
| **Repositori GitHub** | [https://github.com/ijechnology/app3-portal-hris](https://github.com/ijechnology/app3-portal-hris) |

---

## 🔐 Kredensial Login Pengujian

### 1. Akun HRD (Human Resources Department)
Akun ini memiliki hak akses penuh ke seluruh modul internal manajemen HRD.

- **Email:** `wulan@sedap.id`
- **Kata Sandi:** `wulan123`
- **Nama:** Wulan
- **Peran (*Role*):** `hrd`
- **Pengalihan Otomatis Setelah Masuk:** `/admin`
- **Menu Akses:**
  - Dasbor HRD (`/admin`)
  - Kelola Data Karyawan (`/admin/karyawan`)
  - Persetujuan Pengajuan Cuti (`/admin/cuti`)
  - Laporan & Rekap Kehadiran (`/admin/laporan`)
  - Modul Karyawan (`/beranda`, `/presensi`, `/cuti`, `/profil`)

---

### 2. Akun Karyawan
Akun ini memiliki hak akses sebagai staf operasional catering untuk presensi harian dan pengajuan cuti.

- **Email:** `karyawan@sedap.id`
- **Kata Sandi:** `karyawan123`
- **Nama:** Budi Santoso
- **Peran (*Role*):** `karyawan`
- **Pengalihan Otomatis Setelah Masuk:** `/beranda`
- **Menu Akses:**
  - Beranda Karyawan (`/beranda`)
  - Pencatatan Presensi Masuk & Pulang (`/presensi`)
  - Pengajuan Cuti Mandiri (`/cuti`, `/cuti/baru`, `/cuti/[id]`)
  - Profil Pribadi (`/profil`)
  - *Catatan:* Jika karyawan mencoba mengakses rute `/admin`, sistem *route guard* akan menampilkan halaman **Akses Ditolak**.

---

## 🚀 Pengujian Opsi Masuk Lainnya

1. **Pendaftaran Akun Mandiri (`/daftar`):**
   - Pengguna baru dapat mendaftarkan akun secara mandiri.
   - Sesuai PRD Bab 2.2 & 4.1, seluruh akun yang didaftarkan melalui form registrasi otomatis memiliki peran `karyawan`.
2. **Masuk dengan Google (*Single Sign-On*):**
   - Pengguna dapat menekan tombol **"Masuk dengan Google"** di halaman `/masuk` atau `/daftar`.
   - Profil pengguna otomatis dibuatkan di dokumen `users/{uid}` pada Firestore dengan peran default `karyawan`.
3. **Route Guard & Proteksi Rute:**
   - Halaman `/beranda`, `/presensi`, `/cuti`, `/profil`, dan `/admin` diproteksi secara otomatis.
   - Pengguna yang belum masuk akan diarahkan ke `/masuk?kembali=<alamat_asal>`.
   - Tombol **Keluar** di bilah atas (*navbar*) membersihkan sesi autentikasi dan mengarahkan kembali ke `/masuk`.
