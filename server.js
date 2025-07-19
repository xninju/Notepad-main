// server.js

const express = require("express");
const multer = require("multer");
const pg = require("pg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

const pool = new pg.Pool({
  connectionString: "postgresql://neondb_owner:npg_bM8CYSioIA9J@ep-dry-base-adb3jm03-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    image TEXT,
    file TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// API to get all notes
app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notes ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Database error");
  }
});

// API to add a new note
app.post("/api/notes", upload.fields([{ name: "image" }, { name: "file" }]), async (req, res) => {
  const { title, content } = req.body;

  let imageData = null;
  let fileData = null;

  if (req.files.image && req.files.image[0]) {
    imageData = `data:${req.files.image[0].mimetype};base64,${req.files.image[0].buffer.toString("base64")}`;
  }

  if (req.files.file && req.files.file[0]) {
    fileData = `data:${req.files.file[0].mimetype};base64,${req.files.file[0].buffer.toString("base64")}`;
  }

  try {
    await pool.query(
      "INSERT INTO notes (title, content, image, file) VALUES ($1, $2, $3, $4)",
      [title, content, imageData, fileData]
    );
    res.sendStatus(201);
  } catch (err) {
    res.status(500).send("Insert error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
