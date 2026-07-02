import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import db from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations')

async function ensureMigrationsTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `)
}

async function getApplied() {
    const [rows] = await db.execute('SELECT filename FROM schema_migrations')
    return new Set(rows.map(r => r.filename))
}

async function runMigration(filename, sql) {
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const stmt of statements) {
        await db.execute(stmt)
    }
    await db.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [filename])
}

async function migrate() {
    await ensureMigrationsTable()
    const applied = await getApplied()

    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort()

    const pending = files.filter(f => !applied.has(f))

    if (pending.length === 0) {
        console.log('✅ Nessuna migrazione da applicare.')
        await db.end()
        return
    }

    console.log(`🔄 ${pending.length} migrazione/i da applicare...`)
    for (const file of pending) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
        await runMigration(file, sql)
        console.log(`   ✓ ${file}`)
    }

    console.log('✅ Migrazioni completate.')
    await db.end()
}

migrate().catch(err => {
    console.error('❌ Errore durante le migrazioni:', err.message)
    process.exit(1)
})
