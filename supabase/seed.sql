-- Optional seed data for testing
-- WARNING: Do NOT use these credentials in production
-- This file is for development/testing purposes only

-- Note: To create the first admin account securely in production:
-- 1. Use Supabase Dashboard to create a user via Authentication > Users
-- 2. Then manually insert into profiles table with role='admin'
-- OR use the admin creation script provided in README.md

-- Example test data (do not use in production)
-- Uncomment below if you need test data for local development

/*
-- Insert test admin profile (requires corresponding auth.users record)
-- First create user via Supabase Auth, then insert profile
INSERT INTO public.profiles (id, display_name, role, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Test Admin', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test user profiles
INSERT INTO public.profiles (id, display_name, role, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Test User 1', 'user', true),
    ('00000000-0000-0000-0000-000000000003', 'Test User 2', 'user', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test access codes (hashed with bcrypt, original: TESTCODE123)
-- Hash generated with: SELECT crypt('TESTCODE123', gen_salt('bf'))
INSERT INTO public.access_codes (user_id, code_hash, expires_at)
VALUES 
    ('00000000-0000-0000-0000-000000000002', '$2a$06$EXAMPLE_HASH_NOT_REAL_123456789', NOW() + INTERVAL '30 days'),
    ('00000000-0000-0000-0000-000000000003', '$2a$06$EXAMPLE_HASH_NOT_REAL_987654321', NOW() + INTERVAL '30 days')
ON CONFLICT (code_hash) DO NOTHING;

-- Insert test conversations
INSERT INTO public.conversations (user_id, admin_id)
VALUES 
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, admin_id) DO NOTHING;

-- Insert test messages
INSERT INTO public.messages (conversation_id, sender_id, content)
SELECT 
    c.id,
    c.user_id,
    'Hello, I need help with my account.'
FROM public.conversations c
WHERE c.user_id = '00000000-0000-0000-0000-000000000002'
LIMIT 1;

INSERT INTO public.messages (conversation_id, sender_id, content)
SELECT 
    c.id,
    c.admin_id,
    'Hi! How can I assist you today?'
FROM public.conversations c
WHERE c.user_id = '00000000-0000-0000-0000-000000000002'
LIMIT 1;
*/