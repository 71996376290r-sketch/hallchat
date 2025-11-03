CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  client_name VARCHAR(200),
  order_ref VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  seen_by_attendant BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
