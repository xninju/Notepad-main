// public/app.js

const noteForm = document.getElementById("note-form");
const notesGrid = document.getElementById("notes-grid");
const backdrop = document.getElementById("backdrop");
const expandedView = document.getElementById("note-expanded");
const expandedContent = document.getElementById("expanded-content");
const closeBtn = document.getElementById("close-btn");

const api = "/notes";

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

  notes.filter(n => !n.deleted).forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML = `
      <h3 contenteditable="false">${note.title}</h3>
      <p contenteditable="false">${note.content}</p>
      ${note.image ? `<img src="${note.image}" class="note-image" />` : ""}
      ${note.file ? `<a href="${note.file}" download class="note-file">Download File</a>` : ""}
      <div class="note-meta">
        <small>${new Date(note.created_at).toLocaleString()}</small>
        <div class="note-actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      </div>
    `;

    // Edit functionality
    const editBtn = card.querySelector(".edit-btn");
    editBtn.addEventListener("click", async () => {
      const titleEl = card.querySelector("h3");
      const contentEl = card.querySelector("p");
      if (editBtn.textContent === "Edit") {
        titleEl.contentEditable = true;
        contentEl.contentEditable = true;
        editBtn.textContent = "Save";
        titleEl.focus();
      } else {
        titleEl.contentEditable = false;
        contentEl.contentEditable = false;
        editBtn.textContent = "Edit";
        await fetch(`/notes/${note.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: titleEl.textContent,
            content: contentEl.textContent
          })
        });
        loadNotes();
      }
    });

    // Delete (soft delete)
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
      await fetch(`/notes/${note.id}`, { method: 'DELETE' });
      loadNotes();
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
