const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_bM8CYSioIA9J@ep-dry-base-adb3jm03-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/add-note', upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res) => {
  const { title, content, color, pinned = false } = req.body;
  const image = req.files?.image?.[0]?.buffer.toString('base64') || null;

  const fileData = req.files?.file?.[0];
  const file = fileData ? fileData.buffer.toString('base64') : null;
  const filename = fileData ? fileData.originalname : null;
  const filetype = fileData ? fileData.mimetype : null;

  try {
    await pool.query(
      'INSERT INTO notes (title, content, image, file, filename, filetype, color, pinned, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
      [title, content, image, file, filename, filetype, color, pinned]
    );
    res.status(200).send('Note saved');
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).send('Error saving note');
  }
});


app.get('/get-notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE deleted = false ORDER BY pinned DESC, id DESC');
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
    await pool.query('UPDATE notes SET title = $1, content = $2 WHERE id = $3', [title, content, id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send('Error updating note');
  }
});

app.put('/restore-note/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE notes SET deleted = false, deleted_at = NULL WHERE id = $1',
      [id]
    );
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

app.patch('/pin/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE notes SET pinned = NOT pinned WHERE id = $1 RETURNING *', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Pin toggle error:', err);
    res.status(500).send('Error toggling pin');
  }
});

app.listen(port, () => {
  console.log(`ZapNote server running on port ${port}`);
});
