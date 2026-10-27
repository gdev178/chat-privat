File Khusus Database Supabase

Buat folder "supabase/" yang berisi seluruh file untuk konfigurasi dan setup database.

Struktur yang diwajibkan:

supabase/
├── schema.sql
├── seed.sql
├── policies.sql
├── functions/
│   └── redeem-access-code/
│       └── index.ts
└── README.md

Ketentuan setiap file:

1. "schema.sql"
   
   - Membuat seluruh tabel database, relasi foreign key, constraint, indeks, dan trigger yang diperlukan.
   - Menyiapkan struktur profiles, access_codes, conversations, dan messages.

2. "seed.sql"
   
   - Berisi data awal opsional untuk kebutuhan pengujian.
   - Jangan memasukkan kredensial asli atau kode akses produksi.
   - Jangan membuat akun admin menggunakan password bawaan yang tidak aman.

3. "policies.sql"
   
   - Berisi seluruh konfigurasi Row Level Security (RLS), policy SELECT, INSERT, UPDATE, dan DELETE sesuai kebutuhan setiap role.
   - Pastikan pengguna tidak bisa mengakses percakapan pengguna lain atau mengubah role menjadi admin.

4. "functions/redeem-access-code/index.ts"
   
   - Berisi Supabase Edge Function untuk memvalidasi dan menukarkan kode akses menjadi sesi autentikasi pengguna.
   - Validasi kode dilakukan di backend.
   - Gunakan kode acak yang aman, hash kode saat disimpan, batasi percobaan, dan cegah penggunaan ulang yang tidak sah.
   - Jangan pernah mengekspos service role key ke frontend.

5. "README.md"
   
   - Berisi panduan setup Supabase dari awal.
   - Jelaskan urutan menjalankan file SQL.
   - Jelaskan konfigurasi environment variables dan deployment Edge Functions.
   - Jelaskan cara membuat akun admin pertama secara aman.
   - Sertakan langkah pengujian login, pembuatan akun pengguna, RLS, dan realtime.

Semua file harus berisi implementasi yang lengkap dan saling sesuai, bukan hanya contoh atau placeholder SQL.

Pastikan database dapat dibuat dari project Supabase kosong mengikuti dokumentasi README tanpa harus menyusun query tambahan secara manual. Jika ada konfigurasi yang hanya bisa dilakukan melalui Dashboard Supabase, jelaskan langkahnya secara spesifik.

Jangan menaruh secret key, password asli, atau kredensial produksi di dalam file SQL yang akan dibagikan.