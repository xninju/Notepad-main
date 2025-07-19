// public/app.js

const noteForm = document.getElementById("note-form");
const notesGrid = document.getElementById("notes-grid");
const backdrop = document.getElementById("backdrop");
const expandedView = document.getElementById("note-expanded");
const expandedContent = document.getElementById("expanded-content");
const closeBtn = document.getElementById("close-btn");

const api = "/api/notes";

// Submit new note
noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(noteForm);

  const res = await fetch(api, {
    method: "POST",
    body: formData
  });

  if (res.ok) {
    noteForm.reset();
    loadNotes();
  }
});

// Load all notes
async function loadNotes() {
  const res = await fetch(api);
  const notes = await res.json();

  notesGrid.innerHTML = "";

  notes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content.slice(0, 100)}...</p>
    `;

    card.addEventListener("click", () => {
      showExpandedNote(note);
    });

    notesGrid.appendChild(card);
  });
}

// Show expanded note
function showExpandedNote(note) {
  expandedContent.innerHTML = `
    <h2>${note.title}</h2>
    <p>${note.content}</p>
    ${note.image ? `<img src="${note.image}" style="max-width:100%;margin-top:1rem;"/>` : ""}
    ${note.file ? `<a href="${note.file}" download style="display:block;margin-top:1rem;color:#9d4edd;">Download Attachment</a>` : ""}
  `;

  expandedView.style.display = "block";
  backdrop.style.display = "block";
}

// Close expanded note
closeBtn.addEventListener("click", () => {
  expandedView.style.display = "none";
  backdrop.style.display = "none";
});

// Initial load
loadNotes();
