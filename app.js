// Frontend JavaScript to interact with backend API

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const notesList = document.getElementById('notes-list');

  // Load notes from backend
  async function loadNotes() {
    notesList.innerHTML = '<div style="text-align:center;">Loading notes...</div>';
    const res = await fetch('/api/notes');
    const notes = await res.json();
    notesList.innerHTML = '';
    notes.reverse().forEach(note => {
      const el = document.createElement('div');
      el.className = 'note';
      el.innerHTML = `
        ${note.content.replace(/</g,"&lt;")}
        <button class="delete-btn" title="Delete" data-id="${note.id}">&times;</button>
      `;
      notesList.appendChild(el);
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    input.value = '';
    await loadNotes();
  });

  notesList.addEventListener('click', async e => {
    if (e.target.classList.contains('delete-btn')) {
      const id = e.target.getAttribute('data-id');
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      await loadNotes();
    }
  });

  loadNotes();
});
