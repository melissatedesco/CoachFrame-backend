import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { json } from 'express'
import jwt from 'jsonwebtoken'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

vi.mock('../../models/exerciseModel.js', () => ({
    default: {
        getAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        isOwner: vi.fn(),
        addEquipment: vi.fn(),
        removeEquipment: vi.fn()
    }
}))
vi.mock('../../models/trainerRulesModel.js', () => ({
    default: { getForUser: vi.fn() }
}))
vi.mock('../../config/db.js', () => ({ default: {} }))

import Exercise from '../../models/exerciseModel.js'
import TrainerRules from '../../models/trainerRulesModel.js'
import exerciseRoutes from '../../routes/exerciseRoutes.js'

const SECRET = 'super_secret_key_per_i_token_jwt'
const tokenUser  = jwt.sign({ id: 1, role: 'user' },  SECRET, { expiresIn: '1h' })
const tokenAdmin = jwt.sign({ id: 2, role: 'admin' }, SECRET, { expiresIn: '1h' })

const app = express()
app.use(json())
app.use('/api/exercises', exerciseRoutes)
app.use(notFound)
app.use(errorHandler)

const esercizioMock = {
    id: 1, name: 'Squat', muscle_group: 'gambe',
    difficulty: 'principiante', equipment: []
}

describe('GET /api/exercises', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 senza token', async () => {
        const res = await request(app).get('/api/exercises')
        expect(res.status).toBe(401)
    })

    it('risponde 200 con lista esercizi', async () => {
        Exercise.getAll.mockResolvedValue([esercizioMock])

        const res = await request(app)
            .get('/api/exercises')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
    })

    it('passa i filtri query al model', async () => {
        Exercise.getAll.mockResolvedValue([])

        await request(app)
            .get('/api/exercises?muscle_group=gambe&difficulty=principiante')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(Exercise.getAll).toHaveBeenCalledWith(
            expect.objectContaining({ muscle_group: 'gambe', difficulty: 'principiante' })
        )
    })
})

describe('GET /api/exercises/:id', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 404 se esercizio non esiste', async () => {
        Exercise.findById.mockResolvedValue(null)

        const res = await request(app)
            .get('/api/exercises/999')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(404)
    })

    it('risponde 200 con dettaglio esercizio', async () => {
        Exercise.findById.mockResolvedValue(esercizioMock)

        const res = await request(app)
            .get('/api/exercises/1')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body.name).toBe('Squat')
    })
})

describe('POST /api/exercises', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se utente non è admin', async () => {
        const res = await request(app)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ name: 'Squat', muscle_group: 'gambe', difficulty: 'principiante' })

        expect(res.status).toBe(403)
    })

    it('risponde 400 se mancano campi obbligatori', async () => {
        const res = await request(app)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ name: 'Squat' })

        expect(res.status).toBe(400)
    })

    it('risponde 201 se admin crea esercizio correttamente', async () => {
        Exercise.create.mockResolvedValue(10)

        const res = await request(app)
            .post('/api/exercises')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ name: 'Squat', muscle_group: 'gambe', difficulty: 'principiante' })

        expect(res.status).toBe(201)
        expect(res.body.id).toBe(10)
    })
})

describe('GET /api/exercises/:id/rules', () => {
    beforeEach(() => vi.clearAllMocks())

    const regolaDefault = [{ joint: 'knee', min: 70, max: 175, phase: 'down' }]

    it('risponde 401 senza token', async () => {
        const res = await request(app).get('/api/exercises/1/rules')
        expect(res.status).toBe(401)
    })

    it('risponde 404 se esercizio non esiste', async () => {
        Exercise.findById.mockResolvedValue(null)

        const res = await request(app)
            .get('/api/exercises/999/rules')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(404)
    })

    it('restituisce le regole di default se non c\'è override trainer', async () => {
        Exercise.findById.mockResolvedValue({ ...esercizioMock, angle_rules: regolaDefault })
        TrainerRules.getForUser.mockResolvedValue(null)

        const res = await request(app)
            .get('/api/exercises/1/rules')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body.source).toBe('default')
        expect(res.body.rules).toEqual(regolaDefault)
    })

    it('restituisce l\'override del trainer se presente', async () => {
        const regolaOverride = [{ joint: 'knee', min: 100, max: 175, phase: 'down' }]
        Exercise.findById.mockResolvedValue({ ...esercizioMock, angle_rules: regolaDefault })
        TrainerRules.getForUser.mockResolvedValue(regolaOverride)

        const res = await request(app)
            .get('/api/exercises/1/rules')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body.source).toBe('trainer')
        expect(res.body.rules[0].min).toBe(100)
    })
})
