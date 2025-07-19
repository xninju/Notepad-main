document.getElementById('noteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  try {
    await fetch('/add-note', {
      method: 'POST',
      body: formData,
    });
    form.reset();
    fetchNotes();
  } catch (err) {
    console.error('Error saving note:', err);
  }
});

async function fetchNotes() {
  const res = await fetch('/get-notes');
  const notes = await res.json();
  const container = document.getElementById('notes');
  container.innerHTML = '';

  notes.forEach((note) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.backgroundColor = note.color || '#1a1a1a';

    const date = new Date(note.created_at).toLocaleString();

    card.innerHTML = `
      <h3 contenteditable="true" onblur="updateNote(${note.id}, this.innerText, '${note.content}')">${note.title}</h3>
      <p contenteditable="true" onblur="updateNote(${note.id}, '${note.title}', this.innerText)">${note.content}</p>
      ${note.image ? `<img src="data:image/png;base64,${note.image}" alt="note image" class="note-img">` : ''}
      ${note.file ? `<a href="data:application/octet-stream;base64,${note.file}" download="file.docx">Download File</a>` : ''}
      <p class="timestamp">${date}</p>
    `;

    const pinBtn = document.createElement('button');
    pinBtn.className = 'pin-btn';
    pinBtn.innerHTML = note.pinned
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffc107" viewBox="0 0 24 24"><path d="M16 3v1h-1v2l-3 3 4 4 3-3h2v-1h1l-5-5h-1zM4 21l3-3 4 4-7-1z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#bbb" viewBox="0 0 24 24"><path d="M14 2v2h-1v3l-4 4 5 5 4-4h3v-1h2l-6-6h-1zM5 21l3-3 4 4-7-1z"/></svg>`;
    pinBtn.onclick = () => togglePin(note.id);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ff5e5e" xmlns="http://www.w3.org/2000/svg"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z"/></svg>`;
    deleteBtn.onclick = () => deleteNote(note.id);

    card.appendChild(pinBtn);
    card.appendChild(deleteBtn);
    container.appendChild(card);
  });
}

function updateNote(id, newTitle, newContent) {
  fetch(`/update-note/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle, content: newContent }),
  })
    .then(() => fetchNotes())
    .catch((err) => console.error('Update error:', err));
}

function deleteNote(id) {
  fetch(`/delete-note/${id}`, { method: 'DELETE' })
    .then(() => fetchNotes())
    .catch((err) => console.error('Delete error:', err));
}

function togglePin(id) {
  fetch(`/pin/${id}`, { method: 'PATCH' })
    .then(() => fetchNotes())
    .catch((err) => console.error('Pin error:', err));
}

fetchNotes();
