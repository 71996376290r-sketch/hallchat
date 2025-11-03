(function () {
  const socket = io();

  // generate or reuse session id (localStorage)
  let session_id = localStorage.getItem('nh_session_id');
  if (!session_id) {
    session_id = 's_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('nh_session_id', session_id);
  }

  let client_name = localStorage.getItem('nh_client_name') || '';
  let order_ref = localStorage.getItem('nh_order_ref') || '';

  function askClientInfoIfNeeded() {
    if (!client_name) {
      const name = prompt('Seu nome para o atendimento (opcional):') || '';
      client_name = name.trim();
      localStorage.setItem('nh_client_name', client_name);
    }
    if (!order_ref) {
      const ordr = prompt('Número do pedido / referência (opcional):') || '';
      order_ref = ordr.trim();
      localStorage.setItem('nh_order_ref', order_ref);
    }
  }

  const chatOpenBtn = document.getElementById('chat-open');
  const chatWidget = document.getElementById('chat-widget');
  const chatClose = document.getElementById('chat-close');
  const chatBody = document.getElementById('chat-body');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');

  chatOpenBtn.addEventListener('click', () => {
    askClientInfoIfNeeded();
    chatWidget.style.display = 'flex';
    chatOpenBtn.style.display = 'none';
    socket.emit('client:join', { session_id, client_name, order_ref });
  });

  chatClose.addEventListener('click', () => {
    chatWidget.style.display = 'none';
    chatOpenBtn.style.display = 'block';
  });

  function addMessageToUI(msg) {
    const el = document.createElement('div');
    el.classList.add('chat-bubble');
    el.classList.add(msg.sender === 'attendant' ? 'attendant' : 'client');
    el.innerHTML = `<div>${escapeHtml(msg.content)}</div><div style="font-size:11px;margin-top:6px;color:#666">${new Date(msg.created_at).toLocaleString()}</div>`;
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

  function sendMessage() {
    const content = chatInput.value.trim();
    if (!content) return;
    chatInput.value = '';
    const msg = { session_id, content };
    addMessageToUI({ sender: 'client', content, created_at: new Date().toISOString() });
    socket.emit('client:message', msg);
  }

  socket.on('chat:history', (rows) => {
    chatBody.innerHTML = '';
    rows.forEach(addMessageToUI);
  });

  socket.on('chat:message', (msg) => {
    if (!msg.session_id || msg.session_id === session_id) {
      addMessageToUI(msg);
    }
  });

  socket.on('messages:seen_by_attendant', (data) => {
    const note = document.createElement('div');
    note.style.fontSize = '12px';
    note.style.color = '#666';
    note.style.textAlign = 'center';
    note.style.margin = '6px 0';
    note.textContent = 'Atendente visualizou as mensagens.';
    chatBody.appendChild(note);
    chatBody.scrollTop = chatBody.scrollHeight;
  });
})();
