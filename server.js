// server.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const upload = multer();

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_bM8CYSioIA9J@ep-dry-base-adb3jm03-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.post('/api/notes', upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res) => {
  const { title, content } = req.body;
  const image = req.files['image']?.[0]?.buffer.toString('base64') || null;
  const file = req.files['file']?.[0]?.buffer.toString('base64') || null;
  const created_at = new Date().toISOString();

  try {
    const result = await pool.query(
      'INSERT INTO notes (title, content, image, file, created_at, deleted) VALUES ($1, $2, $3, $4, $5, false) RETURNING *',
      [title, content, image, file, created_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving note');
  }
});

app.get('/api/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE deleted = false ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error retrieving notes');
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { title, content } = req.body;
  try {
    await pool.query('UPDATE notes SET title = $1, content = $2 WHERE id = $3', [title, content, req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send('Error updating note');
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await pool.query('UPDATE notes SET deleted = true WHERE id = $1', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send('Error deleting note');
  }
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "Connected", time: result.rows[0] });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ error: "DB connection failed" });
  }
});


app.listen(port, () => console.log(`Server running on port ${port}`));
