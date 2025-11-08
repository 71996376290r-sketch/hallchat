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


 CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT
);
    
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL,
    categoria TEXT DEFAULT 'Outros',
    imagem TEXT
);

CREATE TABLE IF NOT EXISTS pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER,
    preco_unit NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    total NUMERIC(10,2),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO produtos (nome, descricao, preco, categoria, imagem) VALUES
('X-Burger', 'Pão, carne, queijo e maionese da casa', 18.00, 'Lanches', 'img/xburger.jpg'),
('X-Salada', 'Pão, carne, queijo, alface, tomate e maionese', 20.00, 'Lanches', 'img/xsalada.jpg'),
('Coca-Cola Lata', '350ml bem gelada', 6.00, 'Bebidas', 'img/coca.jpg'),
('Batata Frita', 'Porção média crocante', 12.00, 'Acompanhamentos', 'img/batata.jpg'),
('Brownie', 'Chocolate com calda', 10.00, 'Sobremesas', 'img/brownie.jpg');


CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
