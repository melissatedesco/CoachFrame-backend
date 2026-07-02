import db from '../config/db.js'

const TrainerRules = {

    // crea o aggiorna le regole per un cliente+esercizio
    upsert: async (trainerId, clientId, exerciseId, rules) => {
        await db.execute(
            `INSERT INTO trainer_rules (trainer_id, client_id, exercise_id, rules)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rules = VALUES(rules)`,
            [trainerId, clientId, exerciseId, JSON.stringify(rules)]
        )
    },

    // regole di un cliente per un esercizio specifico
    get: async (trainerId, clientId, exerciseId) => {
        const [[row]] = await db.execute(
            `SELECT id, rules FROM trainer_rules
             WHERE trainer_id = ? AND client_id = ? AND exercise_id = ?`,
            [trainerId, clientId, exerciseId]
        )
        return row ?? null
    },

    // tutte le regole personalizzate di un cliente (per la dashboard trainer)
    getForClient: async (trainerId, clientId) => {
        const [rows] = await db.execute(
            `SELECT tr.id, tr.exercise_id, tr.rules, tr.created_at,
                    e.name AS exercise_name, e.muscle_group
             FROM trainer_rules tr
             JOIN exercises e ON e.id = tr.exercise_id
             WHERE tr.trainer_id = ? AND tr.client_id = ?
             ORDER BY e.name`,
            [trainerId, clientId]
        )
        return rows
    },

    // regole attive per un utente su un esercizio (usato dalla frontend durante la sessione)
    getForUser: async (clientId, exerciseId) => {
        const [[row]] = await db.execute(
            `SELECT tr.rules
             FROM trainer_rules tr
             JOIN trainer_clients tc ON tc.trainer_id = tr.trainer_id AND tc.client_id = ?
             WHERE tr.client_id = ? AND tr.exercise_id = ?
             LIMIT 1`,
            [clientId, clientId, exerciseId]
        )
        return row?.rules ?? null
    },

    delete: async (trainerId, clientId, exerciseId) => {
        const [result] = await db.execute(
            `DELETE FROM trainer_rules
             WHERE trainer_id = ? AND client_id = ? AND exercise_id = ?`,
            [trainerId, clientId, exerciseId]
        )
        return result.affectedRows > 0
    },
}

export default TrainerRules
