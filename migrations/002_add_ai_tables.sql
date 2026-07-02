-- RF-AI1: regole d'angolo personalizzate dal trainer per singolo cliente
CREATE TABLE IF NOT EXISTS trainer_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    client_id INT NOT NULL,
    exercise_id INT NOT NULL,
    rules JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_trainer_client_exercise (trainer_id, client_id, exercise_id),
    FOREIGN KEY (trainer_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- RF-AI2: dettaglio per singola serie con dati angolari da MediaPipe
CREATE TABLE IF NOT EXISTS session_exercise_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_exercise_id INT NOT NULL,
    set_number TINYINT UNSIGNED NOT NULL,
    reps_done INT NOT NULL DEFAULT 0,
    angle_data JSON,
    form_score TINYINT UNSIGNED,
    FOREIGN KEY (session_exercise_id) REFERENCES session_exercises(id) ON DELETE CASCADE
);
