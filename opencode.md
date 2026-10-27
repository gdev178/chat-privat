Prompt: Aplikasi Live Chat Admin & Pengguna

Buat aplikasi live chat sederhana berbasis web menggunakan HTML, CSS, JavaScript Vanilla, Tailwind CSS, dan Supabase sebagai backend. Aplikasi harus memiliki desain modern, minimalis, responsif, dan mudah digunakan di desktop maupun perangkat mobile.

1. Teknologi

- HTML5 untuk struktur halaman.
- Tailwind CSS untuk styling.
- JavaScript Vanilla untuk logika frontend.
- Supabase Auth untuk autentikasi.
- Supabase PostgreSQL untuk database.
- Supabase Realtime untuk mengirim dan menerima pesan secara langsung.
- Supabase Edge Functions untuk proses pembuatan akun pengguna dan penukaran kode akses secara aman jika diperlukan.

Jangan menggunakan React, Vue, Next.js, Laravel, atau framework frontend lainnya. Aplikasi harus dapat berjalan sebagai frontend statis.

2. Sistem Login Satu Halaman

Buat hanya satu halaman login untuk admin dan pengguna. Tidak boleh ada halaman registrasi publik.

Sistem harus menentukan role pengguna berdasarkan identitas akun yang berhasil diautentikasi, bukan berdasarkan input role dari frontend.

Admin

- Admin menggunakan akun yang sudah dibuat dan dikonfigurasi secara aman.
- Setelah login berhasil, sistem memeriksa role admin dari database.
- Jika role adalah admin, arahkan ke dashboard admin.

Pengguna

- Akun pengguna hanya dapat dibuat oleh admin.
- Admin dapat membuat akun pengguna melalui dashboard.
- Setiap akun pengguna memperoleh kode akses acak yang unik dan sulit ditebak.
- Pengguna memasukkan kode akses pada halaman login yang sama.
- Backend memvalidasi kode, memeriksa status aktif dan masa berlaku, kemudian mengautentikasi pengguna serta membuat sesi login.
- Kode akses tidak boleh langsung digunakan untuk mengakses tabel database.
- Tidak tersedia tombol registrasi atau pembuatan akun mandiri.

Jangan mengandalkan nama pengguna, kode akses, atau nilai role dari frontend sebagai bukti otorisasi. Semua pemeriksaan akses harus dilakukan di backend.

3. Dashboard Admin

Buat dashboard admin yang menyediakan:

- Daftar seluruh pengguna yang telah dibuat.
- Tombol untuk membuat akun pengguna baru.
- Form pembuatan akun berisi nama pengguna dan informasi opsional yang diperlukan.
- Pembuatan kode akses secara kriptografis acak melalui backend.
- Tampilan kode akses setelah akun berhasil dibuat, dengan tombol salin.
- Daftar percakapan pengguna dengan admin.
- Indikator pesan belum dibaca.
- Waktu pesan terakhir dan status online jika tersedia.
- Fitur membuka percakapan dengan pengguna tertentu.
- Fitur menonaktifkan akun dan mencabut kode akses.
- Fitur membuat ulang kode akses jika diperlukan.
- Tombol logout.

Admin dapat melayani banyak pengguna, tetapi setiap percakapan harus terpisah berdasarkan identitas pengguna.

4. Dashboard Pengguna

Setelah pengguna berhasil login:

- Langsung arahkan ke halaman chat dengan admin.
- Pengguna tidak dapat membuat ruang chat baru.
- Pengguna hanya dapat mengakses percakapan miliknya sendiri dengan admin.
- Pengguna dapat mengirim dan menerima pesan secara realtime.
- Tampilkan riwayat percakapan sebelumnya.
- Tampilkan waktu pengiriman pesan.
- Tampilkan indikator pesan terkirim dan pesan baru jika memungkinkan.
- Sediakan tombol logout.

Tidak boleh ada fitur pencarian pengguna, chat antarpengguna, grup, atau percakapan dengan pengguna lain.

5. Sistem Chat Realtime

Gunakan Supabase Realtime untuk memperbarui pesan secara langsung tanpa refresh halaman.

Ketentuan:

- Pesan disimpan secara permanen di PostgreSQL.
- Pesan baru langsung muncul pada kedua sisi percakapan.
- Urutkan pesan berdasarkan waktu pengiriman.
- Tampilkan bubble chat berbeda untuk pesan admin dan pengguna.
- Gunakan pagination atau pemuatan bertahap untuk riwayat pesan.
- Tangani kondisi koneksi terputus dan sambungkan kembali jika memungkinkan.
- Hindari duplikasi pesan ketika pesan dikirim dan event Realtime diterima.
- Jangan menggunakan polling 5 detik sebagai mekanisme utama.

6. Struktur Database

Rancang skema database Supabase yang mencakup setidaknya:

profiles

- id: UUID yang terhubung dengan Supabase Auth.
- display_name: nama tampilan.
- role: admin atau user.
- is_active: status akun.
- created_at: waktu pembuatan.

access_codes

- id: UUID.
- user_id: UUID pemilik kode.
- code_hash: hash kode akses.
- expires_at: waktu kedaluwarsa opsional.
- used_at: waktu penukaran kode.
- revoked_at: waktu pencabutan.
- created_at: waktu pembuatan.

Kode akses mentah tidak boleh disimpan sebagai teks biasa. Terapkan kebijakan agar kode tidak dapat dipakai ulang secara tidak sah.

conversations

- id: UUID.
- user_id: UUID pengguna.
- admin_id: UUID admin.
- created_at: waktu pembuatan.

Setiap pengguna hanya memiliki satu percakapan pribadi dengan admin utama. Pastikan tidak ada percakapan antarpengguna.

messages

- id: UUID.
- conversation_id: UUID percakapan.
- sender_id: UUID pengirim.
- content: isi pesan teks.
- created_at: waktu pengiriman.
- read_at: waktu pesan dibaca, jika diperlukan.

Buat foreign key, indeks, constraint, serta kebijakan akses yang sesuai. Hindari menyimpan informasi sensitif yang tidak diperlukan.

7. Keamanan Wajib

- Aktifkan Row Level Security (RLS) pada seluruh tabel yang relevan.
- Pengguna hanya dapat membaca percakapan dan pesan miliknya sendiri.
- Pengguna hanya dapat mengirim pesan ke percakapan yang memang menjadi haknya.
- Admin hanya dapat menjalankan tindakan administratif setelah role admin diverifikasi oleh backend.
- Hanya admin berwenang yang dapat membuat akun, menonaktifkan akun, dan mengelola kode akses.
- Jangan pernah menaruh Supabase service_role key atau secret key di frontend.
- Jangan menggunakan kode akses sebagai pengganti sesi autentikasi.
- Terapkan pembatasan percobaan login dan penukaran kode.
- Validasi isi pesan di backend dan batasi panjang pesan.
- Gunakan timestamp dari database.
- Pastikan pengguna tidak dapat mengubah role sendiri menjadi admin.
- Pastikan seluruh operasi sensitif dilakukan melalui backend yang tepercaya.
- Jangan memberikan akses tabel hanya karena pengguna berhasil login.

8. Desain UI/UX

Gunakan gaya desain modern dengan karakteristik:

- Warna utama navy atau biru tua.
- Latar belakang putih atau abu-abu sangat muda.
- Aksen biru untuk tombol utama.
- Tipografi bersih dan mudah dibaca.
- Layout dashboard menggunakan sidebar di desktop.
- Layout chat menyesuaikan layar mobile.
- Bubble chat dengan radius lembut.
- Daftar percakapan menampilkan nama pengguna, cuplikan pesan, dan waktu.
- Loading state, empty state, error state, dan notifikasi sukses.
- Dialog konfirmasi untuk tindakan administratif yang penting.
- Tampilan login sederhana, tanpa pilihan role dan tanpa tombol registrasi.

Desain harus terasa seperti aplikasi layanan pelanggan profesional, bukan sekadar halaman demo.

9. Struktur File

Gunakan struktur file sederhana yang mudah dipelihara, misalnya:

- index.html — halaman login.
- admin.html — dashboard admin.
- chat.html — dashboard chat pengguna.
- assets/css/style.css — styling tambahan jika diperlukan.
- assets/js/supabase.js — inisialisasi Supabase.
- assets/js/auth.js — logika login dan sesi.
- assets/js/admin.js — logika dashboard admin.
- assets/js/chat.js — logika percakapan.
- supabase/schema.sql — skema database, indeks, dan kebijakan RLS.
- supabase/functions/ — Edge Functions untuk autentikasi kode dan operasi administratif.

Tailwind CSS boleh menggunakan CDN untuk prototipe. Untuk implementasi produksi, jelaskan pilihan build Tailwind jika diperlukan.

10. Ketentuan Pengerjaan

1. Analisis kebutuhan dan rancang arsitektur terlebih dahulu.
2. Buat skema SQL lengkap yang bisa dijalankan di Supabase SQL Editor.
3. Implementasikan kebijakan RLS dan proses autentikasi yang aman.
4. Buat seluruh halaman dan file JavaScript yang diperlukan.
5. Pastikan login admin dan pengguna benar-benar berjalan.
6. Pastikan admin dapat membuat akun pengguna dan kode akses.
7. Pastikan kode akses dapat ditukarkan menjadi sesi autentikasi yang valid.
8. Pastikan pesan dapat dikirim, disimpan, dan diterima secara realtime.
9. Uji pemisahan hak akses admin dan pengguna.
10. Berikan panduan konfigurasi Supabase, environment, pembuatan admin pertama, dan deployment frontend statis.

Jangan membuat tombol atau fitur yang hanya bersifat visual. Seluruh fitur utama harus terhubung ke Supabase dan berfungsi.

Jangan mengklaim aplikasi selesai atau aman sebelum implementasi dan pengujian dilakukan.

Jika ada kredensial atau konfigurasi yang belum tersedia, gunakan placeholder yang jelas dan jelaskan cara mengisinya. Jangan pernah mengarang kredensial Supabase.

Target akhir: aplikasi live chat 1v1 yang berfungsi, dengan satu halaman login untuk semua role, tanpa registrasi publik, akun pengguna dikelola admin, dan setiap pengguna hanya dapat mengobrol dengan admin.