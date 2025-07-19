// Express server for Neon Notes backend

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Neon DB connection string from environment or hardcoded for local testing
const NEON_DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_7vmHVs2FXubz@ep-yellow-lake-adm5qml0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: NEON_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serves index.html, style.css, etc.

// Create table if not exists
const createTable = `
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)`;
pool.query(createTable);

app.get('/api/notes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notes' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') return res.status(400).json({ error: 'Note required' });
    const { rows } = await pool.query(
      'INSERT INTO notes (content) VALUES ($1) RETURNING *',
      [content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Neon Notes backend running on port ${PORT}`));
