import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import {
    startSession, closeSession,
    getMySessions, getSessionById,
    logExercise, getMyStats, getExerciseHistory,
    logSet, getSets,
} from '../controllers/sessionController.js'

const router = express.Router()

// route statiche prima dei parametri dinamici per evitare conflitti
router.get('/stats', protect, getMyStats)
router.get('/exercises/:exerciseId/history', protect, getExerciseHistory)

router.get('/', protect, getMySessions)
router.post('/', protect, startSession)
router.get('/:id', protect, getSessionById)
router.patch('/:id/close', protect, closeSession)
router.post('/:id/exercises', protect, logExercise)

// dati per serie singola (RF-AI2)
router.post('/:sessionId/exercises/:seId/sets', protect, logSet)
router.get('/:sessionId/exercises/:seId/sets',  protect, getSets)

export default router
