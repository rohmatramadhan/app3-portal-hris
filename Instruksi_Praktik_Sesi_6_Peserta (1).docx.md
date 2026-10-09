# **Instruksi Praktik Sesi 6: Login Berdasarkan Peran di App 3**

Bootcamp AI Web Programming · Sesi 6 · Oktober 2026

## **Konteks: Apa yang Kita Bangun Hari Ini?**

Di Sesi 5 kamu membedah PRD App 3: Portal HRIS Sedap menjadi matriks akses, peta route, dan peta state di Canva board kelompok. Hari ini rancangan itu menjadi aplikasi sungguhan.

**Situasinya.** Mentor sudah menyiapkan *codebase* App 3 di GitHub. Semua halaman sudah ada, dan fitur seperti catat presensi atau ajukan cuti sudah bisa diklik. Tetapi datanya masih data contoh, belum tersimpan di database. Aplikasi ini juga belum punya login, belum mengenal peran, dan halaman HRD bisa dibuka siapa saja dengan mengetik /admin.

**Tugasmu hari ini:**

1. Mengambil *codebase* App 3 ke laptop dengan *clone*.

2. Menyambungkan App 3 ke proyek Firebase milikmu, lengkap dengan database dan data contoh.

3. Memastikan semua fitur CRUD menyimpan data ke Firestore.

4. Memasang login dengan email dan sandi, serta akun Google.

5. Menyimpan peran setiap pengguna di koleksi users, termasuk akun HRD pertama.

6. Mengarahkan karyawan ke /beranda dan HRD ke /admin, lalu menolak karyawan yang membuka /admin.

7. Menayangkan App 3 di Netlify.

**Posisi praktik ini dalam bootcamp.**

1. **Sesi 4:** kamu mengenal *authentication*, *authorization*, dan matriks akses.

2. **Sesi 5:** kamu menyusun peta route dan peta state App 3 dari PRD.

3. **Sesi 6 (hari ini):** Firebase, login, peran, pengalihan, dan *route guard* dipasang di App 3\.

4. **Sesi berikutnya:** data di Firestore dikunci dengan *security rules*.

## **Tujuan dan Alur Praktik**

Hari ini ada satu persiapan dan dua praktik. Kerjakan berurutan, karena setiap bagian memakai hasil bagian sebelumnya. Langkah Praktik 1 sama persis dengan langkah yang diperagakan mentor.

| Bagian | Hasil yang dicapai | Waktu | Prompt |
| :---- | :---- | :---- | :---- |
| Persiapan | App 3 tampil di laptopmu | 20 menit, pagi | Prompt Clone, bila memakai cara 3 |
| Praktik 1 | App 3 tersambung ke Firebase, CRUD tersimpan, login berjalan | 70 menit, pagi | Prompt 1 sampai 4 |
| Praktik 2 | Peran tersimpan, pengguna diarahkan dan dijaga sesuai peran, aplikasi tayang | 90 menit, siang | Prompt 5 sampai 10 |
| Setelah sesi | Eksplorasi di rumah dan tugas mandiri | Di rumah |  |

## **Bahan yang Dipakai**

| Bahan | Dipakai untuk | Di mana |
| :---- | :---- | :---- |
| PRD App 3: Portal HRIS Sedap | Rujukan halaman, peran, dan data | Dibagikan di Sesi 5 |
| Canva board kelompok Sesi 5 | Peta route sebagai isi *route guard* | Board kelompokmu |
| Repository App 3 | *Codebase* awal | https\://github.com/rohmatramadhan/app3-portal-hris |
| Akun Google | Membuat proyek Firebase | console.firebase.google.com |
| Antigravity dengan Firebase MCP | Agen AI yang bisa langsung bekerja di proyek Firebase | Laptopmu |
| Akun Netlify | Menayangkan aplikasi | netlify.com |
| Panduan Menayangkan App 3 ke Netlify | Langkah lengkap tayang | Dokumen terpisah |

**Istilah yang dipakai di instruksi ini.**

* ***Repository*** (repo): folder proyek beserta seluruh riwayat perubahannya.

* ***Clone***: menyalin repo dari GitHub ke laptop.

* ***Seed data***: data contoh yang dimasukkan ke database supaya aplikasi langsung punya isi untuk diuji.

* **CRUD**: empat operasi data, yaitu *Create* (tambah), *Read* (baca), *Update* (ubah), dan *Delete* (hapus).

* ***Diff***: daftar baris kode yang berubah. Merah berarti dihapus, hijau berarti ditambah.

* ***MCP*** (*Model Context Protocol*): penghubung yang membuat agen AI bisa memakai layanan lain, misalnya membaca dan mengubah data di proyek Firebase.

## **Aturan Bekerja dengan Agen AI**

Aturan ini berlaku di kedua praktik.

1. **Satu prompt, satu pekerjaan.** Kirim prompt sesuai urutan nomornya. Jangan menggabungkan dua prompt.

2. **Baca *diff* sebelum menerima.** Pastikan hanya file yang berhubungan dengan prompt yang berubah.

3. **Uji setelah setiap prompt.** Jangan lanjut ke prompt berikutnya sebelum hasilnya benar.

4. **Ikuti PRD.** Nama koleksi (users, presensi, pengajuan\_cuti), nama *field*, dan alamat halaman tidak boleh diganti agen.

5. **Kata sandi tidak pernah disimpan di Firestore.** Kata sandi hanya ada di Firebase Authentication.

## **Persiapan: Mengambil Codebase App 3**

Pilih **salah satu** dari tiga cara *clone* di bawah. Hasilnya sama: folder app3-portal-hris tersalin ke laptopmu.

**Siapkan dulu:**

1. Folder kerja di Local Disk D, misalnya D:\\Bootcamp.

2. Link repository: https\://github.com/rohmatramadhan/app3-portal-hris.

**Cara 1: lewat terminal (PowerShell atau CMD).** Git harus sudah terpasang. Periksa dengan git \--version.

1. Klik kanan folder D:\\Bootcamp, pilih **Buka di Terminal**.

2. Ketik perintah di bawah, lalu tekan Enter.

3. Tunggu sampai folder app3-portal-hris muncul.

4. Buka folder itu di Antigravity lewat **Open Folder**.

git clone https\://github.com/rohmatramadhan/app3-portal-hris.git

**Cara 2: lewat menu Clone Repository di Antigravity.**

1. Buka Antigravity, pilih **File › New Window**, lalu klik **Clone Repository**.

2. Tempel link repository, lalu klik **Clone from GitHub**.

3. Bila laptop belum pernah masuk ke GitHub, ikuti urutan ini:

   1. Klik **Allow**.

   2. Muncul **Your Code**. Klik **Copy & Continue to GitHub**.

   3. Di **Device Activation**, klik **Continue** pada akun GitHub-mu.

   4. Di **Authorize your device**, tempel kode tadi, lalu klik **Continue**.

   5. Klik **Authorize google-antigravity**.

   6. Di **Confirm access**, klik **Verify via email**.

   7. Buka email akun GitHub, salin kode verifikasi, tempel, lalu klik **Verify**.

   8. Muncul **Congratulations, you’re all set\!** Kembali ke Antigravity.

4. Tempel lagi link repository, lalu klik clone.

5. Di jendela pilih folder, cari D:\\Bootcamp, lalu klik **Select as Repository Destination**.

6. Pada pertanyaan **Would you like to open the repository?**, klik **Open**.

**Cara 3: lewat prompt ke agen.**

1. Buka Antigravity, klik **Open Folder**, pilih D:\\Bootcamp, lalu klik **Select Folder**.

2. Kirim **Prompt Clone** dari Koleksi Prompt di akhir dokumen ini ke panel chat agen.

3. Bila agen meminta izin menjalankan perintah, setujui.

**Setelah clone berhasil:**

cd app3-portal-hris  
npm install  
npm run dev

Buka localhost:3000, lalu pastikan semua halaman App 3 tampil. Pastikan juga Firebase MCP aktif di Antigravity.

**Cek hasil:**

☐ App 3 tampil di localhost:3000, dan semua menu bisa dibuka.

☐ Firebase MCP aktif di Antigravity.

## **Praktik 1: Firebase dan Login di App 3**

**Target:** App 3 tersambung ke proyek Firebase milikmu, semua data tersimpan di Firestore, dan halaman Masuk berjalan.

**Langkah (sama persis dengan demonstrasi):**

1. Buat folder di Local Disk D, lalu *clone* repository App 3\. Bila sudah di Persiapan, lewati.

2. Buka folder di Antigravity, jalankan npm install dan npm run dev.

3. Buat proyek baru di Firebase console, lalu salin link proyeknya dari kolom alamat browser.

4. Kirim **Prompt 1**: sambungkan App 3 ke proyek Firebase itu.

5. Kirim **Prompt 2**: buat database Firestore dan isi *seed data*.

6. Kirim **Prompt 3**: pastikan semua fitur CRUD terhubung ke database.

7. Uji tambah, ubah, dan hapus data. Cek hasilnya di konsol Firestore.

8. Kirim **Prompt 4**: buat Firebase Auth dan sambungkan ke halaman Masuk.

**Cara menyalin link proyek Firebase (langkah 3).** Buka proyekmu di console.firebase.google.com. Salin alamat di kolom alamat browser. Bentuknya seperti ini:

https\://console.firebase.google.com/project/ID-PROYEKMU/overview

**Cara menguji langkah 7\.** Lakukan satu per satu, lalu buka **Firestore Database** di konsol Firebase dan pastikan datanya ikut berubah.

| Fitur | Yang dilakukan | Yang terlihat di konsol Firestore |
| :---- | :---- | :---- |
| Presensi | Klik Catat Masuk | Dokumen baru di koleksi presensi |
| Ajukan Cuti | Kirim pengajuan baru | Dokumen baru di pengajuan\_cuti berstatus menunggu |
| Persetujuan Cuti | Setujui satu pengajuan | status berubah menjadi disetujui |
| Profil | Ubah nama | *Field* nama di dokumen users berubah |

**Bila agen meminta pengaturan di konsol (langkah 8).** Buka **Authentication › Sign-in method**, aktifkan **Email/Password** dan **Google**. Di **Authentication › Settings › Authorized domains**, pastikan localhost ada. Bila belum ada, tambahkan.

**Titik periksa mentor:** menit 35 (data CRUD tersimpan di Firestore) dan menit 70 (daftar dan masuk berjalan).

**Cek hasil:**

☐ App 3 tersambung ke proyek Firebase milikmu.

☐ Database berisi *seed data*.

☐ Tambah, ubah, dan hapus data terlihat di konsol Firestore.

☐ Daftar dengan email dan masuk dengan Google sama-sama berhasil.

## **Praktik 2: Halaman Sesuai Peran dan Tayang**

**Target:** setiap pengguna punya peran, diarahkan ke halaman sesuai perannya, ditolak di halaman di luar perannya, dan App 3 bisa dibuka dari alamat publik.

**Bahan dari Sesi 5\.** Buka peta route di Canva board kelompokmu. Kolom Status dan Saat ditolak menjadi isi Prompt 9 dan 10\.

**Tokoh yang dipakai untuk uji:**

| Tokoh | Cara masuk | Peran |
| :---- | :---- | :---- |
| Dina | Daftar dengan email dina@sedap.id | karyawan |
| Nisa | Masuk dengan akun Google milikmu sendiri | karyawan |
| Bu Wulan | Daftar dengan email wulan@sedap.id, lalu dinaikkan agen lewat Firebase MCP | hrd |

**Langkah:**

1. Kirim **Prompt 5**: buat dokumen users saat pertama masuk.

2. Masuk dua kali dengan akun yang sama. Buka koleksi users di konsol: dokumennya terbentuk dan tidak tertimpa.

3. Daftar sebagai wulan@sedap.id lewat /daftar, lalu kirim **Prompt 6**.

4. Kirim **Prompt 7**: nama dan peran di bilah atas.

5. Kirim **Prompt 8**: pengalihan setelah masuk.

6. Kirim **Prompt 9** dan **Prompt 10**: *route guard* karyawan dan HRD.

7. Jalankan keenam uji di tabel bawah.

8. Tayangkan ke Netlify, lalu daftarkan domainnya di Firebase.

**Kenapa Bu Wulan mendaftar dulu (langkah 3)?** Firebase MCP bisa membaca dan mengubah pengguna yang sudah ada, tetapi tidak bisa membuat akun baru di Authentication. Jadi akun dibuat lewat halaman Daftar, lalu agen hanya mengubah role di dokumen users.

**Daftar pengujian.** Selalu ketik alamatnya langsung di kolom alamat browser. Membuka lewat menu tidak membuktikan halaman terjaga.

| No | Akun | Yang dilakukan | Hasil yang benar |
| :---- | :---- | :---- | :---- |
| 1 | Belum masuk | Buka /beranda | Dialihkan ke /masuk |
| 2 | Dina (karyawan) | Masuk | Tiba di /beranda |
| 3 | Dina (karyawan) | Ketik /admin/karyawan | Muncul “Akses Ditolak” |
| 4 | Bu Wulan (HRD) | Masuk | Tiba di /admin |
| 5 | Bu Wulan (HRD) | Muat ulang /admin | Tetap terbuka, tidak sempat menampilkan “Akses Ditolak” |
| 6 | Sudah masuk | Buka /masuk | Dialihkan sesuai peran |

Uji 3 dan 5 paling sering gagal. Bila uji 5 gagal, periksa bagian “Memuat…” di Prompt 10\.

**Menayangkan ke Netlify (langkah 8).** Ikuti dokumen **Panduan Menayangkan App 3 ke Netlify**. Cara yang disarankan adalah meminta agen menayangkan lewat Netlify CLI, karena kamu tidak perlu repo GitHub sendiri. Setelah tayang:

1. Di konsol Firebase, buka **Authentication › Settings › Authorized domains**, lalu tambahkan alamat Netlify-mu, misalnya portal-namamu.netlify.app. Tanpa langkah ini, login Google gagal dengan pesan auth/unauthorized-domain.

2. Ulangi uji 2 dan 4 di alamat Netlify.

**Titik periksa mentor:** menit 30 (peran tersimpan, akun HRD siap), menit 60 (karyawan ditolak di /admin), menit 90 (login Google berjalan di alamat publik).

**Cek hasil:**

☐ Setiap pengguna punya dokumen users/{uid} tanpa kata sandi.

☐ Bu Wulan berperan hrd.

☐ Keenam uji lolos di localhost.

☐ Uji 2 dan 4 lolos di alamat Netlify.

## **Setelah Sesi**

**Eksplorasi di rumah.** *Route guard* menjaga halaman, tetapi data di Firestore belum ikut terjaga. Saat ini database masih memakai aturan mode uji. Cari tahu tiga hal ini. Hasilnya dibahas di awal sesi berikutnya.

1. Masuk sebagai Dina. Bisakah kode di aplikasi membaca dokumen users milik Bu Wulan?

2. Buka tab **Rules** di Firestore proyekmu. Aturan apa yang berlaku sekarang?

3. Tulis satu aturan: karyawan hanya boleh membaca dokumen users miliknya sendiri.

**Refleksi.** Jawab dengan satu kalimat untuk setiap pertanyaan.

1. Kenapa peran disimpan di dokumen users, bukan di Firebase Auth?

2. Apa yang terjadi bila *route guard* tidak menunggu peran selesai dibaca?

3. Bagian mana yang paling sulit hari ini, dan apa yang membantumu?

**Simpan untuk sesi berikutnya:** folder app3-portal-hris di laptop, proyek Firebase, dan alamat Netlify. Jangan dihapus.

## **Masalah yang Sering Terjadi**

| Gejala | Penyebab | Cara memperbaiki |
| :---- | :---- | :---- |
| git bukan perintah yang dikenal | Git belum terpasang | Pasang Git dari git-scm.com, buka ulang terminal, atau pakai Cara 2 dan 3 |
| Agen bekerja di proyek Firebase lain | Agen belum tahu proyek yang dimaksud | Kirim ulang Prompt 1 dengan link proyekmu, minta agen fokus ke proyek itu |
| Fitur CRUD gagal menyimpan | Aturan Firestore belum mode uji, atau fitur masih memakai data contoh | Periksa tab **Rules**, lalu kirim ulang Prompt 3 |
| Login Google gagal di laptop | localhost belum terdaftar | Tambahkan localhost di **Authorized domains** |
| Login Google gagal dengan pesan auth/unauthorized-domain di Netlify | Alamat Netlify belum terdaftar | Tambahkan alamat Netlify di **Authorized domains** |
| Agen tidak bisa membuat akun Bu Wulan | Firebase MCP tidak bisa membuat akun baru | Daftarkan wulan@sedap.id lewat /daftar dulu, lalu kirim Prompt 6 |
| Bu Wulan masih diarahkan ke /beranda | Peran lama masih terbaca | Keluar, lalu masuk lagi |
| Peran HRD kembali menjadi karyawan setelah masuk ulang | Prompt 5 menimpa dokumen yang sudah ada | Minta agen memperbaiki: “Bila dokumen sudah ada, jangan diubah” |
| HRD sempat melihat “Akses Ditolak” saat memuat ulang | *Route guard* memutuskan sebelum role terbaca | Pastikan bagian “Memuat…” di Prompt 10 terpasang |
| Dokumen users berisi *field* kata sandi | Agen menyimpan isi formulir apa adanya | Minta agen menghapus *field* itu, lalu hapus juga di konsol |

## **Daftar Periksa Akhir**

☐ App 3 tersambung ke Firebase, dan semua fitur CRUD tersimpan di Firestore.

☐ Login email dan Google berjalan di localhost dan di alamat Netlify.

☐ Setiap pengguna punya dokumen users/{uid} tanpa kata sandi.

☐ Akun HRD pertama berperan hrd.

☐ Karyawan tiba di /beranda, HRD tiba di /admin.

☐ Keenam uji lolos.

## **Koleksi Prompt**

Salin prompt sesuai nomornya. Kirim satu per satu, baca *diff*, uji, baru lanjut ke prompt berikutnya.

| Prompt | Dipakai di | Tujuan |
| :---- | :---- | :---- |
| Clone | Persiapan, cara 3 | Agen meng-*clone* repository App 3 |
| 1 | Praktik 1 | Menyambungkan App 3 ke proyek Firebase |
| 2 | Praktik 1 | Membuat database dan *seed data* |
| 3 | Praktik 1 | Memastikan fitur CRUD tersimpan di Firestore |
| 4 | Praktik 1 | Memasang login email dan Google |
| 5 | Praktik 2 | Membuat dokumen users saat pertama masuk |
| 6 | Praktik 2 | Menjadikan Bu Wulan HRD lewat Firebase MCP |
| 7 | Praktik 2 | Menampilkan nama dan peran di bilah atas |
| 8 | Praktik 2 | Mengarahkan pengguna setelah masuk |
| 9 | Praktik 2 | Menjaga halaman karyawan |
| 10 | Praktik 2 | Menjaga halaman HRD |
| Tayang | Praktik 2 | Menayangkan ke Netlify, ada di Panduan Netlify |

**Prompt Clone: clone repository App 3**

Clone repository https\://github.com/rohmatramadhan/app3-portal-hris ke folder yang sedang terbuka ini. Jangan mengubah file apa pun. Setelah selesai, tunjukkan daftar file di dalamnya.

**Prompt 1: sambungkan App 3 ke proyek Firebase.** Ganti link dengan link proyek Firebase milikmu.

Ini proyek Firebase untuk App 3: https\://console.firebase.google.com/project/ID-PROYEKMU/overview. Pakai Firebase MCP dan fokus hanya ke proyek ini. Daftarkan aplikasi web di proyek ini, ambil konfigurasinya, isi .env.local, lalu sambungkan lib/firebase.js. Jangan mengubah tampilan halaman.

**Prompt 2: buat database dan seed data**

Buat database Cloud Firestore di proyek ini dengan aturan mode uji sementara. Lalu isi seed data: 5 karyawan di koleksi users, catatan presensi bulan ini, dan 6 pengajuan cuti dengan status menunggu, disetujui, dan ditolak. Nama koleksi dan field harus sama persis dengan PRD.

**Prompt 3: pastikan fitur CRUD terhubung**

Periksa semua fitur CRUD di App 3: catat presensi, ajukan cuti, setujui atau tolak cuti, ubah profil, dan ubah data karyawan. Pastikan semuanya membaca dan menulis ke Firestore, bukan data contoh. Perbaiki yang belum tersambung, lalu laporkan daftar fitur beserta statusnya.

**Prompt 4: login email dan Google**

Siapkan Firebase Authentication di proyek ini dengan dua cara masuk: email dan kata sandi, serta akun Google. Sambungkan ke halaman /daftar dan /masuk. Bila ada pengaturan yang harus aku nyalakan sendiri di konsol Firebase, beri tahu langkahnya.

**Prompt 5: dokumen users saat pertama masuk**

Setelah pengguna berhasil masuk dengan cara apa pun, cek dokumen users/{uid} di Firestore. Bila belum ada, buat dokumen berisi nama, email, dan role "karyawan". Bila sudah ada, jangan diubah. Jangan simpan kata sandi di dokumen ini.

**Prompt 6: akun HRD pertama.** Daftarkan dulu wulan@sedap.id lewat /daftar.

Pakai Firebase MCP. Cari pengguna di Firebase Authentication dengan email wulan@sedap.id, lalu ambil uid-nya. Ubah field role di dokumen users/{uid} menjadi "hrd". Jangan membuat akun baru, jangan mengubah field lain, dan jangan menyimpan kata sandi di Firestore. Setelah selesai, tunjukkan isi dokumennya.

**Prompt 7: nama dan peran di bilah atas**

Tampilkan nama dan peran pengguna yang sedang masuk di bilah atas setiap halaman, dibaca dari dokumen users/{uid}. Tambahkan tombol Keluar yang mengarahkan ke /masuk.

**Prompt 8: pengalihan setelah masuk**

Setelah pengguna berhasil masuk, baca role dari users/{uid}. Arahkan role "karyawan" ke /beranda dan role "hrd" ke /admin. Pengguna yang sudah masuk lalu membuka /masuk atau /daftar juga diarahkan dengan aturan yang sama.

**Prompt 9: route guard halaman karyawan**

Pasang route guard untuk /beranda, /presensi, /cuti, /profil, dan halaman turunannya. Pengguna yang belum masuk diarahkan ke /masuk?kembali=\<alamat asal\>. Karyawan dan HRD boleh membuka halaman ini.

**Prompt 10: route guard halaman HRD**

Pasang route guard untuk semua alamat /admin. Hanya role "hrd" yang boleh membuka. Selain HRD, tampilkan halaman Akses Ditolak. Pengguna yang belum masuk diarahkan ke /masuk. Selama role belum selesai dibaca dari users/{uid}, tampilkan layar Memuat... dan jangan memutuskan apa pun.