document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('noteForm');
  const notesContainer = document.getElementById('notes');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        form.reset();
        loadNotes();
      } else {
        alert('Error saving note');
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  });

  async function loadNotes() {
    notesContainer.innerHTML = '';
    try {
      const res = await fetch('/api/notes');
      const notes = await res.json();

      notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';

        const date = new Date(note.created_at).toLocaleString();

        card.innerHTML = `
          <h3 contenteditable="true" onblur="updateNote(${note.id}, this.innerText, '${note.content}')">${note.title}</h3>
          <p contenteditable="true" onblur="updateNote(${note.id}, '${note.title}', this.innerText)">${note.content}</p>
          ${note.image ? `<img src="data:image/png;base64,${note.image}" alt="note image" class="note-img">` : ''}
          ${note.file ? `<a href="data:application/octet-stream;base64,${note.file}" download="file.docx">Download File</a>` : ''}
          <p class="timestamp">${date}</p>
          <button onclick="deleteNote(${note.id})">Delete</button>
        `;

        notesContainer.appendChild(card);
      });
    } catch (err) {
      console.error('Load error:', err);
    }
  }

  loadNotes();
});

async function updateNote(id, title, content) {
  try {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) throw new Error('Failed to update');
  } catch (err) {
    console.error('Update error:', err);
  }
}

async function deleteNote(id) {
  try {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) location.reload();
  } catch (err) {
    console.error('Delete error:', err);
  }
}
