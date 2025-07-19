const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 10000;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7vmHVs2FXubz@ep-yellow-lake-adm5qml0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/notes', upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.files.image?.[0]?.buffer.toString('base64') || null;
    const file = req.files.file?.[0]?.buffer.toString('base64') || null;
    const filename = req.files.file?.[0]?.originalname || null;
    const filetype = req.files.file?.[0]?.mimetype || null;

    const result = await pool.query(
      `INSERT INTO notes (title, content, image, file, filename, filetype)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content, image, file, filename, filetype]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving note");
  }
});

app.get('/api/notes', async (req, res) => {
  const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`ZapNote backend running on port ${port}`);
});
