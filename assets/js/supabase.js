// GANTI DENGAN KREDENSIAL SUPABASE ANDA
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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