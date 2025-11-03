const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();
const { pool } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Apply migration.sql on startup (idempotent)
async function applyMigrations() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
    await pool.query(sql);
    console.log('Migrations applied.');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

// Helper: ensure session exists
async function ensureSession(session_id, client_name = null, order_ref = null) {
  const res = await pool.query('SELECT 1 FROM chat_sessions WHERE session_id = $1', [session_id]);
  if (res.rowCount === 0) {
    await pool.query('INSERT INTO chat_sessions (session_id, client_name, order_ref) VALUES ($1, $2, $3)', [session_id, client_name, order_ref]);
  } else if (client_name || order_ref) {
    await pool.query('UPDATE chat_sessions SET client_name = COALESCE($2, client_name), order_ref = COALESCE($3, order_ref) WHERE session_id = $1', [session_id, client_name, order_ref]);
  }
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('client:join', async (payload) => {
    const { session_id, client_name, order_ref } = payload || {};
    if (!session_id) return;
    socket.join(session_id);
    await ensureSession(session_id, client_name, order_ref);
    const { rows } = await pool.query('SELECT sender, content, created_at, id, seen_by_attendant FROM messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 500', [session_id]);
    socket.emit('chat:history', rows);
    io.to('attendants').emit('sessions:update', { session_id, client_name, order_ref });
  });

  socket.on('attendant:join', () => {
    socket.join('attendants');
  });

  socket.on('client:message', async (payload) => {
    const { session_id, content } = payload || {};
    if (!session_id || !content) return;
    await ensureSession(session_id);
    const res = await pool.query('INSERT INTO messages (session_id, sender, content) VALUES ($1, $2, $3) RETURNING id, created_at', [session_id, 'client', content]);
    const msg = { id: res.rows[0].id, sender: 'client', content, created_at: res.rows[0].created_at, seen_by_attendant: false, session_id };
    io.to(session_id).emit('chat:message', msg);
    io.to('attendants').emit('chat:message', msg);
  });

  socket.on('attendant:message', async (payload) => {
    const { session_id, content } = payload || {};
    if (!session_id || !content) return;
    const res = await pool.query('INSERT INTO messages (session_id, sender, content) VALUES ($1, $2, $3) RETURNING id, created_at', [session_id, 'attendant', content]);
    const msg = { id: res.rows[0].id, sender: 'attendant', content, created_at: res.rows[0].created_at, session_id };
    io.to(session_id).emit('chat:message', msg);
    io.to('attendants').emit('chat:message', msg);
  });

  socket.on('attendant:mark_seen', async (payload) => {
    const { session_id } = payload || {};
    if (!session_id) return;
    await pool.query('UPDATE messages SET seen_by_attendant = true WHERE session_id = $1 AND sender = $2', [session_id, 'client']);
    io.to(session_id).emit('messages:seen_by_attendant', { session_id });
  });

  socket.on('disconnect', () => { /* nothing */ });
});

// Simple API for admin list (no auth for now)
app.get('/api/sessions', async (req, res) => {
  const { rows } = await pool.query('SELECT session_id, client_name, order_ref, created_at, closed FROM chat_sessions ORDER BY created_at DESC LIMIT 200', []);
  res.json(rows);
});

app.get('/api/sessions/:session_id/messages', async (req, res) => {
  const session_id = req.params.session_id;
  const { rows } = await pool.query('SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC', [session_id]);
  res.json(rows);
});

(async () => {
  await applyMigrations();
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
