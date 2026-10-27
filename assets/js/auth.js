document.addEventListener('DOMContentLoaded', () => {
    const identifierInput = document.getElementById('identifier');
    const passwordGroup = document.getElementById('passwordGroup');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    identifierInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        // If it looks like a code (e.g. contains hyphen or length > 12 without @)
        if (val.length >= 8 && !val.includes('@')) {
            passwordGroup.style.display = 'none';
        } else {
            passwordGroup.style.display = 'block';
        }
    });

    loginBtn.addEventListener('click', async () => {
        errorMessage.classList.add('hidden');
        const identifier = identifierInput.value.trim();
        const password = passwordInput.value;

        if (!identifier) {
            showError('Masukkan email atau kode akses.');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Memproses...';

        try {
            if (!identifier.includes('@')) {
                // Access Code Login via Edge Function
                const response = await fetch(`${SUPABASE_URL}/functions/v1/redeem-access-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({ accessCode: identifier })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Gagal login dengan kode akses');
                }

                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                });

                window.location.href = 'chat.html';
            } else {
                // Standard Email/Password Login
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: identifier,
                    password: password
                });

                if (error) throw error;

                // Check role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profile && profile.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'chat.html';
                }
            }
        } catch (err) {
            showError(err.message);
            loginBtn.disabled = false;
            loginBtn.textContent = 'Masuk';
        }
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }
});