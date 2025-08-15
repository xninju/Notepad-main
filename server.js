const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/add-note', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'files', maxCount: 10 }]), async (req, res) => {
  let { title, content, color } = req.body;
  content = content || '';
  const images = req.files?.images?.map(file => file.buffer.toString('base64')) || [];
  const image_types = req.files?.images?.map(file => file.mimetype) || [];
  const files = req.files?.files?.map(file => file.buffer.toString('base64')) || [];
  const filenames = req.files?.files?.map(file => file.originalname) || [];
  const filetypes = req.files?.files?.map(file => file.mimetype) || [];

  try {
    await pool.query(
      'INSERT INTO notes (title, content, images, image_types, files, filenames, filetypes, color, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
      [title, content, images, image_types, files, filenames, filetypes, color]
    );
    res.status(200).send('Note saved');
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).send('Error saving note');
  }
});

app.get('/get-notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE deleted = false ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).send('Error fetching notes');
  }
});

app.put('/update-note/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    await pool.query('UPDATE notes SET title = $1, content = $2 WHERE id = $3', [title, content || '', id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send('Error updating note');
  }
});

app.put('/restore-note/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notes SET deleted = false, deleted_at = NULL WHERE id = $1', [id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error restoring note:', error);
    res.status(500).json({ error: 'Failed to restore note' });
  }
});

app.delete('/permanently-delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    res.status(500).json({ error: 'Failed to permanently delete note' });
  }
});

app.delete('/delete-note/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notes SET deleted = true WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Error deleting note');
  }
});

app.listen(port, () => {
  console.log(`NotaForge server running on port ${port}`);
});
