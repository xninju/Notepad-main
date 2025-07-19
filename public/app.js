document.getElementById('noteForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  try {
    const res = await fetch('/notes', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      form.reset();
      loadNotes();
    } else {
      alert('Failed to save note');
    }
  } catch (err) {
    console.error('Error submitting note:', err);
  }
});

async function loadNotes() {
  const notesContainer = document.getElementById('notes');
  notesContainer.innerHTML = '';

  try {
    const res = await fetch('/notes');
    const notes = await res.json();

    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.style.backgroundColor = note.color || '#1a1a1a';

      const date = new Date(note.created_at).toLocaleString();

      card.innerHTML = `
        <h3 contenteditable="true" onblur="updateNote(${note.id}, this.innerText, '${note.content}')">${note.title}</h3>
        <p contenteditable="true" onblur="updateNote(${note.id}, '${note.title}', this.innerText)">${note.content}</p>
        ${note.image ? `<img src="data:image/png;base64,${note.image}" alt="note image" class="note-img">` : ''}
        ${note.file ? `<a href="data:application/octet-stream;base64,${note.file}" download="file.docx">📎 Download File</a>` : ''}
        <p class="timestamp">${date}</p>
        <button onclick="deleteNote(${note.id})">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z" fill="#ff5e5e"/>
          </svg>
        </button>
      `;
      notesContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading notes:', err);
  }
}

async function updateNote(id, title, content) {
  try {
    await fetch(`/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });
  } catch (err) {
    console.error('Error updating note:', err);
  }
}

async function deleteNote(id) {
  try {
    await fetch(`/notes/${id}`, { method: 'DELETE' });
    loadNotes();
  } catch (err) {
    console.error('Error deleting note:', err);
  }
}

window.onload = loadNotes;
