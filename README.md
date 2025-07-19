# 📝 ZapNote

A modern, dark-themed, minimal note-taking app inspired by **Google Keep** — built with Node.js, PostgreSQL (Neon), and vanilla HTML/CSS/JS.

Hosted on: [Render](https://notepad-main.onrender.com)

---

## ✨ Features

- 🎨 **Dark Google Keep-style layout**
- 📌 Pin / Unpin notes
- 📝 Title, content, file & image uploads (stored in base64)
- 🗃️ Bin support with restore and permanent delete
- 🕒 Timestamp for each note
- 🎨 Per-note color theme selection
- 🧼 Clean, responsive design (mobile & desktop optimized)
- 🔐 Optional dynamic time-based password to access
- 🛡️ Basic browser protection:
  - Disabled right-click
  - Blocked DevTools keys (`F12`, `Ctrl+U`, etc.)
  - Fake "Developer Tools Blocked" screen
  - Disabled page save via `Ctrl+S`

---

## 🏗️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js (Express)
- **Database**: PostgreSQL via Neon
- **File Uploads**: Stored as Base64 strings
- **Deployment**: Render

---

## 📁 Folder Structure

ZapNote/

├── public/ 
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js
├── package.json
└── README.md

