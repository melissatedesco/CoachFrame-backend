import { createPool } from 'mysql2'
import 'dotenv/config'

// crea un pool di connessioni usando le variabili del file .env
const pool = createPool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
})

// esporta il pool convertito in "promises" per poter usare async/await nel codice
const promisePool = pool.promise()

// testa la connessione all'avvio, riprovando se il DB non è ancora pronto
const testConnection = (retries = 5, delay = 2000) => {
    pool.getConnection((err, connection) => {
        if (err) {
            if (retries > 0) {
                console.warn(`Connessione al database non riuscita, nuovo tentativo tra ${delay / 1000}s (${retries} rimasti)...`)
                setTimeout(() => testConnection(retries - 1, delay), delay)
            } else {
                console.error("Errore di connessione al database MySQL:", err.message)
            }
        } else {
            console.log("Connessione al database MySQL avvenuta con successo")
            connection.release()
        }
    })
}

testConnection()

export default promisePool
