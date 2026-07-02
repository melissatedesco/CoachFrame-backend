# FitApp-backend
# FitFrame API

Backend REST per FitFrame, l'allenatore virtuale a casa (anche per trainer e clienti).
Stack: **Node.js + Express + MySQL** (driver `mysql2`).

## Requisiti
- Node.js 18+
- MySQL 8+

## Setup
1. `npm install`
2. `cp .env.example .env` e compila i valori (genera i segreti JWT con
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
3. Crea il database e le tabelle:
   ```sql
   CREATE DATABASE fitframe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   ```bash
   mysql -u root -p fitframe < db/schema.sql
   ```
4. `npm run dev`

## Endpoint principali

### Auth — /api/auth
POST /register · POST /login · POST /refresh · POST /logout · GET /me

### Utenti — /api/users  (admin)
GET / · PATCH /:id/role   (promuove a trainer/admin)

### Esercizi — /api/exercises
GET / (filtri: muscleGroup, difficulty, equipmentId) · GET /:id
POST / · PUT /:id · DELETE /:id   (admin, trainer)

### Attrezzi — /api/equipment
GET / · GET /:id · GET /mine · PUT /mine (imposta i propri attrezzi)
POST / · PUT /:id · DELETE /:id   (admin)

### Schede — /api/programs
GET / · GET /:id · POST / · PUT /:id · DELETE /:id
POST /:id/exercises · PUT /:id/exercises/:exId · DELETE /:id/exercises/:exId

### Clienti (trainer) — /api/clients   (trainer, admin)
POST / (invita per email) · GET / · DELETE /:clientId
POST /:clientId/assign (assegna scheda)
GET /:clientId/sessions · GET /:clientId/progress

### Sessioni — /api/sessions
POST / (registra allenamento) · GET / · GET /:id · DELETE /:id

### Statistiche — /api/stats
GET /progress · GET /exercises/:id/history

## Sicurezza
Hashing bcrypt, JWT access + refresh con rotazione/revoca, RBAC (`requireRole`),
verifica di proprietà delle risorse, validazione input, rate limiting, Helmet.

## Roadmap
- [x] 1. Scaffolding
- [x] 2-3. Schema + Autenticazione (JWT, refresh, ruoli)
- [x] 4. Esercizi (CRUD + regole d'angolo) + Attrezzi
- [x] 5. Schede / programmi
- [x] 6. Clienti (trainer) + assegnazione schede
- [x] 7. Sessioni + statistiche/aderenza
- [ ] Deploy (hosting + HTTPS) — quando l'MVP e validato
