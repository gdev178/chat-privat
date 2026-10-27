// GANTI DENGAN KREDENSIAL SUPABASE ANDA
const SUPABASE_URL = 'https://nipypmjnektcpwqscfaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcHlwbWpuZWt0Y3B3cXNjZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwODgzODgsImV4cCI6MjEwODY2NDM4OH0.yjkUqzbiBeb7MwYQcOdzeAkf6X6z4-z2eOwoZrBXN2o';

if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS not loaded');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabase = supabaseClient;

function getSession() {
    return JSON.parse(localStorage.getItem('sb-session'));
}

async function checkAuth(requiredRole) {
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
    supabase.auth.signOut().then(() => {
        localStorage.removeItem('sb-session');
        window.location.href = 'index.html';
    });
}