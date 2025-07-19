document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('noteForm');
  const notesContainer = document.getElementById('notesContainer');
  let notes = [];

  // Fetch and display notes
  async function fetchNotes() {
    const res = await fetch('/notes');
    notes = await res.json();
    displayNotes(notes);
  }

  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  function displayNotes(notes) {
    notesContainer.innerHTML = '';
    notes.filter(n => !n.deleted).forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';

      card.innerHTML = `
        <h3 contenteditable="false">${note.title}</h3>
        <p contenteditable="false">${note.content}</p>
        ${note.image ? `<img src="${note.image}" class="note-image" />` : ''}
        ${note.file ? `<a href="${note.file}" download class="note-file">Download File</a>` : ''}
        <div class="note-meta">
          <small>${formatDateTime(note.created_at)}</small>
          <div class="note-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          </div>
        </div>
      `;

      // Edit functionality
      const editBtn = card.querySelector('.edit-btn');
      editBtn.addEventListener('click', async () => {
        const titleEl = card.querySelector('h3');
        const contentEl = card.querySelector('p');
        if (editBtn.textContent === 'Edit') {
          titleEl.contentEditable = true;
          contentEl.contentEditable = true;
          editBtn.textContent = 'Save';
          titleEl.focus();
        } else {
          titleEl.contentEditable = false;
          contentEl.contentEditable = false;
          editBtn.textContent = 'Edit';
          await fetch(`/notes/${note.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: titleEl.textContent,
              content: contentEl.textContent
            })
          });
          fetchNotes();
        }
      });

      // Delete (soft delete to bin)
      const deleteBtn = card.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', async () => {
        await fetch(`/notes/${note.id}`, { method: 'DELETE' });
        fetchNotes();
      });

      notesContainer.appendChild(card);
    });
  }

  // Add new note
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const res = await fetch('/notes', {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      form.reset();
      fetchNotes();
    }
  });

  fetchNotes();
});
