let currentConversationId = null;
let currentUserId = null;
let messagesSubscription = null;

document.addEventListener('DOMContentLoaded', async () => {
    const auth = await checkAuth('admin');
    if (!auth) return;

    document.getElementById('adminName').textContent = auth.profile.display_name;
    loadUsers();
    setupChatListeners();
});

async function loadUsers() {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'user')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">Belum ada pengguna</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-4">${user.display_name}</td>
                <td class="p-4">
                    <span class="text-xs font-semibold px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td class="p-4 text-xs text-gray-500">${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                <td class="p-4 text-right space-x-2 flex gap-2 justify-end">
                    <button onclick="showUserCode('${user.id}')" class="text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-1 rounded transition">Lihat Kode</button>
                    <button onclick="openChat('${user.id}', '${user.display_name}')" class="text-xs bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded transition">Chat</button>
                    <button onclick="toggleUserStatus('${user.id}', ${user.is_active})" class="text-xs ${user.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} px-2 py-1 rounded transition">
                        ${user.is_active ? 'Nonaktif' : 'Aktifkan'}
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function showUserCode(userId) {
    try {
        const { data: codes, error } = await supabase
            .from('access_codes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const unused = codes.find(c => !c.used_at && !c.revoked_at && (!c.expires_at || new Date(c.expires_at) > new Date()));
        
        if (unused) {
            document.getElementById('generatedCodeDisplay').textContent = 'CODE-' + unused.id.substring(0, 8).toUpperCase();
        } else {
            document.getElementById('generatedCodeDisplay').textContent = 'Kode tidak tersedia';
        }

        document.getElementById('showCodeModal').classList.remove('hidden');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function copyCode() {
    const code = document.getElementById('generatedCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Kode berhasil disalin');
    });
}

async function toggleUserStatus(userId, currentStatus) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: !currentStatus })
            .eq('id', userId);

        if (error) throw error;
        loadUsers();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function openCreateUserModal() {
    document.getElementById('newDisplayName').value = '';
    document.getElementById('createUserModal').classList.remove('hidden');
}

async function submitCreateUser() {
    const displayName = document.getElementById('newDisplayName').value.trim();
    
    if (!displayName) {
        alert('Nama tidak boleh kosong');
        return;
    }

    try {
        const randomId = crypto.randomUUID();
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: randomId, display_name: displayName, role: 'user', is_active: true }]);

        if (profileError) throw profileError;

        // Generate access code
        const code = generateAccessCode();
        const codeHash = await hashAccessCode(code);

        const { error: codeError } = await supabase
            .from('access_codes')
            .insert([{
                user_id: randomId,
                code_hash: codeHash,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }]);

        if (codeError) throw codeError;

        document.getElementById('generatedCodeDisplay').textContent = code;
        closeModal('createUserModal');
        document.getElementById('showCodeModal').classList.remove('hidden');
        loadUsers();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
        if (i === 3 || i === 7 || i === 11) code += '-';
    }
    return code;
}

async function hashAccessCode(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function openChat(userId, displayName) {
    currentUserId = userId;
    document.getElementById('activeChatUser').textContent = displayName;
    switchTab('chats');

    try {
        const auth = await checkAuth('admin');
        const { data: conversation, error } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', userId)
            .eq('admin_id', auth.user.id)
            .single();

        if (error) {
            // Create conversation if doesn't exist
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert([{ user_id: userId, admin_id: auth.user.id }])
                .select()
                .single();

            if (createError) throw createError;
            currentConversationId = newConv.id;
        } else {
            currentConversationId = conversation.id;
        }

        loadMessages();
        setupMessageSubscription();
    } catch (err) {
        console.error('Error opening chat:', err);
    }
}

async function loadMessages() {
    if (!currentConversationId) return;

    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentConversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        messages.forEach(msg => {
            const isAdmin = msg.sender_id === (JSON.parse(localStorage.getItem('sb-session') || '{}').user?.id);
            const bubble = document.createElement('div');
            bubble.className = `flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-3`;
            bubble.innerHTML = `
                <div class="${isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-900'} px-4 py-2 rounded-lg max-w-xs break-words">
                    <p class="text-sm">${escapeHtml(msg.content)}</p>
                    <p class="text-xs opacity-70 mt-1">${new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            `;
            container.appendChild(bubble);
        });

        container.scrollTop = container.scrollHeight;
        document.getElementById('messageInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
    } catch (err) {
        console.error('Error loading messages:', err);
    }
}

function setupMessageSubscription() {
    if (messagesSubscription) messagesSubscription.unsubscribe();

    messagesSubscription = supabase
        .channel(`messages:${currentConversationId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentConversationId}` }, (payload) => {
            loadMessages();
        })
        .subscribe();
}

async function sendMessage() {
    if (!currentConversationId) return;

    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content) return;

    try {
        const auth = await checkAuth('admin');
        const { error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: currentConversationId,
                sender_id: auth.user.id,
                content: content
            }]);

        if (error) throw error;
        input.value = '';
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

function setupChatListeners() {
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function switchTab(tab) {
    const tabs = ['users', 'chats'];
    tabs.forEach(t => {
        const element = document.getElementById(`tab-${t}`);
        const navElement = document.getElementById(`nav-${t}`);
        if (t === tab) {
            element.classList.remove('hidden');
            navElement.classList.add('bg-blue-600', 'text-white');
            navElement.classList.remove('text-gray-300', 'hover:bg-navy-800');
        } else {
            element.classList.add('hidden');
            navElement.classList.remove('bg-blue-600', 'text-white');
            navElement.classList.add('text-gray-300', 'hover:bg-navy-800');
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}