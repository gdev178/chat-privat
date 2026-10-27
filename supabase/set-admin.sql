-- SQL query untuk menjadikan user id b0cd7fd7-0cc1-4a29-aa2a-e53af8a5d43e sebagai admin
-- Jalankan query ini di Supabase SQL Editor

UPDATE public.profiles 
SET 
    role = 'admin',
    display_name = 'Admin',
    is_active = true
WHERE id = 'b0cd7fd7-0cc1-4a29-aa2a-e53af8a5d43e';

-- Verifikasi admin berhasil di-set
SELECT id, display_name, role, is_active, created_at 
FROM public.profiles 
WHERE id = 'b0cd7fd7-0cc1-4a29-aa2a-e53af8a5d43e';
