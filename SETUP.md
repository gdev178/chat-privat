# Panduan Lengkap Setup Admin & Deployment

## 1. Setup Supabase Project

### A. Buat Project Baru
1. Login ke https://supabase.com
2. Klik "New Project"
3. Isi:
   - Name: `chat-privat`
   - Database Password: [simpan password ini]
   - Region: Southeast Asia (Singapore) - pilih terdekat
4. Tunggu ~2 menit hingga selesai

### B. Dapatkan Kredensial
1. Buka project > Settings > API
2. Salin:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (key panjang)
   - **service_role key**: `eyJhbG...` (JANGAN taruh di frontend!)

## 2. Konfigurasi Database

### A. Jalankan Schema
1. Buka SQL Editor di Supabase Dashboard
2. Klik "New Query"
3. Copy isi file `supabase/schema.sql`
4. Paste dan klik "Run"
5. Tunggu hingga muncul "Success"

### B. Aktifkan RLS Policies
1. Tetap di SQL Editor
2. New Query lagi
3. Copy isi file `supabase/policies.sql`
4. Paste dan Run
5. Verifikasi: Database > Tables > profiles > RLS enabled (harus ada centang hijau)

### C. Aktifkan Realtime
1. Buka Database > Replication
2. Centang tabel:
   - ✅ conversations
   - ✅ messages
3. Klik "Save"

## 3. Buat Admin Pertama

### Metode: Via Dashboard (Paling Mudah & Aman)

1. **Buka Authentication > Users**
2. **Klik "Add user" / "Invite"**
3. **Isi form:**
   - Email: `admin@yourdomain.com` (ganti domain Anda)
   - Password: Gunakan password kuat (min 8 karakter, huruf+angka+simbol)
   - ✅ Auto Confirm User (centang ini!)
4. **Klik "Create user" / "Send"**
5. **Salin User ID** yang muncul (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

6. **Kembali ke SQL Editor**, jalankan query ini:

```sql
-- Ganti USER_ID di bawah dengan ID dari langkah 5
UPDATE public.profiles 
SET 
    role = 'admin',
    display_name = 'Admin',
    is_active = true
WHERE id = 'PASTE_USER_ID_DISINI';

-- Verifikasi berhasil
SELECT id, display_name, role, email 
FROM public.profiles 
WHERE role = 'admin';
```

7. **Seharusnya muncul 1 row dengan role = admin**

## 4. Deploy Edge Function

### Metode A: Via Supabase CLI (Recommended)

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link ke project (akan diminta project ref)
supabase link --project-ref xxxxx

# Deploy function
supabase functions deploy redeem-access-code

# Set environment variables untuk function
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Metode B: Via Dashboard (Lebih Mudah)

1. Buka **Edge Functions** di dashboard
2. Klik **"New Function"** atau **"Deploy new function"**
3. Name: `redeem-access-code`
4. Copy seluruh isi `supabase/functions/redeem-access-code/index.ts`
5. Paste di editor
6. Klik **"Deploy"**
7. Tunggu hingga status jadi "Active"

## 5. Konfigurasi Frontend

### Edit file `assets/js/supabase.js`

Ganti baris 2-3:

```javascript
// SEBELUM (template):
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// SESUDAH (dengan kredensial asli):
const SUPABASE_URL = 'https://abcdefghijk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

## 6. Testing

### Test 1: Login Admin
1. Buka `index.html` di browser
2. Masukkan email admin: `admin@yourdomain.com`
3. Masukkan password yang dibuat tadi
4. Klik "Masuk"
5. Seharusnya redirect ke `admin.html`

### Test 2: Buat User & Kode
1. Di admin panel, klik "Tambah Pengguna"
2. Nama: "Test User"
3. Klik "Buat"
4. Salin kode yang muncul (contoh: `ABCD-EFGH-IJKL-MNOP`)

### Test 3: Login User dengan Kode
1. Buka `index.html` di tab/browser baru (incognito)
2. Paste kode akses ke field "Email / Kode Akses"
3. JANGAN isi password
4. Klik "Masuk"
5. Seharusnya redirect ke `chat.html`

### Test 4: Chat Realtime
1. Admin: buka chat dengan user
2. User: kirim pesan "Halo admin"
3. Admin seharusnya langsung terima tanpa refresh
4. Admin balas
5. User terima langsung

## 7. Deploy ke Hosting

### Opsi 1: Netlify (Gratis)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd C:\Coding\chat-privat
netlify deploy --prod
```

### Opsi 2: Vercel (Gratis)
```bash
npm install -g vercel
cd C:\Coding\chat-privat
vercel --prod
```

### Opsi 3: GitHub Pages
1. Push ke GitHub repo
2. Settings > Pages
3. Source: main branch, / (root)
4. Save

### Opsi 4: Supabase Storage (Simple)
1. Di Supabase, buka Storage
2. Create bucket: `website` (public)
3. Upload semua file HTML, JS, CSS
4. Akses via: `https://xxxxx.supabase.co/storage/v1/object/public/website/index.html`

## 8. Konfigurasi Production

### Update CORS di Supabase
1. Settings > API > CORS
2. Tambahkan domain production:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

### Update Auth Redirect URLs
1. Authentication > URL Configuration
2. Site URL: `https://yourdomain.com`
3. Redirect URLs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/admin.html`
   - `https://yourdomain.com/chat.html`

## Troubleshooting

### Problem: "Failed to fetch" saat login
- Cek kredensial di `supabase.js` sudah benar
- Cek browser console untuk error detail
- Pastikan Supabase project masih aktif

### Problem: RLS policy violation
- Pastikan RLS policies sudah dijalankan
- Cek role di profiles table (admin atau user)
- Verifikasi auth.uid() cocok dengan id di profiles

### Problem: Realtime tidak jalan
- Pastikan Replication enabled di Database > Replication
- Cek browser console: harus ada koneksi WebSocket
- Refresh browser

### Problem: Edge Function error
- Cek Logs di Edge Functions dashboard
- Pastikan environment variables sudah set
- Redeploy function jika perlu

## Checklist Siap Production

- [ ] Database schema & policies deployed
- [ ] Admin account created & tested
- [ ] Edge function deployed & working
- [ ] Frontend credentials configured
- [ ] Realtime working for messages
- [ ] User creation working
- [ ] Access code redemption working
- [ ] Chat antara admin-user working
- [ ] Deployed ke hosting
- [ ] Domain configured (optional)
- [ ] SSL/HTTPS active
- [ ] CORS configured for production domain
- [ ] Auth redirect URLs updated

## Kontak & Support

Jika ada masalah:
1. Cek Supabase Logs (Dashboard > Logs)
2. Cek Browser Console (F12)
3. Review file `supabase/README.md`
4. Dokumentasi: https://supabase.com/docs
