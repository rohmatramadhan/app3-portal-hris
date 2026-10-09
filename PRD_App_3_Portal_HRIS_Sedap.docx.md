**PRODUCT REQUIREMENTS DOCUMENT**

Aplikasi Presensi dan Cuti Karyawan

**PORTAL HRIS SEDAP**

# **1\. Ringkasan Eksekutif**

**Sedap** adalah usaha katering dengan sekitar 40 karyawan yang bekerja di dapur produksi dan kantor. Presensi masih dicatat di buku hadir lalu disalin HRD ke spreadsheet setiap akhir bulan, dan pengajuan cuti dikirim lewat WhatsApp pribadi ke HRD. Akibatnya HRD menghabiskan sekitar dua hari kerja setiap bulan untuk merekap, pengajuan cuti sering terselip, dan data karyawan tersebar di beberapa file yang bisa dibuka siapa saja.

Portal HRIS Sedap menggantikan buku hadir dan pesan WhatsApp dengan satu aplikasi web di portal.sedap.id. Aplikasi dipakai karyawan dan HRD lewat peramban, dari ponsel maupun laptop.

**Yang membuat aplikasi ini pas untuk Sedap:**

* Satu tempat untuk presensi dan cuti. Karyawan mencatat jam masuk dan pulang, lalu mengajukan cuti dari aplikasi yang sama.

* Masuk tanpa membuat kata sandi baru. Karyawan bisa masuk dengan akun Google yang sudah dimiliki.

* Setiap peran langsung tiba di halamannya. Karyawan masuk ke Beranda, HRD masuk ke Dasbor HRD.

* Data pribadi tetap pribadi. Karyawan hanya bisa membuka presensi dan cuti miliknya sendiri, termasuk bila alamat halaman diubah.

* HRD memutuskan dari satu daftar. Pengajuan yang menunggu terkumpul di satu halaman dan bisa dibagikan ke rekan HRD lewat tautan.

* Laporan bulanan tanpa menyalin. Rekap kehadiran tersusun sendiri dari catatan presensi.

**Yang tidak dibangun di v1:** beranda publik untuk pengunjung, lupa kata sandi, slip gaji, perhitungan sisa jatah cuti, persetujuan oleh atasan langsung, dan notifikasi email. Detail di Bab 9\.

# **2\. Pengguna & Peran**

## **2.1 Dua pemegang akun**

Aplikasi dipegang dua peran. Peran disimpan di profil setiap pengguna, bukan di akun login.

| Peran | Siapa | Tugas utama |
| :---- | :---- | :---- |
| **Karyawan** | Staf dapur dan kantor, misalnya Rama dan Sari | Mencatat presensi, mengajukan cuti, memantau status cutinya |
| **HRD** | Staf HRD, misalnya Bu Wulan | Semua yang bisa dilakukan Karyawan, ditambah mengelola data karyawan, memutuskan cuti, dan membaca laporan |

Alur kerjanya: karyawan mencatat presensi setiap hari dan mengajukan cuti bila perlu. HRD membuka Dasbor HRD, melihat pengajuan yang menunggu, lalu menyetujui atau menolaknya. Di akhir bulan HRD membuka Laporan untuk rekap kehadiran.

## **2.2 Pengunjung dan cara mendapat peran**

Pengunjung adalah siapa pun yang membuka portal.sedap.id tetapi belum masuk. Pengunjung hanya bisa membuka halaman Daftar dan Masuk.

* Setiap akun baru, baik lewat email maupun Google, otomatis berperan **karyawan**.

* Peran **hrd** hanya bisa diberikan oleh HRD lain lewat menu Data Karyawan.

* Akun HRD pertama dibuat dengan mengubah field role satu akun lewat konsol Firebase.

## **2.3 Hak akses per modul**

| Modul | Karyawan | HRD |
| :---- | :---- | :---- |
| Beranda | Penuh | Penuh |
| Presensi Saya | Penuh, hanya miliknya | Penuh, hanya miliknya |
| Cuti Saya | Penuh, hanya miliknya | Penuh, hanya miliknya |
| Profil | Lihat, ubah nama | Lihat, ubah nama |
| Dasbor HRD | Tidak tampil | Penuh |
| Data Karyawan | Tidak tampil | Penuh, termasuk mengubah peran |
| Persetujuan Cuti | Tidak tampil | Penuh |
| Laporan | Tidak tampil | Penuh |

## **2.4 Yang tidak boleh dilihat Karyawan**

| Data | Karyawan | HRD |
| :---- | :---- | :---- |
| Presensi dan pengajuan cuti miliknya | Lihat | Lihat |
| Presensi dan pengajuan cuti karyawan lain | **Tidak tampil** | Lihat |
| Daftar dan data semua karyawan | **Tidak tampil** | Lihat |
| Field role miliknya | Lihat, tidak bisa diubah | Lihat dan ubah |

Menu yang tidak boleh dibuka tidak ditampilkan sama sekali. Selain itu, halamannya tetap menolak bila alamatnya diketik langsung, dan datanya tetap ditolak oleh Security Rules bila diminta lewat konsol peramban.

# **3\. Lingkup Produk**

Aplikasi web. Buka lewat peramban, tanpa instal dari Play Store.

## **3.1 Peta modul**

Karyawan  
  Beranda  
  Presensi Saya  
  Cuti Saya ▼  
    Daftar Cuti · Ajukan Cuti  
  Profil

HRD (semua menu Karyawan, ditambah)  
  Dasbor HRD  
  Data Karyawan  
  Persetujuan Cuti  
  Laporan

Modul tanpa panah \= menu tunggal. Modul dengan panah \= bisa buka-tutup.

## **3.2 Batas fitur v1**

| Termasuk v1 | Tidak termasuk v1 |
| :---- | :---- |
| Daftar dan masuk dengan email atau Google, dua peran, presensi masuk dan pulang, pengajuan cuti dengan status, persetujuan oleh HRD, data karyawan, laporan presensi bulanan | Beranda publik, lupa kata sandi, slip gaji, sisa jatah cuti, persetujuan atasan langsung, notifikasi email, aplikasi seluler |

# **4\. Kebutuhan Fungsional**

Bagian ini menjelaskan setiap modul dari sudut pandang pengguna: siapa menekan apa, mengisi apa, dan sistem merespons apa.

## **4.0 Ringkasan modul**

| Modul | Menu | Tujuan |
| :---- | :---- | :---- |
| Daftar dan Masuk | Daftar · Masuk | Pintu masuk dengan email atau Google, lalu diarahkan sesuai peran |
| Beranda | Beranda | Ringkasan hari ini untuk karyawan |
| Presensi | Presensi Saya | Mencatat jam masuk dan pulang, melihat riwayat per bulan |
| Cuti | Daftar Cuti · Ajukan Cuti | Mengajukan cuti dan memantau keputusannya |
| Profil | Profil | Melihat data diri dan memperbarui nama |
| Dasbor HRD | Dasbor HRD | Kondisi hari ini tanpa membuka menu satu per satu, hanya HRD |
| Data Karyawan | Data Karyawan | Daftar karyawan, rincian, dan pengaturan peran, hanya HRD |
| Persetujuan Cuti | Persetujuan Cuti | Memutuskan pengajuan yang menunggu, hanya HRD |
| Laporan | Laporan | Rekap kehadiran bulanan semua karyawan, hanya HRD |

## **4.1 Daftar dan Masuk**

Dua halaman publik, keduanya dengan tombol **Masuk dengan Google**.

**Langkah karyawan baru mendaftar:**

1. Rama membuka portal.sedap.id/daftar.

2. Mengisi Nama\*, Email\*, dan Kata sandi\*, lalu mengklik Daftar. Atau mengklik Masuk dengan Google.

3. Sistem membuat akun dan profil berperan karyawan, lalu membawa Rama ke Beranda.

**Langkah masuk:**

1. Pengguna membuka /masuk, mengisi email dan kata sandi, atau mengklik Masuk dengan Google.

2. Sistem membaca peran dari profil. Karyawan diarahkan ke Beranda, HRD diarahkan ke Dasbor HRD.

**Perilaku otomatis:** pengguna Google yang masuk pertama kali tidak melewati halaman Daftar, jadi profilnya dibuat saat itu juga. Profil yang sudah ada tidak boleh tertimpa saat pengguna masuk lagi. Pengguna tetap masuk walau halaman dimuat ulang. Pengguna yang sudah masuk lalu membuka /masuk atau /daftar langsung diarahkan ke halamannya.

**Validasi:** email wajib dan unik, kata sandi minimal 6 karakter.

**Batasan v1:** lupa kata sandi tidak termasuk.

## **4.2 Beranda/Dashboard Karyawan**

Tujuan: karyawan tahu apa yang perlu dikerjakan hari itu tanpa membuka menu lain.

Isi kartu:

* **Presensi hari ini:** “Belum presensi hari ini”, “Sudah masuk pukul 07.52”, atau “Sudah pulang”.

* **Cuti:** jumlah pengajuan miliknya yang masih menunggu.

* Tombol cepat **Catat Masuk** dan **Ajukan Cuti**.

**Perilaku otomatis:** semua angka ditarik dari data presensi dan pengajuan cuti milik pengguna yang masuk. Mengklik kartu melompat ke menu sumbernya.

## **4.3 Presensi Saya**

Tujuan: karyawan mencatat kehadiran tanpa buku hadir dan bisa mencocokkan riwayatnya.

**Tampilan:** tombol Catat Masuk dan Catat Pulang di bagian atas, lalu tabel riwayat dengan kolom Tanggal, Jam Masuk, Jam Pulang, Keterangan. Pilihan bulan di atas tabel.

**Langkah karyawan mencatat presensi:**

1. Rama membuka Presensi Saya saat tiba di dapur.

2. Mengklik Catat Masuk. Sistem mencatat tanggal dan jam, lalu tombol berganti menjadi Catat Pulang.

3. Sore hari Rama mengklik Catat Pulang. Jam pulang tersimpan pada catatan yang sama.

**Langkah melihat riwayat:**

1. Rama memilih bulan September.

2. Tabel menampilkan catatan September beserta jumlah hari hadir dan terlambat.

3. Rama memuat ulang halaman. Bulan September tetap terpilih.

**Validasi:** satu karyawan hanya punya satu catatan presensi per tanggal. Catat Masuk tidak bisa ditekan lagi setelah dipakai hari itu. Masuk setelah pukul 08.00 ditandai terlambat.

## **4.4 Cuti Saya**

### **4.4.1 Ajukan Cuti**

**Langkah karyawan mengajukan cuti:**

1. Sari membuka Cuti Saya → Ajukan Cuti.

2. Mengisi Tanggal mulai\*, Tanggal selesai\*, dan Alasan\*.

3. Mengklik Kirim. Sistem menyimpan pengajuan berstatus Menunggu dan membawa Sari ke rincian pengajuannya.

**Validasi:** tanggal selesai tidak boleh lebih awal dari tanggal mulai. Bila keliru, pengajuan ditolak dengan pesan “Tanggal selesai harus sama atau setelah tanggal mulai”.

### **4.4.2 Daftar dan Rincian Cuti**

**Tampilan daftar:** kolom Nomor, Tanggal, Lama, Status, diurutkan dari yang terbaru. Status ditampilkan sebagai pil berwarna: Menunggu, Disetujui, Ditolak.

**Langkah memantau keputusan:**

1. Sari membuka Cuti Saya dan melihat pengajuannya berstatus Disetujui.

2. Mengklik baris itu. Rincian terbuka di alamat /cuti/ diikuti nomor pengajuan, berisi tanggal, alasan, status, dan catatan HRD.

**Perilaku otomatis:** status di rincian dibaca langsung dari data, sehingga berubah begitu HRD memutuskan. Rincian hanya terbuka untuk pemiliknya dan HRD. Bila nomor di alamat diganti dengan nomor pengajuan orang lain, tampil “Pengajuan tidak ditemukan”.

**Validasi:** pengajuan yang sudah Disetujui atau Ditolak tidak bisa diubah oleh pemohonnya.

## **4.5 Profil**

Menampilkan nama, email, dan peran pengguna yang masuk. Nama bisa diubah. Email dan peran tampil tetapi tidak bisa diubah dari halaman ini.

## **4.6 Dasbor HRD**

Halaman yang langsung terlihat setelah HRD masuk.

Tujuan: HRD mengetahui kondisi hari itu tanpa membuka menu satu per satu.

Isi kartu:

* **Kehadiran:** jumlah karyawan yang sudah masuk hari ini dan yang terlambat.

* **Cuti:** jumlah pengajuan yang menunggu keputusan.

* **Karyawan:** jumlah karyawan terdaftar.

**Langkah HRD memeriksa pagi hari:**

1. Bu Wulan masuk → Dasbor HRD terbuka.

2. Melihat kartu Cuti: 3 menunggu → mengklik angka 3 → masuk Persetujuan Cuti dengan saringan Menunggu.

**Perilaku otomatis:** semua angka dihitung dari data presensi, pengajuan cuti, dan karyawan. Tidak ada masukan manual.

## **4.7 Data Karyawan**

**Tampilan:** tabel dengan kolom Nama, Email, Peran. Kolom pencarian nama.

**Langkah HRD memberi peran HRD:**

1. Bu Wulan membuka Data Karyawan → mengklik satu nama.

2. Rincian karyawan terbuka di alamat /admin/karyawan/ diikuti ID karyawan.

3. Mengubah Peran menjadi HRD → Simpan.

4. Saat karyawan itu masuk lagi, ia diarahkan ke Dasbor HRD.

**Validasi:** peran hanya bernilai karyawan atau hrd. Karyawan tidak bisa mengubah perannya sendiri, dari halaman mana pun.

## **4.8 Persetujuan Cuti**

**Tampilan:** daftar pengajuan semua karyawan dengan kolom Nama, Tanggal, Lama, Alasan, Status. Saringan status: Semua, Menunggu, Disetujui, Ditolak.

**Langkah HRD memutuskan:**

1. Bu Wulan membuka Persetujuan Cuti dan memilih saringan Menunggu.

2. Mengklik satu pengajuan → membaca alasan → mengisi Catatan HRD.

3. Mengklik Setujui atau Tolak. Status berubah dan pengajuan keluar dari saringan Menunggu.

**Perilaku otomatis:** saringan yang dipilih ikut tersimpan di alamat halaman. Bila Bu Wulan membagikan tautan halamannya ke rekan HRD, rekannya melihat daftar yang sama.

**Validasi:** hanya HRD yang bisa mengubah status. Status hanya bernilai menunggu, disetujui, atau ditolak.

## **4.9 Laporan**

**Tampilan:** pilihan bulan, lalu tabel per karyawan dengan kolom Nama, Hari Hadir, Terlambat, Cuti Disetujui.

**Langkah HRD menyusun rekap bulanan:**

1. Bu Wulan membuka Laporan dan memilih bulan September.

2. Tabel menampilkan rekap seluruh karyawan untuk September.

**Perilaku otomatis:** angka dihitung dari catatan presensi dan pengajuan cuti, tidak disimpan terpisah.

**Batasan v1:** ekspor Excel dan PDF tidak termasuk.

# **5\. Identitas Visual & Prinsip Antarmuka**

Tampilan bersih dengan menu samping, panel putih, dan tema terang. Mengikuti warna Sedap.

## **5.1 Warna**

| Nama | Kode | Pakai untuk |
| :---- | :---- | :---- |
| Hijau Sedap | \#0F766E | Tombol utama, menu aktif, bilah atas |
| Latar aplikasi | \#F4F7F9 | Latar di belakang panel |
| Panel | \#FFFFFF | Panel isi halaman |
| Teks | \#1F2937 | Teks utama |
| Teks redup | \#5A6B78 | Keterangan dan label |

## **5.2 Warna status cuti**

| Status | Kode |
| :---- | :---- |
| Menunggu | \#F59E0B |
| Disetujui | \#15A66A |
| Ditolak | \#E53935 |

## **5.3 Tipografi**

* Font UI: Inter (400, 500, 600, 700). Fallback: system-ui.

* Jam dan tanggal memakai tabular-nums agar kolom rata.

## **5.4 Prinsip antarmuka**

* Menu yang tidak boleh dibuka suatu peran tidak ditampilkan. Halamannya tetap dijaga bila alamatnya diketik langsung.

* Halaman yang menolak pengguna menjelaskan alasannya dan memberi tombol kembali, tanpa kode teknis.

* Setiap halaman yang mengambil data menampilkan empat keadaan: memuat, berhasil, kosong, dan gagal dengan tombol Coba lagi.

# **6\. Kebutuhan Non-Fungsional**

## **6.1 Akses**

* Masuk dengan email dan kata sandi, atau akun Google.

* Bahasa antarmuka Indonesia.

* Pengguna tetap masuk saat halaman dimuat ulang. Selama keadaan masuk masih dibaca, aplikasi menampilkan indikator memuat dan tidak mengarahkan pengguna ke mana pun.

## **6.2 Penjagaan halaman dan data**

Dua lapis, masing-masing untuk jalur yang berbeda.

| Lapis | Menjaga | Cara |
| :---- | :---- | :---- |
| Route guard | Halaman | Pemeriksaan sebelum halaman tampil. Belum masuk diarahkan ke /masuk; bukan HRD di halaman HRD melihat Akses Ditolak |
| Security Rules | Data di Firestore | Setiap permintaan diperiksa: pemilik data lewat karyawanId, peran lewat profil di koleksi karyawan |

Security Rules juga mengunci field role dan status agar tidak bisa diubah oleh karyawan, termasuk lewat konsol peramban.

## **6.3 Alamat halaman**

* Setiap halaman bisa dibuka langsung dari alamatnya dan tetap tampil saat dimuat ulang.

* Alamat yang tidak dikenal menampilkan halaman 404 dengan tombol kembali.

* Pengguna yang diarahkan ke halaman Masuk dikembalikan ke halaman tujuannya setelah berhasil masuk.

# **7\. Teknologi yang Digunakan**

| Lapisan | Teknologi | Catatan |
| :---- | :---- | :---- |
| Aplikasi web | Next.js (App Router) | Dibangun dengan agen AI di Antigravity. Setiap halaman menjadi satu folder di app/ |
| Masuk | Firebase Authentication | Email dan kata sandi, serta akun Google |
| Basis data | Cloud Firestore | Tiga koleksi, lihat 7.1 |
| Penjagaan data | Firestore Security Rules | Menegakkan kepemilikan dan peran |
| Hosting | Netlify | Alamat Netlify didaftarkan di Authorized domains Firebase agar masuk dengan Google berjalan |

## **7.1 Struktur data Firestore**

Nama koleksi dan field mengikuti tabel ini, bukan nama buatan agen AI.

| Koleksi | Field | Tipe | Keterangan |
| :---- | :---- | :---- | :---- |
| karyawan | ID dokumen | string | Sama dengan uid akun Firebase Authentication |
|  | nama | string |  |
|  | email | string |  |
|  | role | string | karyawan atau hrd |
| presensi | karyawanId | string | uid pemilik catatan |
|  | tanggal | string | Format 2026-10-07 |
|  | jamMasuk | timestamp |  |
|  | jamPulang | timestamp | Kosong sampai karyawan mencatat pulang |
| pengajuan\_cuti | karyawanId | string | uid pemohon |
|  | tanggalMulai | timestamp |  |
|  | tanggalSelesai | timestamp |  |
|  | alasan | string |  |
|  | status | string | menunggu, disetujui, atau ditolak |
|  | catatanHrd | string | Diisi HRD saat memutuskan |
|  | diajukanPada | timestamp |  |

# **8\. Pengujian**

Pengujian penerimaan dilakukan per modul mengikuti alur pada Bab 4: mendaftar dengan email dan Google, masuk sebagai karyawan dan HRD, mencatat presensi, mengajukan cuti, memutuskan cuti, mengubah peran, dan membaca laporan.

Termasuk di dalamnya uji tembus dengan akun karyawan: mengetik alamat halaman HRD secara langsung, mengganti nomor di alamat rincian cuti dengan milik orang lain, membaca presensi orang lain lewat konsol peramban, menaikkan peran sendiri, dan menyetujui cuti sendiri. Kelima percobaan harus ditolak.

# **9\. Batas Lingkup Pekerjaan**

| Tidak termasuk v1 | Alasan |
| :---- | :---- |
| Landing page publik untuk pengunjung | Portal hanya untuk karyawan; pengunjung cukup melihat halaman Masuk |
| Lupa kata sandi | Sebagian besar karyawan masuk dengan Google |
| Slip gaji dan penggajian | Diurus terpisah oleh bagian keuangan |
| Perhitungan sisa jatah cuti | Dibangun pada pengembangan berikutnya bersama persetujuan bertingkat |
| Persetujuan oleh atasan langsung | Tahap berikutnya; v1 cukup diputuskan HRD |
| Notifikasi email | Status cuti sudah terlihat di aplikasi |
| Ekspor Excel dan PDF | Laporan cukup dibaca di layar |
| Aplikasi seluler | Hanya web, bisa dibuka dari peramban ponsel |

Setelah PRD disepakati, modul, peran, dan alur inti pada Bab 4 tidak diubah lagi. Perubahan tampilan masih dimungkinkan.

# **10\. Kamus Istilah**

| Istilah | Arti |
| :---- | :---- |
| Karyawan | Peran untuk staf Sedap. Bisa mencatat presensi dan mengajukan cuti miliknya |
| HRD | Peran untuk staf HRD. Semua hak Karyawan ditambah mengelola data karyawan dan memutuskan cuti |
| Pengunjung | Orang yang membuka portal tetapi belum masuk |
| Profil | Dokumen di koleksi karyawan yang ID-nya sama dengan uid pengguna, berisi nama, email, dan peran |
| Presensi | Catatan jam masuk dan jam pulang seorang karyawan pada satu tanggal |
| Pengajuan cuti | Permintaan cuti dengan tanggal, alasan, dan status |
| Menunggu, Disetujui, Ditolak | Tiga status pengajuan cuti |
| Terlambat | Jam masuk setelah pukul 08.00 |
| Route guard | Pemeriksaan sebelum halaman tampil yang memutuskan halaman dibuka atau ditolak |
| Security Rules | Aturan Firestore yang memeriksa setiap permintaan data |
| karyawanId | Field penanda pemilik pada koleksi presensi dan pengajuan\_cuti |

