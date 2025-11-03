(function () {
  const socket = io();
  const sessionsListEl = document.getElementById('sessions-list');
  const messagesEl = document.getElementById('messages');
  const chatTitle = document.getElementById('chat-title');
  const inputEl = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');

  let activeSession = null;

  socket.emit('attendant:join');

  async function loadSessions() {
    const res = await fetch('/api/sessions');
    if (!res.ok) {
      alert('Erro ao carregar sessões.');
      return;
    }
    const sessions = await res.json();
    sessionsListEl.innerHTML = '';
    sessions.forEach(s => {
      const el = document.createElement('div');
      el.className = 'session-item';
      el.innerHTML = `<strong>${s.client_name || 'Cliente anônimo'}</strong><div style="font-size:12px;color:#666">${s.order_ref || ''}</div><div style="font-size:11px;color:#999">${new Date(s.created_at).toLocaleString()}</div>`;
      el.addEventListener('click', () => openSession(s.session_id, s.client_name));
      sessionsListEl.appendChild(el);
    });
  }

  async function openSession(session_id, client_name) {
    activeSession = session_id;
    chatTitle.textContent = `Sessão: ${client_name || session_id}`;
    messagesEl.innerHTML = '';

    const res = await fetch(`/api/sessions/${encodeURIComponent(session_id)}/messages`);
    if (!res.ok) { alert('Erro ao carregar mensagens'); return; }
    const rows = await res.json();
    rows.forEach(addMessageToUI);
    socket.emit('attendant:mark_seen', { session_id });
  }

  function addMessageToUI(msg) {
    const div = document.createElement('div');
    div.className = 'msg ' + (msg.sender === 'attendant' ? 'attendant' : 'client');
    div.innerHTML = `<div>${escapeHtml(msg.content)}</div><div style="font-size:11px;color:#666;margin-top:6px">${new Date(msg.created_at).toLocaleString()}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
  }

  sendBtn.addEventListener('click', async () => {
    const content = inputEl.value.trim();
    if (!content || !activeSession) return;
    socket.emit('attendant:message', { session_id: activeSession, content });
    inputEl.value = '';
    addMessageToUI({ sender: 'attendant', content, created_at: new Date().toISOString() });
  });

  socket.on('sessions:update', (s) => {
    loadSessions();
  });

  socket.on('chat:message', (payload) => {
    if (payload.session_id === activeSession) {
      addMessageToUI(payload);
    } else {
      // visual cue could be added
    }
  });

  loadSessions();
})();
