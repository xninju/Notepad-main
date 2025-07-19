const form = document.getElementById('noteForm');
const notesContainer = document.getElementById('notes');
const deletedSection = document.getElementById('deletedNotes');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  await fetch('/add', {
    method: 'POST',
    body: formData,
  });
  form.reset();
  fetchNotes();
});

async function fetchNotes() {
  const res = await fetch('/notes');
  const notes = await res.json();

  notesContainer.innerHTML = '';
  deletedSection.innerHTML = '';

  const pinnedNotes = notes.filter(n => !n.deleted && n.pinned);
  const unpinnedNotes = notes.filter(n => !n.deleted && !n.pinned);
  const deletedNotes = notes.filter(n => n.deleted);

  [...pinnedNotes, ...unpinnedNotes].forEach(renderNote);
  deletedNotes.forEach(renderNote);
}

function renderNote(note) {
  const card = document.createElement('div');
  card.className = 'note-card';
  if (note.pinned) card.classList.add('pinned');
  card.style.backgroundColor = note.color || '#1a1a1a';

  const date = new Date(note.created_at).toLocaleString();

  card.innerHTML = `
    <h3 contenteditable="true" onblur="updateNote(${note.id}, this.innerText, '${note.content}')">${note.title}</h3>
    <p contenteditable="true" onblur="updateNote(${note.id}, '${note.title}', this.innerText)">${note.content}</p>
    ${note.image ? `<img src="data:image/png;base64,${note.image}" class="note-img" />` : ''}
    ${note.file ? `<a href="data:application/octet-stream;base64,${note.file}" download="file">📎 Download File</a>` : ''}
    <p class="timestamp">${date}</p>
  `;

  // ✅ Pin/Unpin button using YOUR SVGs
  const pinBtn = document.createElement('button');
  pinBtn.innerHTML = note.pinned
    ? `<svg xmlns="http://www.w3.org/2000/svg" fill="#ffc107" width="20px" height="20px" viewBox="0 0 24 24"><path d="M17.293 5.293 13 9.586V14h-2V9.586L6.707 5.293 5.293 6.707 10 11.414V22h4V11.414l4.707-4.707z"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" fill="#bbb" width="20px" height="20px" viewBox="0 0 24 24"><path d="M17.293 5.293 13 9.586V14h-2V9.586L6.707 5.293 5.293 6.707 10 11.414V22h4V11.414l4.707-4.707z"/></svg>`;
  pinBtn.title = note.pinned ? 'Unpin' : 'Pin';
  pinBtn.onclick = async () => {
    await fetch(`/pin-note/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    fetchNotes();
  };
  card.appendChild(pinBtn);

  // 🗑️ Soft delete / Bin
  if (!note.deleted) {
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '🗑️';
    delBtn.title = 'Move to Bin';
    delBtn.onclick = async () => {
      await fetch(`/delete/${note.id}`, { method: 'DELETE' });
      fetchNotes();
    };
    card.appendChild(delBtn);
    notesContainer.appendChild(card);
  } else {
    // 🔁 Restore
    const restoreBtn = document.createElement('button');
    restoreBtn.innerHTML = '🔁';
    restoreBtn.title = 'Restore';
    restoreBtn.onclick = async () => {
      await fetch(`/restore-note/${note.id}`, { method: 'PUT' });
      fetchNotes();
    };
    // ❌ Delete Forever
    const deleteForeverBtn = document.createElement('button');
    deleteForeverBtn.innerHTML = '🗑️';
    deleteForeverBtn.title = 'Delete Forever';
    deleteForeverBtn.onclick = async () => {
      await fetch(`/permanently-delete/${note.id}`, { method: 'DELETE' });
      fetchNotes();
    };
    card.appendChild(restoreBtn);
    card.appendChild(deleteForeverBtn);
    deletedSection.appendChild(card);
  }
}

async function updateNote(id, title, content) {
  await fetch(`/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
}

fetchNotes();
