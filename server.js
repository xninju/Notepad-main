const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3000;
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer with disk storage and file limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Temporary directory for uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Max 5 files per field
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (file.fieldname === 'images' && allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === 'files' && allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'files', maxCount: 5 }
]);

// Ensure uploads directory exists
fs.mkdir('uploads', { recursive: true }).catch(console.error);

app.post('/add-note', async (req, res) => {
  try {
    await upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).send(`Upload error: ${err.message}`);
      } else if (err) {
        return res.status(400).send(`Error: ${err.message}`);
      }

      let { title, content, color } = req.body;
      content = content || '';
      const images = [];
      const image_types = [];
      const files = [];
      const filenames = [];
      const filetypes = [];

      // Process images
      if (req.files?.images) {
        for (const file of req.files.images) {
          const fileContent = await fs.readFile(file.path);
          images.push(fileContent.toString('base64'));
          image_types.push(file.mimetype);
          await fs.unlink(file.path); // Clean up temporary file
        }
      }

      // Process files
      if (req.files?.files) {
        for (const file of req.files.files) {
          const fileContent = await fs.readFile(file.path);
          files.push(fileContent.toString('base64'));
          filenames.push(file.originalname);
          filetypes.push(file.mimetype);
          await fs.unlink(file.path); // Clean up temporary file
        }
      }

      try {
        await pool.query(
          'INSERT INTO notes (title, content, images, image_types, files, filenames, filetypes, color, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
          [title, content, images, image_types, files, filenames, filetypes, color]
        );
        res.status(200).send('Note saved');
      } catch (dbErr) {
        console.error('Insert error:', dbErr);
        res.status(500).send('Error saving note');
      }
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).send('Server error');
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
