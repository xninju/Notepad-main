// Express server for ZapNote backend

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');

// Neon DB connection string
const NEON_DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_7vmHVs2FXubz@ep-yellow-lake-adm5qml0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: NEON_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // Serves index.html, style.css, app.js, etc.

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create table if it doesn't exist
const createTable = `
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)`;
pool.query(createTable);

// GET all notes
app.get('/api/notes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notes' });
  }
});

// POST a new note with optional image
app.post('/api/notes', upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Note content required' });
    }

    let base64Image = null;
    if (req.file) {
      base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const { rows } = await pool.query(
      'INSERT INTO notes (content, image) VALUES ($1, $2) RETURNING *',
      [content, base64Image]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// DELETE a note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ZapNote backend running on port ${PORT}`));
