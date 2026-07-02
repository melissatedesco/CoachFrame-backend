import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import staff from '../middlewares/staffMiddleware.js'
import { validate, rules } from '../middlewares/validate.js'
import {
    getAllExercises, getExerciseById,
    createExercise, updateExercise, deleteExercise,
    addEquipmentToExercise, removeEquipmentFromExercise,
    getEffectiveRules,
} from '../controllers/exerciseController.js'

const router = express.Router()

const exerciseValidation = validate([
    rules.required('name', 'Nome'),
    rules.required('muscle_group', 'Gruppo muscolare'),
    rules.required('difficulty', 'Difficoltà')
])

// rotte accessibili a tutti gli utenti loggati
router.get('/', protect, getAllExercises)
router.get('/:id/rules', protect, getEffectiveRules)
router.get('/:id', protect, getExerciseById)

// rotte admin + trainer (con ownership check nel controller per i trainer)
router.post('/', protect, staff, exerciseValidation, createExercise)
router.put('/:id', protect, staff, exerciseValidation, updateExercise)
router.delete('/:id', protect, staff, deleteExercise)

// gestione attrezzi collegati a un esercizio
router.post('/:id/equipment/:equipmentId', protect, staff, addEquipmentToExercise)
router.delete('/:id/equipment/:equipmentId', protect, staff, removeEquipmentFromExercise)

export default router
