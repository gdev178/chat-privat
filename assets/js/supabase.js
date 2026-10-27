const SUPABASE_URL = 'https://nipypmjnektcpwqscfaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcHlwbWpuZWt0Y3B3cXNjZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwODgzODgsImV4cCI6MjEwODY2NDM4OH0.yjkUqzbiBeb7MwYQcOdzeAkf6X6z4-z2eOwoZrBXN2o';

let supabase;

if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase CDN library not found or createClient is missing');
}

function getSession() {
    return JSON.parse(localStorage.getItem('sb-session'));
}

async function checkAuth(requiredRole) {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || (requiredRole && profile.role !== requiredRole)) {
        window.location.href = 'index.html';
        return null;
    }

    return { user, profile };
}

function logout() {
    if (supabase) {
        supabase.auth.signOut().then(() => {
            localStorage.removeItem('sb-session');
            window.location.href = 'index.html';
        });
    }
}