import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import db from './config/db.js';

import authRoutes         from './routes/authRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import equipmentRoutes    from './routes/equipmentRoutes.js';
import exerciseRoutes     from './routes/exerciseRoutes.js';
import programRoutes      from './routes/programRoutes.js';
import sessionRoutes      from './routes/sessionRoutes.js';
import trainerRoutes      from './routes/trainerRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ strictTransportSecurity: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true)
        else callback(new Error(`Origine non autorizzata dal CORS: ${origin}`))
    },
    credentials: true
}));

app.use(json());

app.use((req, res, next) => {
    // logga solo metodo e path, mai query string (potrebbe contenere token)
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.json({ message: "Benvenuto nell'APP di CoachFrame! Il Coach virtuale è attivo 🏋️‍♂️" });
});

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs',  programRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/trainer',   trainerRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`✅ Server in esecuzione sulla porta ${PORT}`);
});
