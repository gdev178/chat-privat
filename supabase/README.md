# Live Chat Application - Supabase Setup Guide

## Overview
This document provides complete setup instructions for the Supabase backend for the Live Chat Application.

## Prerequisites
- Supabase account (https://supabase.com)
- Git installed
- Node.js (for local development)

## Setup Steps

### 1. Create Supabase Project
1. Go to https://supabase.com and create new project
2. Choose a region close to your users
3. Wait for database to be provisioned

### 2. Database Setup
Run these SQL files in Supabase SQL Editor in exact order:

1. **First: Create tables and functions**
   - Copy content from `supabase/schema.sql`
   - Run in SQL Editor

2. **Second: Apply security policies**
   - Copy content from `supabase/policies.sql`
   - Run in SQL Editor

3. **Third (Optional): Insert test data**
   - Uncomment test data in `supabase/seed.sql` if needed
   - Run in SQL Editor

### 3. Edge Function Deployment

#### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy Edge Function
supabase functions deploy redeem-access-code
```

#### Option B: Manual Deployment via Dashboard
1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create new function**
3. Name: `redeem-access-code`
4. Copy content from `supabase/functions/redeem-access-code/index.ts`
5. Click **Deploy**

### 4. Environment Variables Configuration

For local development, create `.env.local` in frontend root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Edge Function deployment, set these in Supabase Dashboard:
1. Go to **Settings** > **API** > **Environment Variables**
2. Add variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings > API)

### 5. First Admin Account Setup

#### Secure Method: Using Supabase Dashboard
1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Enter admin email (e.g., admin@example.com)
4. Set password (strong, unique)
5. After user creation, note the user ID
6. Run this SQL in SQL Editor:

```sql
UPDATE public.profiles 
SET role = 'admin', display_name = 'Admin'
WHERE id = 'admin-user-id-from-step-5';
```

### 6. Authentication Configuration

1. Go to **Authentication** > **Providers**
2. Disable providers you don't need (keep Email only)
3. Configure email templates if needed
4. Set redirect URLs:
   - http://localhost:3000 (development)
   - https://yourdomain.com (production)

### 7. Realtime Configuration
1. Go to **Database** > **Replication**
2. Enable replication for:
   - `public:conversations`
   - `public:messages`
   - `public:profiles` (limited to certain columns)

### 8. Testing Checklist
- [ ] Tables created correctly
- [ ] RLS policies active
- [ ] Admin can log in
- [ ] User access code creation works
- [ ] Realtime chat functioning
