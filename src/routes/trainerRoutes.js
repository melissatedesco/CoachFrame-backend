import { Router } from 'express'
import protect from '../middlewares/authMiddleware.js'
import trainer from '../middlewares/trainerMiddleware.js'
import {
    getClients, addClient, removeClient,
    getClientStats, getClientSessions,
    assignProgram, removeAssignment, getClientAssignments,
    getOverview, getClientProgress,
    getClientRules, upsertClientRule, deleteClientRule,
} from '../controllers/trainerController.js'

const router = Router()

router.use(protect, trainer)

// panoramica tutti i clienti
router.get('/overview',                                getOverview)

// clienti
router.get('/clients',                                 getClients)
router.post('/clients',                                addClient)
router.delete('/clients/:clientId',                    removeClient)

// dati di un cliente
router.get('/clients/:clientId/stats',                 getClientStats)
router.get('/clients/:clientId/sessions',              getClientSessions)
router.get('/clients/:clientId/assignments',           getClientAssignments)
router.get('/clients/:clientId/progress',              getClientProgress)

// assegnazione programmi
router.post('/clients/:clientId/assign/:programId',    assignProgram)
router.delete('/assignments/:assignmentId',            removeAssignment)

// regole d'angolo personalizzate (RF-AI1)
router.get('/clients/:clientId/rules',                 getClientRules)
router.put('/clients/:clientId/rules/:exerciseId',     upsertClientRule)
router.delete('/clients/:clientId/rules/:exerciseId',  deleteClientRule)

export default router
