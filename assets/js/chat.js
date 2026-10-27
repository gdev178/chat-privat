let currentConversationId = null;
let messagesSubscription = null;

document.addEventListener('DOMContentLoaded', async () => {
    const auth = await checkAuth('user');
    if (!auth) return;

    loadConversation(auth.user.id);
    setupMessageListener();
});

async function loadConversation(userId) {
    try {
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        let conversation = conversations[0];

        if (!conversation) {
            const { data: admin, error: adminError } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .limit(1)
                .single();

            if (adminError || !admin) {
                alert('Admin tidak ditemukan');
                return;
            }

            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert([{ user_id: userId, admin_id: admin.id }])
                .select()
                .single();

            if (createError) throw createError;
            conversation = newConv;
        }

        currentConversationId = conversation.id;
        loadMessages();
    } catch (err) {
        console.error('Error loading conversation:', err);
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

        if (messages.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 text-sm py-8">Mulai percakapan dengan admin</div>';
        } else {
            const auth = await checkAuth('user');
            messages.forEach(msg => {
                const isOwn = msg.sender_id === auth.user.id;
                const bubble = document.createElement('div');
                bubble.className = `flex ${isOwn ? 'justify-end' : 'justify-start'}`;
                bubble.innerHTML = `
                    <div class="${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-900'} px-4 py-2 rounded-lg max-w-xs break-words">
                        <p class="text-sm">${escapeHtml(msg.content)}</p>
                        <p class="text-xs opacity-70 mt-1">${new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                `;
                container.appendChild(bubble);
            });
        }

        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error('Error loading messages:', err);
    }
}

function setupMessageListener() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.querySelector('button[onclick="sendMessage()"]');

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Setup realtime subscription
    if (currentConversationId) {
        if (messagesSubscription) messagesSubscription.unsubscribe();

        messagesSubscription = supabase
            .channel(`messages:${currentConversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentConversationId}` }, (payload) => {
                loadMessages();
            })
            .subscribe();
    }
}

async function sendMessage() {
    if (!currentConversationId) return;

    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content) return;

    try {
        const auth = await checkAuth('user');
        const { error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: currentConversationId,
                sender_id: auth.user.id,
                content: content
            }]);

        if (error) throw error;
        messageInput.value = '';
        loadMessages();
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}