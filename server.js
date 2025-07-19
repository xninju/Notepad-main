const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL setup
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_bM8CYSioIA9J@ep-dry-base-adb3jm03-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
app.post('/notes', upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const image = req.files.image ? req.files.image[0].buffer.toString('base64') : null;
    const file = req.files.file ? req.files.file[0].buffer.toString('base64') : null;

    const query = `
      INSERT INTO notes (title, content, image, file, color, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [title, content, image, file, color];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving note:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

app.get('/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE deleted = false ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.put('/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const { id } = req.params;
    await pool.query('UPDATE notes SET title = $1, content = $2 WHERE id = $3', [title, content, id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notes SET deleted = true WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
