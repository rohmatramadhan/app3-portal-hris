# **Instruksi Praktik Sesi 6: Login Berdasarkan Peran di App 3**

Bootcamp AI Web Programming · Sesi 6 · Oktober 2026

## **Konteks: Apa yang Kita Bangun Hari Ini?**

Di Sesi 5 kamu membedah PRD App 3: Portal HRIS Sedap menjadi matriks akses, peta route, dan peta state di Canva board kelompok. Hari ini rancangan itu mulai menjadi aplikasi sungguhan.

**Situasinya.** Mentor sudah menyiapkan *codebase* App 3 di GitHub. Semua halaman sudah ada dan tampilannya sudah jadi. Tetapi aplikasi ini belum bisa membedakan siapa penggunanya: belum ada login, belum ada peran, dan halaman HRD bisa dibuka siapa saja dengan mengetik /admin.

**Tugasmu hari ini** adalah membuat App 3 mengenali penggunanya dan memperlakukannya sesuai peran:

1. Pengguna bisa masuk dengan email dan sandi, atau dengan akun Google.

2. Setiap pengguna punya dokumen di koleksi users yang menyimpan perannya.

3. Karyawan diarahkan ke /beranda, HRD diarahkan ke /admin.

4. Karyawan yang mengetik alamat /admin ditolak.

5. Aplikasi tayang di alamat publik, dan hasil kerjamu diserahkan lewat *pull request*.

**Posisi praktik ini dalam bootcamp.**

1. **Sesi 4:** kamu mengenal *authentication*, *authorization*, dan matriks akses.

2. **Sesi 5:** kamu menyusun peta route dan peta state App 3 dari PRD.

3. **Sesi 6 (hari ini):** login, peran, pengalihan, dan *route guard* dipasang di App 3\.

4. **Sesi berikutnya:** data di Firestore dikunci dengan *security rules*.

## **Tujuan dan Alur Praktik**

Hari ini ada satu persiapan dan dua praktik. Setiap bagian memakai hasil bagian sebelumnya, jadi kerjakan berurutan.

| Bagian | Hasil yang dicapai | Waktu | Branch |
| :---- | :---- | :---- | :---- |
| Persiapan | App 3 tampil di laptopmu, kamu sudah di branch baru | 20 menit, pagi | praktik-1-login |
| Praktik 1 | Login email dan Google berjalan, profil tersimpan, akun HRD pertama siap | 70 menit, pagi | praktik-1-login |
| Praktik 2 | Pengguna diarahkan dan dijaga sesuai peran, aplikasi tayang | 90 menit, siang | praktik-2-halaman-peran |
| Setelah sesi | Trainer mereview *pull request*, kamu mengerjakan eksplorasi | Di rumah | Sama |

## **Bahan yang Dipakai**

| Bahan | Dipakai untuk | Di mana |
| :---- | :---- | :---- |
| PRD App 3: Portal HRIS Sedap | Rujukan halaman, peran, dan data | Dibagikan di Sesi 5 |
| Canva board kelompok Sesi 5 | Peta route sebagai isi *route guard* | Board kelompokmu |
| Repo starter App 3 | *Codebase* awal | Tautan dari mentor |
| Proyek Firebase milikmu | Login dan database | console.firebase.google.com |
| Antigravity dengan Firebase MCP | Agen AI yang bisa langsung bekerja di proyek Firebase | Laptopmu |
| Akun GitHub dan Netlify | Menyimpan kode dan menayangkan aplikasi | github.com dan netlify.com |
| Slide prompt di deck Sesi 6 | Prompt siap salin | Ditampilkan mentor |

**Istilah yang dipakai di instruksi ini.**

* ***Repository*** (repo): folder proyek beserta seluruh riwayat perubahannya.

* ***Clone***: menyalin repo dari GitHub ke laptop.

* ***Branch***: jalur kerja terpisah. Perubahan di branch tidak langsung masuk ke main.

* ***Commit***: menyimpan satu titik perubahan beserta catatannya.

* ***Push***: mengirim *commit* dari laptop ke GitHub.

* ***Pull request*** (PR): permintaan agar branch digabung ke main, diperiksa orang lain dulu.

* ***Diff***: daftar baris kode yang berubah. Merah berarti dihapus, hijau berarti ditambah.

* ***MCP*** (*Model Context Protocol*): penghubung yang membuat agen AI bisa memakai layanan lain, misalnya membuat akun di Firebase.

## **Aturan Bekerja dengan Agen AI**

Aturan ini berlaku di kedua praktik. Mentor menolak hasil kerja yang melanggarnya.

1. **Satu prompt, satu pekerjaan.** Kirim prompt sesuai urutan nomornya. Jangan menggabungkan dua prompt.

2. **Baca *diff* sebelum menerima.** Pastikan hanya file yang berhubungan dengan prompt yang berubah.

3. **Uji setelah setiap prompt.** Jangan lanjut ke prompt berikutnya sebelum hasilnya benar.

4. **Ikuti PRD.** Nama koleksi (users, presensi, pengajuan\_cuti), nama field, dan alamat halaman tidak boleh diganti agen.

5. **Kata sandi tidak pernah disimpan di Firestore.** Kata sandi hanya ada di Firebase Authentication.

## **Persiapan: Mengambil Codebase App 3**

**Langkah:**

1. Buka tautan repo starter dari mentor, klik **Use this template**, lalu **Create a new repository**.

2. Beri nama repo app3-portal-hris, lalu buat.

3. Di repo milikmu, buka **Settings › Collaborators**, undang akun GitHub trainer.

4. Buka terminal di Antigravity, lalu jalankan perintah di bawah satu per satu. Ganti namamu dengan nama akun GitHub-mu.

5. Salin .env.local.example menjadi .env.local, lalu isi dengan konfigurasi dari konsol Firebase: **Project settings › General › Your apps › SDK setup and configuration**.

6. Jalankan npm run dev, buka localhost:3000. Halaman Masuk harus tampil.

7. Pastikan Firebase MCP di Antigravity tersambung ke proyek Firebase-mu.

8. Buat branch untuk Praktik 1\.

git clone https\://github.com/namamu/app3-portal-hris.git  
cd app3-portal-hris  
npm install  
cp .env.local.example .env.local  
npm run dev  
git checkout \-b praktik-1-login

**Cek hasil:**

☐ App 3 tampil di localhost:3000, dan semua menu bisa dibuka.

☐ Perintah git branch menunjukkan tanda \* di praktik-1-login.

☐ Trainer sudah tercantum di daftar *collaborator*.

## **Praktik 1: Login dengan Email dan Google**

**Target:** dua akun bisa masuk ke App 3 dengan peran berbeda. Contoh tokoh yang dipakai:

| Tokoh | Cara masuk | Peran |
| :---- | :---- | :---- |
| Dina | Daftar dengan email dina@sedap.id | karyawan |
| Nisa | Masuk dengan akun Google milikmu sendiri | karyawan |
| Bu Wulan | Dibuat agen lewat Firebase MCP, email wulan@sedap.id | hrd |

**Langkah:**

1. Di konsol Firebase, buka **Authentication › Sign-in method**. Aktifkan **Email/Password** dan **Google**.

2. Pastikan kamu berada di branch praktik-1-login.

3. Kirim **Prompt 1**. Baca *diff*, lalu uji: daftar sebagai Dina, keluar, lalu masuk lagi.

4. Kirim **Prompt 2**. Baca *diff*.

5. Uji: masuk dengan Google, lalu masuk dua kali dengan akun yang sama. Buka Firestore di konsol: dokumen users/{uid} terbentuk dan tidak tertimpa.

6. Kirim **Prompt 3**. Buka konsol Firebase: akun Bu Wulan ada di Authentication, dokumennya ada di koleksi users tanpa field kata sandi.

7. Kirim **Prompt 4**. Masuk sebagai Dina lalu Bu Wulan. Nama dan peran tampil di bilah atas.

8. *Commit*, *push*, lalu buka *pull request* ke main.

**Prompt 1: halaman Daftar dan Masuk**

Baca PRD App 3 bagian 4.1. Pasang Firebase Authentication dengan dua cara masuk: email dan kata sandi, serta akun Google. Sambungkan ke halaman /daftar dan /masuk yang sudah ada. Jangan mengubah tampilan halaman lain.

**Prompt 2: profil saat pertama masuk**

Setelah pengguna berhasil masuk dengan cara apa pun, cek dokumen users/{uid} di Firestore. Bila belum ada, buat dokumen berisi nama, email, dan role "karyawan". Bila sudah ada, jangan diubah. Jangan simpan kata sandi di dokumen ini.

**Prompt 3: akun HRD pertama lewat Firebase MCP**

Pakai Firebase MCP untuk membuat akun HRD pertama di proyek Firebase ini. Buat pengguna di Firebase Authentication dengan email wulan@sedap.id dan kata sandi Sedap\#2026. Ambil uid-nya, lalu buat dokumen users/{uid} berisi nama "Wulan", email "wulan@sedap.id", dan role "hrd". Jangan simpan kata sandi di Firestore.

**Prompt 4: nama dan peran di bilah atas**

Tampilkan nama dan peran pengguna yang sedang masuk di bilah atas setiap halaman, dibaca dari dokumen users/{uid}. Tambahkan tombol Keluar yang mengarahkan ke /masuk.

**Menyerahkan Praktik 1\.** Jalankan perintah berikut, lalu buka GitHub.

git add .  
git commit \-m "Tambah login email dan Google"  
git push \-u origin praktik-1-login

Di GitHub, klik **Compare & pull request**. Pastikan arahnya base: main ← compare: praktik-1-login. Isi judul dan deskripsi seperti contoh di bawah, pilih trainer sebagai *reviewer*, lalu klik **Create pull request**. Jangan *merge* sendiri.

| Bagian | Contoh isi |
| :---- | :---- |
| Judul | Praktik 1: login email dan Google |
| Yang dikerjakan | Halaman Daftar dan Masuk, profil di users/{uid}, akun HRD pertama, nama dan peran di bilah atas |
| Cara menguji | Masuk sebagai dina@sedap.id dan wulan@sedap.id |

**Titik periksa mentor:** menit 35 (profil terbentuk) dan menit 70 (akun HRD siap, PR terbuka).

**Cek hasil:**

☐ Daftar dengan email dan masuk dengan Google sama-sama berhasil.

☐ Masuk ulang dengan akun yang sama tidak menimpa profil.

☐ Bu Wulan berperan hrd, dan dokumen users tidak berisi kata sandi.

☐ Nama dan peran tampil di bilah atas.

☐ *Pull request* Praktik 1 terbuka dengan trainer sebagai *reviewer*.

## **Praktik 2: Halaman Sesuai Peran dan Tayang**

**Target:** pengguna diarahkan ke halaman sesuai perannya, halaman di luar perannya ditolak, dan App 3 bisa dibuka dari alamat publik.

**Bahan dari Sesi 5\.** Buka peta route di Canva board kelompokmu. Kolom Status dan Saat ditolak menjadi isi Prompt 6 dan 7\. Bila peta route kelompokmu berbeda dari prompt, ikuti PRD 6.2 dan 6.3.

**Langkah:**

1. Buat branch baru dari branch Praktik 1\. Trainer belum *merge*, jadi jangan mulai dari main.

2. Kirim **Prompt 5**. Baca *diff*, uji dengan akun Dina dan Bu Wulan.

3. Kirim **Prompt 6**. Uji: keluar, lalu ketik /presensi di kolom alamat.

4. Kirim **Prompt 7**. Uji: masuk sebagai Bu Wulan, buka /admin, lalu muat ulang halaman.

5. Jalankan keenam uji di tabel bawah.

6. Tayangkan ke Netlify, lalu daftarkan alamatnya di Firebase.

7. Ulangi uji 2 dan 4 di alamat publik.

8. *Commit*, *push*, lalu buka *pull request* ke main.

git checkout \-b praktik-2-halaman-peran

**Prompt 5: pengalihan setelah masuk**

Setelah pengguna berhasil masuk, baca role dari users/{uid}. Arahkan role "karyawan" ke /beranda dan role "hrd" ke /admin. Pengguna yang sudah masuk lalu membuka /masuk atau /daftar juga diarahkan dengan aturan yang sama.

**Prompt 6: route guard halaman karyawan**

Pasang route guard untuk /beranda, /presensi, /cuti, /profil, dan halaman turunannya. Pengguna yang belum masuk diarahkan ke /masuk?kembali=\<alamat asal\>. Karyawan dan HRD boleh membuka halaman ini.

**Prompt 7: route guard halaman HRD**

Pasang route guard untuk semua alamat /admin. Hanya role "hrd" yang boleh membuka. Selain HRD, tampilkan halaman Akses Ditolak. Pengguna yang belum masuk diarahkan ke /masuk. Selama role belum selesai dibaca dari users/{uid}, tampilkan layar Memuat... dan jangan memutuskan apa pun.

**Daftar pengujian.** Selalu ketik alamatnya langsung di kolom alamat browser. Membuka lewat menu tidak membuktikan halaman terjaga.

| No | Akun | Yang dilakukan | Hasil yang benar |
| :---- | :---- | :---- | :---- |
| 1 | Belum masuk | Buka /beranda | Dialihkan ke /masuk |
| 2 | Dina (karyawan) | Masuk | Tiba di /beranda |
| 3 | Dina (karyawan) | Ketik /admin/karyawan | Muncul “Akses Ditolak” |
| 4 | Bu Wulan (HRD) | Masuk | Tiba di /admin |
| 5 | Bu Wulan (HRD) | Muat ulang /admin | Tetap terbuka, tidak sempat menampilkan “Akses Ditolak” |
| 6 | Sudah masuk | Buka /masuk | Dialihkan sesuai peran |

Uji 3 dan 5 paling sering gagal. Bila uji 5 gagal, periksa bagian “Memuat…” di Prompt 7\.

**Menayangkan ke Netlify.**

1. Masuk ke Netlify, klik **Add new site › Import an existing project**, pilih GitHub, lalu pilih repo app3-portal-hris.

2. Pada pilihan **Branch to deploy**, pilih praktik-2-halaman-peran.

3. Di **Environment variables**, masukkan keenam variabel dari .env.local.

4. Klik **Deploy**. Catat alamatnya, misalnya portal-namamu.netlify.app.

5. Di konsol Firebase, buka **Authentication › Settings › Authorized domains**, lalu tambahkan alamat Netlify itu. Tanpa langkah ini, login Google gagal dengan pesan auth/unauthorized-domain.

**Menyerahkan Praktik 2\.**

git add .  
git commit \-m "Tambah pengalihan dan route guard"  
git push \-u origin praktik-2-halaman-peran

Buka *pull request* ke main dengan trainer sebagai *reviewer*. Tulis alamat Netlify di deskripsi. PR ini juga memuat perubahan Praktik 1 sampai trainer *merge* PR pertama. Setelah itu, PR kedua otomatis hanya menampilkan perubahan Praktik 2\.

**Titik periksa mentor:** menit 30 (pengalihan berjalan), menit 60 (karyawan ditolak di /admin), menit 90 (login Google berjalan di alamat publik).

**Cek hasil:**

☐ Keenam uji lolos di localhost.

☐ Uji 2 dan 4 lolos di alamat Netlify.

☐ *Pull request* Praktik 2 terbuka dengan alamat Netlify di deskripsi.

## **Setelah Sesi**

**Review dari trainer.** Trainer mereview kedua *pull request* di rumah. Bila trainer meminta perbaikan, kerjakan di branch yang sama, lalu *commit* dan *push* lagi. *Pull request* ikut diperbarui otomatis. Trainer yang melakukan *merge* setelah semuanya benar.

**Eksplorasi di rumah.** *Route guard* menjaga halaman, tetapi data di Firestore belum ikut terjaga. Cari tahu tiga hal ini. Hasilnya dibahas di awal sesi berikutnya.

1. Masuk sebagai Dina. Bisakah kode di aplikasi membaca dokumen users milik Bu Wulan?

2. Buka tab **Rules** di Firestore proyekmu. Aturan apa yang berlaku sekarang?

3. Tulis satu aturan: karyawan hanya boleh membaca dokumen users miliknya sendiri.

**Refleksi.** Jawab dengan satu kalimat untuk setiap pertanyaan.

1. Kenapa peran disimpan di dokumen users, bukan di Firebase Auth?

2. Apa yang terjadi bila *route guard* tidak menunggu peran selesai dibaca?

3. Bagian mana yang paling sulit hari ini, dan apa yang membantumu?

**Simpan untuk sesi berikutnya:** repo app3-portal-hris, proyek Firebase, dan alamat Netlify. Jangan dihapus.

## **Masalah yang Sering Terjadi**

| Gejala | Penyebab | Cara memperbaiki |
| :---- | :---- | :---- |
| Login Google gagal dengan pesan auth/unauthorized-domain | Alamat situs belum terdaftar | Tambahkan alamat di **Authentication › Settings › Authorized domains** |
| Bu Wulan masih diarahkan ke /beranda | Peran lama masih terbaca | Keluar, lalu masuk lagi |
| Peran HRD kembali menjadi karyawan setelah masuk ulang | Prompt 2 menimpa dokumen yang sudah ada | Minta agen memperbaiki: “Bila dokumen sudah ada, jangan diubah” |
| HRD sempat melihat “Akses Ditolak” saat memuat ulang | *Route guard* memutuskan sebelum role terbaca | Pastikan bagian “Memuat…” di Prompt 7 terpasang |
| Dokumen users berisi field kata sandi | Agen menyimpan isi formulir apa adanya | Minta agen menghapus field itu, lalu hapus juga di konsol |
| Agen tidak bisa membuat akun lewat Firebase MCP | MCP belum tersambung ke proyek yang benar | Periksa pengaturan Firebase MCP di Antigravity |
| git push ditolak | Belum masuk ke GitHub di terminal, atau repo bukan milikmu | Periksa alamat repo dengan git remote \-v |
| Trainer tidak muncul di pilihan *reviewer* | Trainer belum menerima undangan *collaborator* | Minta trainer menerima undangan, lalu pilih ulang |

## **Daftar Periksa Akhir**

☐ Login email dan Google berjalan di localhost dan di alamat Netlify.

☐ Setiap pengguna punya dokumen users/{uid} tanpa kata sandi.

☐ Akun HRD pertama dibuat lewat Firebase MCP.

☐ Karyawan tiba di /beranda, HRD tiba di /admin.

☐ Keenam uji lolos.

☐ Dua *pull request* terbuka dengan trainer sebagai *reviewer*.