const express = require("express");
const multer = require("multer");
const { Client } = require("pg");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL client
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_bM8CYSioIA9J@ep-dry-base-adb3jm03-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

client.connect().then(() => console.log("✅ Connected to NeonDB")).catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Multer config for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
app.get("/api/notes", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM notes ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/notes error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/notes", upload.fields([{ name: "image" }, { name: "file" }]), async (req, res) => {
  try {
    const { title, content } = req.body;
    let imageBase64 = null;
    let fileBase64 = null;

    if (req.files?.image?.[0]) {
      imageBase64 = `data:${req.files.image[0].mimetype};base64,${req.files.image[0].buffer.toString("base64")}`;
    }

    if (req.files?.file?.[0]) {
      fileBase64 = `data:${req.files.file[0].mimetype};base64,${req.files.file[0].buffer.toString("base64")}`;
    }

    await client.query(
      "INSERT INTO notes (title, content, image, file) VALUES ($1, $2, $3, $4)",
      [title, content, imageBase64, fileBase64]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ POST /api/notes error:", err);
    res.status(500).json({ error: "Failed to save note" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
