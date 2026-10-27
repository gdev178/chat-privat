-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can update their own display_name only
CREATE POLICY "Users can update own display_name"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
    );

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- ACCESS_CODES POLICIES
-- ============================================

-- Admins can read all access codes
CREATE POLICY "Admins can read access codes"
    ON public.access_codes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert access codes
CREATE POLICY "Admins can insert access codes"
    ON public.access_codes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update access codes
CREATE POLICY "Admins can update access codes"
    ON public.access_codes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can read their own conversations
CREATE POLICY "Users can read own conversations"
    ON public.conversations FOR SELECT
    USING (user_id = auth.uid() OR admin_id = auth.uid());

-- Admins can insert conversations
CREATE POLICY "Admins can insert conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can insert conversations (create their own with admin)
CREATE POLICY "Users can create conversation with admin"
    ON public.conversations FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = admin_id AND role = 'admin'
        )
    );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can read messages in their conversations
CREATE POLICY "Users can read messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user_id = auth.uid() OR admin_id = auth.uid())
        )
    );

-- Users can insert messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user_id = auth.uid() OR admin_id = auth.uid())
        )
    );

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can update messages in their conversations
CREATE POLICY "Users can update messages in their conversations"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user_id = auth.uid() OR admin_id = auth.uid())
        )
    );