const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_bM8CYSioIA9J@ep-dry-base-adb3jm03-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

// Middleware
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get all notes
app.get("/notes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notes ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving notes");
  }
});

// Add new note
app.post("/notes", upload.fields([{ name: "image" }, { name: "file" }]), async (req, res) => {
  const { title, content, color } = req.body;
  const image = req.files["image"] ? req.files["image"][0].buffer.toString("base64") : null;
  const file = req.files["file"] ? req.files["file"][0].buffer.toString("base64") : null;
  const fileName = req.files["file"] ? req.files["file"][0].originalname : null;

  try {
    const result = await pool.query(
      `INSERT INTO notes (title, content, color, image, file, filename, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [title, content, color, image, file, fileName]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding note");
  }
});

// Edit note
app.put("/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, color } = req.body;

  try {
    const result = await pool.query(
      "UPDATE notes SET title = $1, content = $2, color = $3 WHERE id = $4 RETURNING *",
      [title, content, color, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating note");
  }
});

// Soft delete (move to bin)
app.delete("/notes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE notes SET deleted = TRUE WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting note");
  }
});

// Restore from bin
app.put("/restore/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE notes SET deleted = FALSE WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error restoring note");
  }
});

// Permanently delete
app.delete("/permanent/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error permanently deleting note");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
