import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { json } from 'express'
import jwt from 'jsonwebtoken'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

vi.mock('../../models/trainerModel.js', () => ({
    default: {
        getClients:        vi.fn(),
        addClientByEmail:  vi.fn(),
        removeClient:      vi.fn(),
        isMyClient:        vi.fn(),
        getClientStats:    vi.fn(),
        getClientSessions: vi.fn(),
        getClientAssignments: vi.fn(),
        getClientProgress: vi.fn(),
        assignProgram:     vi.fn(),
        removeAssignment:  vi.fn(),
        getOverview:       vi.fn(),
    }
}))
vi.mock('../../models/trainerRulesModel.js', () => ({
    default: { getForClient: vi.fn(), upsert: vi.fn(), delete: vi.fn() }
}))
vi.mock('../../config/db.js', () => ({ default: {} }))

import Trainer from '../../models/trainerModel.js'
import trainerRoutes from '../../routes/trainerRoutes.js'

const SECRET = 'super_secret_key_per_i_token_jwt'
const tokenTrainer = jwt.sign({ id: 1, role: 'trainer' }, SECRET, { expiresIn: '1h' })
const tokenUser    = jwt.sign({ id: 2, role: 'user' },    SECRET, { expiresIn: '1h' })

const app = express()
app.use(json())
app.use('/api/trainer', trainerRoutes)
app.use(notFound)
app.use(errorHandler)

// ─── GET /overview ─────────────────────────────────────────────────────────
describe('GET /api/trainer/overview', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 senza token', async () => {
        const res = await request(app).get('/api/trainer/overview')
        expect(res.status).toBe(401)
    })

    it('risponde 403 se utente non è trainer', async () => {
        const res = await request(app)
            .get('/api/trainer/overview')
            .set('Authorization', `Bearer ${tokenUser}`)
        expect(res.status).toBe(403)
    })

    it('risponde 200 con panoramica clienti', async () => {
        Trainer.getOverview.mockResolvedValue([{ id: 3, name: 'Mario', sessions_this_week: 2 }])
        const res = await request(app)
            .get('/api/trainer/overview')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].name).toBe('Mario')
    })
})

// ─── GET /clients ───────────────────────────────────────────────────────────
describe('GET /api/trainer/clients', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 senza token', async () => {
        const res = await request(app).get('/api/trainer/clients')
        expect(res.status).toBe(401)
    })

    it('risponde 200 con lista clienti', async () => {
        Trainer.getClients.mockResolvedValue([{ id: 3, name: 'Mario', email: 'mario@test.it' }])
        const res = await request(app)
            .get('/api/trainer/clients')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(Trainer.getClients).toHaveBeenCalledWith(1)
    })
})

// ─── POST /clients ──────────────────────────────────────────────────────────
describe('POST /api/trainer/clients', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se email mancante', async () => {
        const res = await request(app)
            .post('/api/trainer/clients')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({})
        expect(res.status).toBe(400)
    })

    it('risponde 400 se utente non trovato', async () => {
        Trainer.addClientByEmail.mockResolvedValue({ error: 'Utente non trovato.' })
        const res = await request(app)
            .post('/api/trainer/clients')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ email: 'nessuno@test.it' })
        expect(res.status).toBe(400)
        expect(res.body.message).toBe('Utente non trovato.')
    })

    it('risponde 400 se cliente già associato ad altro trainer', async () => {
        Trainer.addClientByEmail.mockResolvedValue({ error: 'Questo utente è già associato a un altro trainer.' })
        const res = await request(app)
            .post('/api/trainer/clients')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ email: 'mario@test.it' })
        expect(res.status).toBe(400)
    })

    it('risponde 201 se cliente aggiunto', async () => {
        Trainer.addClientByEmail.mockResolvedValue({ client: { id: 3, name: 'Mario', email: 'mario@test.it' } })
        const res = await request(app)
            .post('/api/trainer/clients')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ email: 'mario@test.it' })
        expect(res.status).toBe(201)
        expect(res.body.client.name).toBe('Mario')
    })
})

// ─── DELETE /clients/:clientId ──────────────────────────────────────────────
describe('DELETE /api/trainer/clients/:clientId', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 404 se cliente non trovato', async () => {
        Trainer.removeClient.mockResolvedValue(false)
        const res = await request(app)
            .delete('/api/trainer/clients/99')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(404)
    })

    it('risponde 200 se cliente rimosso', async () => {
        Trainer.removeClient.mockResolvedValue(true)
        const res = await request(app)
            .delete('/api/trainer/clients/3')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(Trainer.removeClient).toHaveBeenCalledWith(1, '3')
    })
})

// ─── GET /clients/:clientId/stats ───────────────────────────────────────────
describe('GET /api/trainer/clients/:clientId/stats', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se cliente non è mio', async () => {
        Trainer.isMyClient.mockResolvedValue(false)
        const res = await request(app)
            .get('/api/trainer/clients/3/stats')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(403)
    })

    it('risponde 200 con stats cliente', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        Trainer.getClientStats.mockResolvedValue({ total_sessions: 10, avg_form_score: 82, weekly: [] })
        const res = await request(app)
            .get('/api/trainer/clients/3/stats')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(res.body.total_sessions).toBe(10)
    })
})

// ─── GET /clients/:clientId/sessions ────────────────────────────────────────
describe('GET /api/trainer/clients/:clientId/sessions', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se cliente non è mio', async () => {
        Trainer.isMyClient.mockResolvedValue(false)
        const res = await request(app)
            .get('/api/trainer/clients/3/sessions')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(403)
    })

    it('risponde 200 con sessioni cliente', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        Trainer.getClientSessions.mockResolvedValue([{ id: 1, started_at: '2026-01-01', exercises_done: 3 }])
        const res = await request(app)
            .get('/api/trainer/clients/3/sessions')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
    })
})

// ─── GET /clients/:clientId/assignments ─────────────────────────────────────
describe('GET /api/trainer/clients/:clientId/assignments', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se cliente non è mio', async () => {
        Trainer.isMyClient.mockResolvedValue(false)
        const res = await request(app)
            .get('/api/trainer/clients/3/assignments')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(403)
    })

    it('risponde 200 con programmi assegnati', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        Trainer.getClientAssignments.mockResolvedValue([{ assignment_id: 1, name: 'Piano A' }])
        const res = await request(app)
            .get('/api/trainer/clients/3/assignments')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(res.body[0].name).toBe('Piano A')
    })
})

// ─── GET /clients/:clientId/progress ────────────────────────────────────────
describe('GET /api/trainer/clients/:clientId/progress', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se cliente non è mio', async () => {
        Trainer.isMyClient.mockResolvedValue(false)
        const res = await request(app)
            .get('/api/trainer/clients/3/progress')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(403)
    })

    it('risponde 200 con progressi cliente', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        Trainer.getClientProgress.mockResolvedValue({
            weeklyTrend: [], muscles: [], topExercises: [],
            adherence: { sessions_done: 5, sessions_expected: 8, rate: 63 }
        })
        const res = await request(app)
            .get('/api/trainer/clients/3/progress')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(res.body.adherence.rate).toBe(63)
    })
})

// ─── POST /clients/:clientId/assignments ────────────────────────────────────
describe('POST /api/trainer/clients/:clientId/assignments', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se programId mancante', async () => {
        const res = await request(app)
            .post('/api/trainer/clients/3/assignments')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({})
        expect(res.status).toBe(400)
    })

    it('risponde 403 se cliente non è mio', async () => {
        Trainer.isMyClient.mockResolvedValue(false)
        const res = await request(app)
            .post('/api/trainer/clients/3/assignments')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ programId: 1 })
        expect(res.status).toBe(403)
    })

    it('risponde 400 se programma già assegnato', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        Trainer.assignProgram.mockResolvedValue({ error: 'Programma già assegnato a questo cliente.' })
        const res = await request(app)
            .post('/api/trainer/clients/3/assignments')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ programId: 1 })
        expect(res.status).toBe(400)
    })

    it('risponde 201 se programma assegnato', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        Trainer.assignProgram.mockResolvedValue({ id: 5 })
        const res = await request(app)
            .post('/api/trainer/clients/3/assignments')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ programId: 1 })
        expect(res.status).toBe(201)
        expect(res.body.id).toBe(5)
    })
})

// ─── DELETE /assignments/:assignmentId ──────────────────────────────────────
describe('DELETE /api/trainer/assignments/:assignmentId', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 404 se assegnazione non trovata', async () => {
        Trainer.removeAssignment.mockResolvedValue(false)
        const res = await request(app)
            .delete('/api/trainer/assignments/99')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(404)
    })

    it('risponde 200 se assegnazione rimossa', async () => {
        Trainer.removeAssignment.mockResolvedValue(true)
        const res = await request(app)
            .delete('/api/trainer/assignments/5')
            .set('Authorization', `Bearer ${tokenTrainer}`)
        expect(res.status).toBe(200)
        expect(Trainer.removeAssignment).toHaveBeenCalledWith(1, '5')
    })
})
