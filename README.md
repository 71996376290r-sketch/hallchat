NA CHAPA HALL - Chat (Node.js + Socket.IO + PostgreSQL)
=====================================================

Conteúdo:
- server.js          (Express + Socket.IO, auto-aplica migration)
- db.js              (Postgres pool)
- migration.sql      (tabelas do chat)
- public/            (frontend do cliente e admin)
- package.json

Como usar localmente:
1. Copie `.env.example` para `.env` e preencha `DATABASE_URL`.
2. `npm install`
3. `npm start`
O servidor tentará aplicar `migration.sql` automaticamente na primeira inicialização.

Deploy no Render:
- Suba este repositório ao GitHub e conecte no Render como Web Service.
- Adicione a Environment Variable:
  DATABASE_URL=postgres://halldb_user:YOUR_PASSWORD@...:5432/halldb
- Start command: `npm start`
