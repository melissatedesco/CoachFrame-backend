import bcrypt from 'bcrypt'
import db from './config/db.js'

// ─── UTENTI ────────────────────────────────────────────────────────────────

const users = [
    { name: 'Admin',    surname: 'CoachFrame', email: 'admin@coachframe.it',   password: 'Admin123!',  role: 'admin' },
    { name: 'Melissa',  surname: 'Tedesco',    email: 'melissa@coachframe.it', password: 'User123!',   role: 'trainer' },
    { name: 'Marco',    surname: 'Bianchi',    email: 'marco@coachframe.it',   password: 'User123!',   role: 'user'  },
    { name: 'Sofia',    surname: 'Ricci',      email: 'sofia@coachframe.it',   password: 'User123!',   role: 'user'  },
]

// ─── ATTREZZATURA ──────────────────────────────────────────────────────────

const equipment = [
    { name: 'Corpo libero',          category: 'corpo_libero' },
    { name: 'Sedia',                 category: 'oggetti_casa' },
    { name: 'Bottiglie d\'acqua',    category: 'oggetti_casa' },
    { name: 'Asciugamano',           category: 'oggetti_casa' },
    { name: 'Zaino con peso',        category: 'oggetti_casa' },
    { name: 'Muro',                  category: 'oggetti_casa' },
    { name: 'Manubri',               category: 'pesi'         },
    { name: 'Kettlebell',            category: 'pesi'         },
    { name: 'Banda di resistenza',   category: 'elastici'     },
]

// indici (1-based, inseriti nell'ordine sopra)
const EQ = { LIBERO: 1, SEDIA: 2, BOTTIGLIE: 3, ASCIUGAMANO: 4, ZAINO: 5, MURO: 6, MANUBRI: 7, KETTLEBELL: 8, BANDA: 9 }

// ─── ESERCIZI ──────────────────────────────────────────────────────────────
// angle_rules: array di regole per il coach virtuale
// joint: articolazione rilevata da MediaPipe
// phase: "down" = punto basso del movimento, "up" = punto alto
// min/max: range angolare valido in gradi

const exercises = [
    // ── CORPO LIBERO ──────────────────────────────────────────────────────
    {
        name: 'Squat',
        description: 'Esercizio fondamentale per gambe e glutei. Piedi larghezza spalle, scendi fino a che le cosce siano parallele al suolo.',
        muscle_group: 'gambe', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'knee',  min: 70,  max: 175, phase: 'down', side: 'both' },
            { joint: 'hip',   min: 60,  max: 170, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Affondi',
        description: 'Passo avanti con il piede destro, scendi fino a toccare quasi il pavimento col ginocchio posteriore. Alterna le gambe.',
        muscle_group: 'gambe', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 80, max: 175, phase: 'down', side: 'front' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Affondi laterali',
        description: 'Passo laterale ampio, piega la gamba che avanza mantenendo l\'altra tesa. Ottimo per l\'interno coscia.',
        muscle_group: 'gambe', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 75, max: 175, phase: 'down', side: 'both' },
            { joint: 'hip',  min: 50, max: 160, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Push-up',
        description: 'Classico piegamento sulle braccia. Corpo rigido come una tavola, scendi fino a sfiorare il pavimento col petto.',
        muscle_group: 'petto', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'elbow', min: 70,  max: 175, phase: 'down', side: 'both' },
            { joint: 'hip',   min: 160, max: 190, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Push-up diamante',
        description: 'Mani ravvicinate a formare un diamante sotto il petto. Isola maggiormente i tricipiti.',
        muscle_group: 'braccia', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'elbow', min: 65, max: 175, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Plank',
        description: 'Posizione isometrica. Appoggiati su avambracci e punte dei piedi, mantieni il corpo allineato per il tempo stabilito.',
        muscle_group: 'core', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'hip',    min: 160, max: 195, phase: 'hold', side: 'both' },
            { joint: 'shoulder', min: 75, max: 105, phase: 'hold', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Crunch',
        description: 'Sdraiato, piedi a terra, mani dietro la testa. Solleva le spalle contraendo gli addominali.',
        muscle_group: 'core', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'hip', min: 40, max: 100, phase: 'up', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Mountain climber',
        description: 'In posizione di plank, porta le ginocchia alternativamente verso il petto a ritmo veloce.',
        muscle_group: 'core', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 30, max: 90,  phase: 'up',   side: 'both' },
            { joint: 'hip',  min: 155, max: 190, phase: 'hold', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Burpee',
        description: 'Esercizio full body: squat, plank, push-up, salto. Eseguito in sequenza continua.',
        muscle_group: 'full body', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'knee',   min: 65, max: 175, phase: 'down', side: 'both' },
            { joint: 'elbow',  min: 70, max: 175, phase: 'push', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Squat jump',
        description: 'Squat esplosivo con salto. Scendi nella posizione di squat e spingi verso l\'alto con forza massima.',
        muscle_group: 'gambe', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 65, max: 175, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },
    {
        name: 'Pistol squat assistito',
        description: 'Squat su una gamba sola tenendosi a un supporto per l\'equilibrio. Sviluppa forza unilaterale.',
        muscle_group: 'gambe', difficulty: 'avanzato',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 55, max: 175, phase: 'down', side: 'both' },
            { joint: 'hip',  min: 50, max: 160, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.LIBERO, EQ.MURO]
    },
    {
        name: 'Hollow body hold',
        description: 'Sdraiato, braccia sopra la testa, solleva gambe e spalle da terra mantenendo la schiena piatta.',
        muscle_group: 'core', difficulty: 'avanzato',
        media_url: null,
        angle_rules: [
            { joint: 'hip', min: 30, max: 70, phase: 'hold', side: 'both' }
        ],
        equipment: [EQ.LIBERO]
    },

    // ── OGGETTI DI CASA ───────────────────────────────────────────────────
    {
        name: 'Tricep dip su sedia',
        description: 'Mani sul bordo della sedia dietro di te, piega i gomiti e scendi. Isola i tricipiti.',
        muscle_group: 'braccia', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'elbow', min: 70, max: 175, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.SEDIA]
    },
    {
        name: 'Step-up su sedia',
        description: 'Sali e scendi da una sedia robusta alternando la gamba che guida. Potenzia quadricipiti e glutei.',
        muscle_group: 'gambe', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 80, max: 175, phase: 'up', side: 'both' }
        ],
        equipment: [EQ.SEDIA]
    },
    {
        name: 'Bulgarian split squat',
        description: 'Piede posteriore sul sedile della sedia, scendi con la gamba anteriore. Esercizio avanzato per gambe e glutei.',
        muscle_group: 'gambe', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 75, max: 170, phase: 'down', side: 'front' },
            { joint: 'hip',  min: 70, max: 160, phase: 'down', side: 'front' }
        ],
        equipment: [EQ.SEDIA]
    },
    {
        name: 'Curl con bottiglie',
        description: 'Tieni due bottiglie d\'acqua piene, fletti i gomiti portando le bottiglie alle spalle. Allena i bicipiti.',
        muscle_group: 'braccia', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'elbow', min: 35, max: 155, phase: 'up', side: 'both' }
        ],
        equipment: [EQ.BOTTIGLIE]
    },
    {
        name: 'Press sopra la testa con bottiglie',
        description: 'Bottiglie sulle spalle, spingi verso l\'alto fino a braccia distese. Allena spalle e tricipiti.',
        muscle_group: 'spalle', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'elbow',   min: 160, max: 185, phase: 'up',   side: 'both' },
            { joint: 'shoulder', min: 155, max: 185, phase: 'up',  side: 'both' }
        ],
        equipment: [EQ.BOTTIGLIE]
    },
    {
        name: 'Squat con zaino',
        description: 'Indossa uno zaino carico, esegui lo squat con il peso aggiuntivo. Aumenta il carico progressivamente.',
        muscle_group: 'gambe', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 70, max: 175, phase: 'down', side: 'both' },
            { joint: 'hip',  min: 60, max: 165, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.ZAINO]
    },
    {
        name: 'Wall sit',
        description: 'Schiena al muro, scendi fino a cosce parallele al pavimento. Mantieni la posizione isometrica.',
        muscle_group: 'gambe', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 85, max: 100, phase: 'hold', side: 'both' }
        ],
        equipment: [EQ.MURO]
    },

    // ── ELASTICI ──────────────────────────────────────────────────────────
    {
        name: 'Squat con banda',
        description: 'Banda sotto i piedi e sopra le spalle. Lo squat diventa più difficile nella fase di salita.',
        muscle_group: 'gambe', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'knee', min: 70, max: 175, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.BANDA]
    },
    {
        name: 'Rowing con banda',
        description: 'Banda ancorata davanti, tira verso l\'addome tenendo i gomiti vicino al corpo. Allena il dorsale.',
        muscle_group: 'schiena', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'elbow',   min: 50,  max: 165, phase: 'pull', side: 'both' },
            { joint: 'shoulder', min: 0,  max: 45,  phase: 'pull', side: 'both' }
        ],
        equipment: [EQ.BANDA]
    },
    {
        name: 'Chest press con banda',
        description: 'Banda ancorata dietro, spingi in avanti come una distensione su panca. Allena il petto.',
        muscle_group: 'petto', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'elbow',    min: 155, max: 185, phase: 'press', side: 'both' },
            { joint: 'shoulder', min: 80,  max: 100, phase: 'press', side: 'both' }
        ],
        equipment: [EQ.BANDA]
    },
    {
        name: 'Hip thrust con banda',
        description: 'Sdraiato, banda sopra i fianchi, spingi il bacino verso l\'alto. Isola perfettamente i glutei.',
        muscle_group: 'glutei', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'hip',  min: 155, max: 185, phase: 'up',   side: 'both' },
            { joint: 'knee', min: 85,  max: 100, phase: 'hold', side: 'both' }
        ],
        equipment: [EQ.BANDA]
    },

    // ── PESI ──────────────────────────────────────────────────────────────
    {
        name: 'Curl con manubri',
        description: 'Fletti i gomiti portando i manubri alle spalle con controllo. Alternato o simultaneo.',
        muscle_group: 'braccia', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'elbow', min: 35, max: 155, phase: 'up', side: 'both' }
        ],
        equipment: [EQ.MANUBRI]
    },
    {
        name: 'Press con manubri',
        description: 'Seduto o in piedi, spingi i manubri sopra la testa fino a braccia distese. Allena spalle e tricipiti.',
        muscle_group: 'spalle', difficulty: 'principiante',
        media_url: null,
        angle_rules: [
            { joint: 'elbow',    min: 155, max: 185, phase: 'up', side: 'both' },
            { joint: 'shoulder', min: 155, max: 185, phase: 'up', side: 'both' }
        ],
        equipment: [EQ.MANUBRI]
    },
    {
        name: 'Stacco rumeno con manubri',
        description: 'Piedi larghezza fianchi, scendi portando i manubri lungo le gambe piegando i fianchi. Allena posteriore coscia e glutei.',
        muscle_group: 'gambe', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'hip',  min: 40, max: 170, phase: 'down', side: 'both' },
            { joint: 'knee', min: 155, max: 180, phase: 'down', side: 'both' }
        ],
        equipment: [EQ.MANUBRI]
    },
    {
        name: 'Rematore con manubrio',
        description: 'Appoggiato alla sedia con un ginocchio, tira il manubrio verso il fianco. Unilaterale, allena il dorsale.',
        muscle_group: 'schiena', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'elbow',    min: 40, max: 165, phase: 'pull', side: 'both' },
            { joint: 'shoulder', min: 0,  max: 50,  phase: 'pull', side: 'both' }
        ],
        equipment: [EQ.MANUBRI, EQ.SEDIA]
    },
    {
        name: 'Swing con kettlebell',
        description: 'Gambe divaricate, spingi il kettlebell in avanti con un\'esplosione dei fianchi. Esercizio balistico full body.',
        muscle_group: 'full body', difficulty: 'intermedio',
        media_url: null,
        angle_rules: [
            { joint: 'hip',  min: 45, max: 175, phase: 'swing', side: 'both' },
            { joint: 'knee', min: 100, max: 175, phase: 'swing', side: 'both' }
        ],
        equipment: [EQ.KETTLEBELL]
    },
    {
        name: 'Turkish get-up',
        description: 'Dal pavimento in piedi con kettlebell tenuto sopra la testa, mantenendo il braccio verticale. Esercizio completo di mobilità e forza.',
        muscle_group: 'full body', difficulty: 'avanzato',
        media_url: null,
        angle_rules: [
            { joint: 'shoulder', min: 160, max: 190, phase: 'hold', side: 'both' }
        ],
        equipment: [EQ.KETTLEBELL]
    },
]

// ─── SCHEDE DI SISTEMA ─────────────────────────────────────────────────────

const programs = [
    {
        name: 'Full Body Principiante',
        description: 'Scheda completa per chi inizia. 3 allenamenti a settimana con solo corpo libero.',
        user_id: null,
        exercises: [
            { name: 'Squat',           sets: 3, reps: 12, rest_seconds: 60  },
            { name: 'Push-up',         sets: 3, reps: 10, rest_seconds: 60  },
            { name: 'Affondi',         sets: 3, reps: 10, rest_seconds: 60  },
            { name: 'Plank',           sets: 3, reps: 30, rest_seconds: 45  },
            { name: 'Crunch',          sets: 3, reps: 15, rest_seconds: 45  },
        ]
    },
    {
        name: 'Upper Body',
        description: 'Focus su petto, spalle e braccia. Richiede manubri o bottiglie.',
        user_id: null,
        exercises: [
            { name: 'Push-up',                         sets: 4, reps: 12, rest_seconds: 60 },
            { name: 'Push-up diamante',                sets: 3, reps: 8,  rest_seconds: 60 },
            { name: 'Press con manubri',               sets: 3, reps: 12, rest_seconds: 60 },
            { name: 'Curl con manubri',                sets: 3, reps: 12, rest_seconds: 60 },
            { name: 'Tricep dip su sedia',             sets: 3, reps: 10, rest_seconds: 60 },
            { name: 'Rematore con manubrio',           sets: 3, reps: 10, rest_seconds: 60 },
        ]
    },
    {
        name: 'Lower Body & Glutei',
        description: 'Gambe e glutei al massimo. Mix di corpo libero ed elastici.',
        user_id: null,
        exercises: [
            { name: 'Squat',               sets: 4, reps: 15, rest_seconds: 60 },
            { name: 'Affondi',             sets: 3, reps: 12, rest_seconds: 60 },
            { name: 'Affondi laterali',    sets: 3, reps: 10, rest_seconds: 60 },
            { name: 'Hip thrust con banda', sets: 4, reps: 15, rest_seconds: 60 },
            { name: 'Wall sit',            sets: 3, reps: 45, rest_seconds: 60 },
            { name: 'Squat jump',          sets: 3, reps: 10, rest_seconds: 90 },
        ]
    },
    {
        name: 'Core & Stabilità',
        description: 'Addominali e stabilità del tronco. Solo corpo libero, ogni giorno.',
        user_id: null,
        exercises: [
            { name: 'Plank',            sets: 4, reps: 40, rest_seconds: 30 },
            { name: 'Crunch',           sets: 3, reps: 20, rest_seconds: 30 },
            { name: 'Mountain climber', sets: 3, reps: 20, rest_seconds: 45 },
            { name: 'Hollow body hold', sets: 3, reps: 30, rest_seconds: 45 },
        ]
    },
    {
        name: 'HIIT Full Body',
        description: 'Allenamento ad alta intensità. 30 secondi di lavoro, 15 di recupero. Brucia grasso e migliora la resistenza.',
        user_id: null,
        exercises: [
            { name: 'Burpee',          sets: 4, reps: 10, rest_seconds: 30 },
            { name: 'Squat jump',      sets: 4, reps: 12, rest_seconds: 30 },
            { name: 'Mountain climber', sets: 4, reps: 20, rest_seconds: 30 },
            { name: 'Push-up',         sets: 4, reps: 10, rest_seconds: 30 },
        ]
    },
    {
        name: 'Kettlebell Power',
        description: 'Allenamento con kettlebell per forza e coordinazione.',
        user_id: null,
        exercises: [
            { name: 'Swing con kettlebell', sets: 5, reps: 15, rest_seconds: 60 },
            { name: 'Squat con zaino',      sets: 4, reps: 10, rest_seconds: 90 },
            { name: 'Turkish get-up',       sets: 3, reps: 5,  rest_seconds: 90 },
        ]
    },
]

// ─── SESSIONI (storico realistico per Melissa e Marco) ────────────────────

// generate date ISO per gli ultimi N giorni
const daysAgo = (n, hour = 9) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString().slice(0, 19).replace('T', ' ')
}

const sessionsData = [
    // Melissa (user_id 2)
    { userId: 2, programName: 'Full Body Principiante', daysAgo: 28, durationMin: 40,
      exercises: [
          { name: 'Squat',   sets_done: 3, reps_done: 12, form_score: 72 },
          { name: 'Push-up', sets_done: 3, reps_done: 8,  form_score: 65 },
          { name: 'Affondi', sets_done: 3, reps_done: 10, form_score: 70 },
          { name: 'Plank',   sets_done: 3, reps_done: 30, form_score: 80 },
          { name: 'Crunch',  sets_done: 3, reps_done: 15, form_score: 75 },
      ]},
    { userId: 2, programName: 'Full Body Principiante', daysAgo: 25, durationMin: 42,
      exercises: [
          { name: 'Squat',   sets_done: 3, reps_done: 12, form_score: 75 },
          { name: 'Push-up', sets_done: 3, reps_done: 9,  form_score: 68 },
          { name: 'Affondi', sets_done: 3, reps_done: 10, form_score: 73 },
          { name: 'Plank',   sets_done: 3, reps_done: 35, form_score: 82 },
          { name: 'Crunch',  sets_done: 3, reps_done: 15, form_score: 78 },
      ]},
    { userId: 2, programName: 'Core & Stabilità', daysAgo: 22, durationMin: 25,
      exercises: [
          { name: 'Plank',            sets_done: 4, reps_done: 40, form_score: 85 },
          { name: 'Crunch',           sets_done: 3, reps_done: 20, form_score: 80 },
          { name: 'Mountain climber', sets_done: 3, reps_done: 18, form_score: 74 },
      ]},
    { userId: 2, programName: 'Full Body Principiante', daysAgo: 18, durationMin: 45,
      exercises: [
          { name: 'Squat',   sets_done: 3, reps_done: 15, form_score: 80 },
          { name: 'Push-up', sets_done: 3, reps_done: 10, form_score: 72 },
          { name: 'Affondi', sets_done: 3, reps_done: 12, form_score: 77 },
          { name: 'Plank',   sets_done: 3, reps_done: 40, form_score: 86 },
          { name: 'Crunch',  sets_done: 3, reps_done: 18, form_score: 82 },
      ]},
    { userId: 2, programName: 'Lower Body & Glutei', daysAgo: 14, durationMin: 50,
      exercises: [
          { name: 'Squat',               sets_done: 4, reps_done: 15, form_score: 83 },
          { name: 'Affondi',             sets_done: 3, reps_done: 12, form_score: 79 },
          { name: 'Hip thrust con banda', sets_done: 4, reps_done: 15, form_score: 88 },
          { name: 'Wall sit',            sets_done: 3, reps_done: 45, form_score: 90 },
      ]},
    { userId: 2, programName: 'Core & Stabilità', daysAgo: 11, durationMin: 28,
      exercises: [
          { name: 'Plank',            sets_done: 4, reps_done: 45, form_score: 88 },
          { name: 'Crunch',           sets_done: 3, reps_done: 20, form_score: 84 },
          { name: 'Mountain climber', sets_done: 3, reps_done: 20, form_score: 78 },
          { name: 'Hollow body hold', sets_done: 3, reps_done: 25, form_score: 70 },
      ]},
    { userId: 2, programName: 'Full Body Principiante', daysAgo: 7, durationMin: 48,
      exercises: [
          { name: 'Squat',   sets_done: 3, reps_done: 15, form_score: 85 },
          { name: 'Push-up', sets_done: 3, reps_done: 12, form_score: 78 },
          { name: 'Affondi', sets_done: 3, reps_done: 12, form_score: 80 },
          { name: 'Plank',   sets_done: 3, reps_done: 45, form_score: 89 },
          { name: 'Crunch',  sets_done: 3, reps_done: 20, form_score: 85 },
      ]},
    { userId: 2, programName: 'HIIT Full Body', daysAgo: 3, durationMin: 35,
      exercises: [
          { name: 'Burpee',           sets_done: 4, reps_done: 8,  form_score: 73 },
          { name: 'Squat jump',       sets_done: 4, reps_done: 10, form_score: 80 },
          { name: 'Mountain climber', sets_done: 4, reps_done: 20, form_score: 76 },
          { name: 'Push-up',          sets_done: 4, reps_done: 10, form_score: 79 },
      ]},

    // Marco (user_id 3)
    { userId: 3, programName: 'Kettlebell Power', daysAgo: 21, durationMin: 55,
      exercises: [
          { name: 'Swing con kettlebell', sets_done: 5, reps_done: 15, form_score: 78 },
          { name: 'Squat con zaino',      sets_done: 4, reps_done: 10, form_score: 82 },
      ]},
    { userId: 3, programName: 'Upper Body', daysAgo: 17, durationMin: 60,
      exercises: [
          { name: 'Push-up',             sets_done: 4, reps_done: 15, form_score: 88 },
          { name: 'Push-up diamante',    sets_done: 3, reps_done: 10, form_score: 82 },
          { name: 'Press con manubri',   sets_done: 3, reps_done: 12, form_score: 85 },
          { name: 'Curl con manubri',    sets_done: 3, reps_done: 12, form_score: 87 },
          { name: 'Tricep dip su sedia', sets_done: 3, reps_done: 12, form_score: 84 },
      ]},
    { userId: 3, programName: 'Kettlebell Power', daysAgo: 13, durationMin: 58,
      exercises: [
          { name: 'Swing con kettlebell', sets_done: 5, reps_done: 15, form_score: 83 },
          { name: 'Squat con zaino',      sets_done: 4, reps_done: 12, form_score: 86 },
          { name: 'Turkish get-up',       sets_done: 3, reps_done: 5,  form_score: 75 },
      ]},
    { userId: 3, programName: 'Upper Body', daysAgo: 9, durationMin: 62,
      exercises: [
          { name: 'Push-up',              sets_done: 4, reps_done: 15, form_score: 90 },
          { name: 'Press con manubri',    sets_done: 4, reps_done: 12, form_score: 88 },
          { name: 'Curl con manubri',     sets_done: 4, reps_done: 12, form_score: 89 },
          { name: 'Rematore con manubrio', sets_done: 3, reps_done: 10, form_score: 85 },
      ]},
    { userId: 3, programName: 'HIIT Full Body', daysAgo: 5, durationMin: 38,
      exercises: [
          { name: 'Burpee',           sets_done: 4, reps_done: 10, form_score: 82 },
          { name: 'Squat jump',       sets_done: 4, reps_done: 12, form_score: 86 },
          { name: 'Mountain climber', sets_done: 4, reps_done: 20, form_score: 83 },
          { name: 'Push-up',          sets_done: 4, reps_done: 12, form_score: 88 },
      ]},
    { userId: 3, programName: 'Kettlebell Power', daysAgo: 1, durationMin: 60,
      exercises: [
          { name: 'Swing con kettlebell', sets_done: 5, reps_done: 20, form_score: 87 },
          { name: 'Squat con zaino',      sets_done: 4, reps_done: 12, form_score: 89 },
          { name: 'Turkish get-up',       sets_done: 3, reps_done: 5,  form_score: 80 },
      ]},
]

// ─── FUNZIONE PRINCIPALE ───────────────────────────────────────────────────

async function seed() {
    console.log('🌱 Avvio seed del database...\n')

    // 1. UTENTI
    console.log('👥 Inserimento utenti...')
    const userIds = {}
    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10)
        const [res] = await db.execute(
            'INSERT INTO users (name, surname, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [u.name, u.surname, u.email, hash, u.role]
        )
        userIds[u.email] = res.insertId
        console.log(`   ✓ ${u.name} ${u.surname} (${u.role}) — id ${res.insertId}`)
    }

    // 2. ATTREZZATURA
    console.log('\n🏋️  Inserimento attrezzatura...')
    const eqIds = {}
    for (const [i, eq] of equipment.entries()) {
        const [res] = await db.execute(
            'INSERT INTO equipment (name, category) VALUES (?, ?)',
            [eq.name, eq.category]
        )
        eqIds[i + 1] = res.insertId
        console.log(`   ✓ ${eq.name} (${eq.category}) — id ${res.insertId}`)
    }

    // 3. ATTREZZI POSSEDUTI DAGLI UTENTI
    console.log('\n🎒 Assegnazione attrezzi agli utenti...')
    // Melissa: corpo libero + sedia + bottiglie + banda
    const melissaId = userIds['melissa@coachframe.it']
    for (const eqIdx of [EQ.LIBERO, EQ.SEDIA, EQ.BOTTIGLIE, EQ.BANDA]) {
        await db.execute('INSERT INTO user_equipment (user_id, equipment_id) VALUES (?, ?)', [melissaId, eqIds[eqIdx]])
    }
    console.log('   ✓ Melissa: corpo libero, sedia, bottiglie, banda')

    // Marco: tutto
    const marcoId = userIds['marco@coachframe.it']
    for (const eqIdx of Object.keys(EQ).map(k => EQ[k])) {
        await db.execute('INSERT IGNORE INTO user_equipment (user_id, equipment_id) VALUES (?, ?)', [marcoId, eqIds[eqIdx]])
    }
    console.log('   ✓ Marco: tutta l\'attrezzatura')

    // Sofia: corpo libero + muro
    const sofiaId = userIds['sofia@coachframe.it']
    for (const eqIdx of [EQ.LIBERO, EQ.MURO]) {
        await db.execute('INSERT INTO user_equipment (user_id, equipment_id) VALUES (?, ?)', [sofiaId, eqIds[eqIdx]])
    }
    console.log('   ✓ Sofia: corpo libero, muro')

    // 4. ESERCIZI
    console.log('\n💪 Inserimento esercizi...')
    const exIds = {}
    for (const ex of exercises) {
        const [res] = await db.execute(
            'INSERT INTO exercises (name, description, muscle_group, difficulty, media_url, angle_rules) VALUES (?, ?, ?, ?, ?, ?)',
            [ex.name, ex.description, ex.muscle_group, ex.difficulty, ex.media_url, JSON.stringify(ex.angle_rules)]
        )
        exIds[ex.name] = res.insertId

        for (const eqIdx of ex.equipment) {
            await db.execute(
                'INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (?, ?)',
                [res.insertId, eqIds[eqIdx]]
            )
        }
        console.log(`   ✓ ${ex.name} (${ex.muscle_group} — ${ex.difficulty})`)
    }

    // 5. SCHEDE
    console.log('\n📋 Inserimento schede...')
    const progIds = {}
    for (const prog of programs) {
        const [res] = await db.execute(
            'INSERT INTO programs (name, description, user_id) VALUES (?, ?, ?)',
            [prog.name, prog.description, prog.user_id]
        )
        progIds[prog.name] = res.insertId

        for (const [pos, ex] of prog.exercises.entries()) {
            const exId = exIds[ex.name]
            if (!exId) { console.warn(`   ⚠ Esercizio non trovato: ${ex.name}`); continue }
            await db.execute(
                'INSERT INTO program_exercises (program_id, exercise_id, position, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)',
                [res.insertId, exId, pos + 1, ex.sets, ex.reps, ex.rest_seconds]
            )
        }
        console.log(`   ✓ ${prog.name} (${prog.exercises.length} esercizi)`)
    }

    // 6. SESSIONI
    console.log('\n📅 Inserimento sessioni...')
    for (const s of sessionsData) {
        const progId = progIds[s.programName]
        const startedAt = daysAgo(s.daysAgo, 9)
        const endedAt   = daysAgo(s.daysAgo, 9 + Math.floor(s.durationMin / 60))

        const [sRes] = await db.execute(
            'INSERT INTO sessions (user_id, program_id, started_at, ended_at) VALUES (?, ?, ?, ?)',
            [s.userId, progId, startedAt, endedAt]
        )
        const sessionId = sRes.insertId

        for (const ex of s.exercises) {
            const exId = exIds[ex.name]
            if (!exId) { console.warn(`   ⚠ Esercizio non trovato: ${ex.name}`); continue }
            await db.execute(
                'INSERT INTO session_exercises (session_id, exercise_id, sets_done, reps_done, form_score) VALUES (?, ?, ?, ?, ?)',
                [sessionId, exId, ex.sets_done, ex.reps_done, ex.form_score]
            )
        }

        const userName = s.userId === 2 ? 'Melissa' : 'Marco'
        console.log(`   ✓ ${userName} — ${s.programName} (${s.daysAgo} giorni fa, form avg: ${Math.round(s.exercises.reduce((a, e) => a + e.form_score, 0) / s.exercises.length)})`)
    }

    console.log('\n✅ Seed completato!')
    console.log('─────────────────────────────────────')
    console.log(`   Utenti:    ${users.length}`)
    console.log(`   Attrezzi:  ${equipment.length}`)
    console.log(`   Esercizi:  ${exercises.length}`)
    console.log(`   Schede:    ${programs.length}`)
    console.log(`   Sessioni:  ${sessionsData.length}`)
    console.log(`   Esercizi sessioni: ${sessionsData.reduce((a, s) => a + s.exercises.length, 0)}`)
    console.log('─────────────────────────────────────')

    process.exit(0)
}

seed().catch(err => {
    console.error('❌ Errore durante il seed:', err.message)
    process.exit(1)
})
