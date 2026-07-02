import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { json } from 'express'
import jwt from 'jsonwebtoken'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

vi.mock('../../models/trainerModel.js', () => ({
    default: { isMyClient: vi.fn() }
}))
vi.mock('../../models/trainerRulesModel.js', () => ({
    default: {
        getForClient: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
    }
}))
vi.mock('../../config/db.js', () => ({ default: {} }))

import Trainer from '../../models/trainerModel.js'
import TrainerRules from '../../models/trainerRulesModel.js'
import trainerRoutes from '../../routes/trainerRoutes.js'

const SECRET = 'super_secret_key_per_i_token_jwt'
const tokenTrainer = jwt.sign({ id: 1, role: 'trainer' }, SECRET, { expiresIn: '1h' })
const tokenUser    = jwt.sign({ id: 2, role: 'user' },    SECRET, { expiresIn: '1h' })

const app = express()
app.use(json())
app.use('/api/trainer', trainerRoutes)
app.use(notFound)
app.use(errorHandler)

const regolaOverride = [{ joint: 'knee', min: 100, max: 175, phase: 'down', side: 'both' }]

describe('GET /api/trainer/clients/:clientId/rules', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 senza token', async () => {
        const res = await request(app).get('/api/trainer/clients/3/rules')
        expect(res.status).toBe(401)
    })

    it('risponde 403 se utente non è trainer', async () => {
        const res = await request(app)
            .get('/api/trainer/clients/3/rules')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(403)
    })

    it('risponde 403 se il cliente non appartiene al trainer', async () => {
        Trainer.isMyClient.mockResolvedValue(false)

        const res = await request(app)
            .get('/api/trainer/clients/3/rules')
            .set('Authorization', `Bearer ${tokenTrainer}`)

        expect(res.status).toBe(403)
    })

    it('risponde 200 con lista regole del cliente', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        TrainerRules.getForClient.mockResolvedValue([
            { id: 1, exercise_id: 1, exercise_name: 'Squat', rules: regolaOverride }
        ])

        const res = await request(app)
            .get('/api/trainer/clients/3/rules')
            .set('Authorization', `Bearer ${tokenTrainer}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].exercise_name).toBe('Squat')
    })
})

describe('PUT /api/trainer/clients/:clientId/rules/:exerciseId', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se rules non è un array', async () => {
        Trainer.isMyClient.mockResolvedValue(true)

        const res = await request(app)
            .put('/api/trainer/clients/3/rules/1')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ rules: 'non-valido' })

        expect(res.status).toBe(400)
    })

    it('risponde 403 se il cliente non appartiene al trainer', async () => {
        Trainer.isMyClient.mockResolvedValue(false)

        const res = await request(app)
            .put('/api/trainer/clients/3/rules/1')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ rules: regolaOverride })

        expect(res.status).toBe(403)
    })

    it('risponde 200 e salva la regola', async () => {
        Trainer.isMyClient.mockResolvedValue(true)
        TrainerRules.upsert.mockResolvedValue()

        const res = await request(app)
            .put('/api/trainer/clients/3/rules/1')
            .set('Authorization', `Bearer ${tokenTrainer}`)
            .send({ rules: regolaOverride })

        expect(res.status).toBe(200)
        expect(TrainerRules.upsert).toHaveBeenCalledWith(1, '3', '1', regolaOverride)
    })
})

describe('DELETE /api/trainer/clients/:clientId/rules/:exerciseId', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 404 se la regola non esiste', async () => {
        TrainerRules.delete.mockResolvedValue(false)

        const res = await request(app)
            .delete('/api/trainer/clients/3/rules/1')
            .set('Authorization', `Bearer ${tokenTrainer}`)

        expect(res.status).toBe(404)
    })

    it('risponde 200 e rimuove la regola', async () => {
        TrainerRules.delete.mockResolvedValue(true)

        const res = await request(app)
            .delete('/api/trainer/clients/3/rules/1')
            .set('Authorization', `Bearer ${tokenTrainer}`)

        expect(res.status).toBe(200)
        expect(TrainerRules.delete).toHaveBeenCalledWith(1, '3', '1')
    })
})
