-- Script untuk membuat admin pertama secara aman
-- Jalankan script ini di Supabase SQL Editor setelah schema.sql dan policies.sql

-- LANGKAH 1: Buat user di Supabase Auth terlebih dahulu melalui Dashboard
-- Authentication > Users > Add user
-- Email: admin@example.com (ganti dengan email Anda)
-- Password: [Gunakan password yang kuat]
-- Catat USER_ID yang dihasilkan

-- LANGKAH 2: Setelah user dibuat, jalankan query di bawah ini
-- Ganti 'USER_ID_DARI_DASHBOARD' dengan ID user yang baru dibuat

-- Update profile menjadi admin
UPDATE public.profiles 
SET 
    role = 'admin',
    display_name = 'Admin',
    is_active = true
WHERE id = 'USER_ID_DARI_DASHBOARD';

-- Verifikasi admin berhasil dibuat
SELECT id, display_name, role, is_active, created_at 
FROM public.profiles 
WHERE role = 'admin';

-- ALTERNATIF: Jika ingin membuat admin langsung dengan fungsi
-- (Memerlukan service_role access, lebih aman via Dashboard)

/*
-- Function untuk membuat admin (opsional, untuk automasi)
CREATE OR REPLACE FUNCTION create_admin_account(
    admin_email TEXT,
    admin_password TEXT,
    admin_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result json;
BEGIN
    -- Generate UUID
    new_user_id := gen_random_uuid();
    
    -- Insert ke auth.users (memerlukan superuser/service_role)
    -- Ini hanya contoh, lebih baik gunakan Supabase Dashboard atau Auth API
    
    -- Insert profile
    INSERT INTO public.profiles (id, display_name, role, is_active)
    VALUES (new_user_id, admin_name, 'admin', true);
    
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', admin_email,
        'message', 'Admin account created. Complete setup via Supabase Auth Dashboard.'
    );
    
    RETURN result;
END;
$$;
*/

-- CARA PALING AMAN (RECOMMENDED):
-- 1. Buka Supabase Dashboard
-- 2. Authentication > Users > Add user
-- 3. Email: admin@yourdomain.com
-- 4. Password: [Buat password kuat, simpan di password manager]
-- 5. Auto Confirm: YES (checklist)
-- 6. Salin User ID yang muncul
-- 7. Jalankan query UPDATE di atas dengan User ID tersebut
-- 8. Login ke aplikasi dengan email & password admin
