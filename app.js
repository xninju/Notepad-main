// Frontend JavaScript to interact with backend API

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const imageInput = document.getElementById('image-input');
  const notesList = document.getElementById('notes-list');

  // Escape HTML to prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[tag]));
  }

  // Load notes from backend
  async function loadNotes() {
    notesList.innerHTML = '<div style="text-align:center;">Loading notes...</div>';
    try {
      const res = await fetch('/api/notes');
      const notes = await res.json();
      notesList.innerHTML = '';
      notes.reverse().forEach(note => {
        const el = document.createElement('div');
        el.className = 'note';
        el.innerHTML = `
          ${escapeHTML(note.content)}
          ${note.image ? `<img src="${note.image}" style="width:100%;margin-top:10px;border-radius:8px;">` : ''}
          <button class="delete-btn" title="Delete" data-id="${note.id}">&times;</button>
        `;
        notesList.appendChild(el);
      });
    } catch (err) {
      notesList.innerHTML = '<div style="text-align:center;color:red;">Failed to load notes.</div>';
    }
  }

  // Submit note
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const content = input.value.trim();
    const imageFile = imageInput.files[0];

    const formData = new FormData();
    formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);

    await fetch('/api/notes', {
      method: 'POST',
      body: formData
    });

    input.value = '';
    imageInput.value = '';
    await loadNotes();
  });

  // Delete note
  notesList.addEventListener('click', async e => {
    if (e.target.classList.contains('delete-btn')) {
      const id = e.target.getAttribute('data-id');
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      await loadNotes();
    }
  });

  loadNotes();
});
