import db from '../config/db.js'

const SessionSets = {

    // salva i dati di una singola serie (inviati dalla frontend dopo ogni set)
    add: async (sessionExerciseId, setNumber, repsDone, angleData, formScore) => {
        const [result] = await db.execute(
            `INSERT INTO session_exercise_sets
             (session_exercise_id, set_number, reps_done, angle_data, form_score)
             VALUES (?, ?, ?, ?, ?)`,
            [sessionExerciseId, setNumber, repsDone,
             angleData ? JSON.stringify(angleData) : null, formScore ?? null]
        )
        return result.insertId
    },

    // dettaglio serie di un session_exercise (per dashboard trainer)
    getBySessionExercise: async (sessionExerciseId) => {
        const [rows] = await db.execute(
            `SELECT id, set_number, reps_done, angle_data, form_score
             FROM session_exercise_sets
             WHERE session_exercise_id = ?
             ORDER BY set_number`,
            [sessionExerciseId]
        )
        return rows
    },
}

export default SessionSets
