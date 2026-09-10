import Trainer from '../models/trainerModel.js'
import TrainerRules from '../models/trainerRulesModel.js'

export const getClients = async (req, res, next) => {
    try {
        const clients = await Trainer.getClients(req.user.id)
        res.json(clients)
    } catch (e) { next(e) }
}

export const addClient = async (req, res, next) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: 'Email obbligatoria.' })
        const result = await Trainer.addClientByEmail(req.user.id, email)
        if (result.error) return res.status(400).json({ message: result.error })
        res.status(201).json({ message: 'Cliente aggiunto.', client: result.client })
    } catch (e) { next(e) }
}

export const removeClient = async (req, res, next) => {
    try {
        const ok = await Trainer.removeClient(req.user.id, req.params.clientId)
        if (!ok) return res.status(404).json({ message: 'Cliente non trovato.' })
        res.json({ message: 'Cliente rimosso.' })
    } catch (e) { next(e) }
}

export const getClientStats = async (req, res, next) => {
    try {
        const { clientId } = req.params
        const isMine = await Trainer.isMyClient(req.user.id, clientId)
        if (!isMine && req.user.role !== 'admin') return res.status(403).json({ message: 'Accesso negato.' })
        const stats = await Trainer.getClientStats(clientId)
        res.json(stats)
    } catch (e) { next(e) }
}

export const getClientSessions = async (req, res, next) => {
    try {
        const { clientId } = req.params
        const isMine = await Trainer.isMyClient(req.user.id, clientId)
        if (!isMine && req.user.role !== 'admin') return res.status(403).json({ message: 'Accesso negato.' })
        const sessions = await Trainer.getClientSessions(clientId)
        res.json(sessions)
    } catch (e) { next(e) }
}

export const assignProgram = async (req, res, next) => {
    try {
        const { clientId } = req.params
        const { programId } = req.body
        if (!programId) return res.status(400).json({ message: 'programId obbligatorio.' })
        const isMine = await Trainer.isMyClient(req.user.id, clientId)
        if (!isMine && req.user.role !== 'admin') return res.status(403).json({ message: 'Accesso negato.' })
        const result = await Trainer.assignProgram(req.user.id, clientId, programId)
        if (result.error) return res.status(400).json({ message: result.error })
        res.status(201).json({ message: 'Programma assegnato.', id: result.id })
    } catch (e) { next(e) }
}

export const removeAssignment = async (req, res, next) => {
    try {
        const ok = await Trainer.removeAssignment(req.user.id, req.params.assignmentId)
        if (!ok) return res.status(404).json({ message: 'Assegnazione non trovata.' })
        res.json({ message: 'Assegnazione rimossa.' })
    } catch (e) { next(e) }
}

export const getOverview = async (req, res, next) => {
    try {
        const overview = await Trainer.getOverview(req.user.id)
        res.json(overview)
    } catch (e) { next(e) }
}

export const getClientProgress = async (req, res, next) => {
    try {
        const { clientId } = req.params
        const isMine = await Trainer.isMyClient(req.user.id, clientId)
        if (!isMine && req.user.role !== 'admin') return res.status(403).json({ message: 'Accesso negato.' })
        const progress = await Trainer.getClientProgress(clientId)
        res.json(progress)
    } catch (e) { next(e) }
}

export const getClientAssignments = async (req, res, next) => {
    try {
        const { clientId } = req.params
        const isMine = await Trainer.isMyClient(req.user.id, clientId)
        if (!isMine && req.user.role !== 'admin') return res.status(403).json({ message: 'Accesso negato.' })
        const assignments = await Trainer.getClientAssignments(clientId)
        res.json(assignments)
    } catch (e) { next(e) }
}

// GET /api/trainer/clients/:clientId/rules — tutte le regole personalizzate del cliente
export const getClientRules = async (req, res, next) => {
    try {
        const { clientId } = req.params
        const isMine = await Trainer.isMyClient(req.user.id, clientId)
        if (!isMine && req.user.role !== 'admin') return res.status(403).json({ message: 'Accesso negato.' })
        const rules = await TrainerRules.getForClient(req.user.id, clientId)
        res.json(rules)
    } catch (e) { next(e) }
}

// PUT /api/trainer/clients/:clientId/rules/:exerciseId — crea o aggiorna regola
export const upsertClientRule = async (req, res, next) => {
    try {
        const { clientId, exerciseId } = req.params
        const { rules } = req.body
        if (!rules || !Array.isArray(rules)) {
            return res.status(400).json({ message: 'Il campo "rules" deve essere un array.' })
        }
        const isMine = await Trainer.isMyClient(req.user.id, clientId)
        if (!isMine && req.user.role !== 'admin') return res.status(403).json({ message: 'Accesso negato.' })
        await TrainerRules.upsert(req.user.id, clientId, exerciseId, rules)
        res.json({ message: 'Regola salvata.' })
    } catch (e) { next(e) }
}

// DELETE /api/trainer/clients/:clientId/rules/:exerciseId — rimuovi regola
export const deleteClientRule = async (req, res, next) => {
    try {
        const { clientId, exerciseId } = req.params
        const ok = await TrainerRules.delete(req.user.id, clientId, exerciseId)
        if (!ok) return res.status(404).json({ message: 'Regola non trovata.' })
        res.json({ message: 'Regola rimossa.' })
    } catch (e) { next(e) }
}
