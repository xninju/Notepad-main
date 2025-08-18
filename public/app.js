const noteForm = document.getElementById('noteForm');
const waitingArea = document.getElementById('waiting-area');
const loadingSpinner = document.getElementById('loading-spinner');
const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordError = document.getElementById('password-error');
let pendingFiles = { images: [], files: [] };
let isAuthenticated = false;

// Password validation
function getCurrentPassword() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}${minutes}`;
}

function validatePassword(input) {
  return input === getCurrentPassword();
}

function disableInteractions() {
  document.querySelectorAll('input:not(#password-input), textarea, button:not(#password-submit), .note-title, .note-content').forEach(element => {
    element.disabled = true;
    element.style.pointerEvents = 'none';
  });
}

function enableInteractions() {
  document.querySelectorAll('input, textarea, button, .note-title, .note-content').forEach(element => {
    element.disabled = false;
    element.style.pointerEvents = 'auto';
  });
  passwordModal.style.display = 'none';
}

// Show password modal on page load
window.addEventListener('load', () => {
  disableInteractions();
  passwordModal.style.display = 'flex';
  passwordInput.focus();
});

// Handle password submission
passwordSubmit.addEventListener('click', () => {
  const input = passwordInput.value.trim();
  if (validatePassword(input)) {
    isAuthenticated = true;
    enableInteractions();
    passwordError.classList.add('hidden');
    passwordInput.value = '';
  } else {
    passwordError.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
  }
});

// Handle Enter key for password submission
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    passwordSubmit.click();
  }
});

// Password expiration check every 10 seconds
setInterval(() => {
  if (isAuthenticated && !validatePassword(getCurrentPassword())) {
    isAuthenticated = false;
    disableInteractions();
    passwordModal.style.display = 'flex';
    passwordError.classList.add('hidden');
    passwordInput.focus();
  }
}, 10000);

noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isAuthenticated) return;
  const form = e.target;
  const formData = new FormData(form);

  // Append pending files
  pendingFiles.images.forEach((file, index) => {
    formData.append(`images`, file);
  });
  pendingFiles.files.forEach((file, index) => {
    formData.append(`files`, file);
  });

  loadingSpinner.classList.remove('hidden');
  form.querySelector('.submit-btn').disabled = true;

  try {
    const response = await fetch('/add-note', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to save note');
    
    // Clear form and waiting area
    form.reset();
    waitingArea.innerHTML = '';
    pendingFiles = { images: [], files: [] };
    await fetchNotes();
  } catch (err) {
    console.error('Error saving note:', err);
    alert('Failed to save note. Please try again.');
  } finally {
    loadingSpinner.classList.add('hidden');
    form.querySelector('.submit-btn').disabled = false;
  }
});

// Handle file input changes
document.querySelector('input[name="images"]').addEventListener('change', (e) => {
  if (isAuthenticated) handleFileInput(e, 'images');
});

document.querySelector('input[name="files"]').addEventListener('change', (e) => {
  if (isAuthenticated) handleFileInput(e, 'files');
});

function handleFileInput(event, type) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    pendingFiles[type].push(file);
    displayPendingFile(file, type);
  });
  event.target.value = ''; // Clear input to allow re-adding same file
}

function displayPendingFile(file, type) {
  const fileDiv = document.createElement('div');
  fileDiv.className = 'pending-file';
  fileDiv.dataset.type = type;
  fileDiv.dataset.name = file.name;

  const preview = type === 'images' ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}" />` : `<span>${file.name}</span>`;
  fileDiv.innerHTML = `
    ${preview}
    <button class="remove-file-btn" onclick="removePendingFile('${file.name}', '${type}')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#dc2626" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  `;
  waitingArea.appendChild(fileDiv);
}

function removePendingFile(name, type) {
  pendingFiles[type] = pendingFiles[type].filter(file => file.name !== name);
  const fileDiv = waitingArea.querySelector(`.pending-file[data-name="${name}"][data-type="${type}"]`);
  if (fileDiv) fileDiv.remove();
}

async function fetchNotes() {
  if (!isAuthenticated) return;
  try {
    const res = await fetch('/get-notes');
    const notes = await res.json();
    const container = document.getElementById('notes');
    container.innerHTML = '';

    if (notes.length === 0) {
      container.innerHTML = '<p class="no-notes">No notes yet. Create one to get started!</p>';
      return;
    }

    notes.forEach((note) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.style.backgroundColor = note.color || '#1a1a1a';

      const date = new Date(note.created_at).toLocaleString();

      card.innerHTML = `
        <div class="note-header">
          <h3 contenteditable="true" class="note-title" onblur="updateNote(${note.id}, this.innerText, '${note.content || ''}')">${note.title}</h3>
          <div class="note-actions">
            ${note.deleted ? `
              <button class="action-btn restore-btn" title="Restore" onclick="restoreNote(${note.id})">🔁</button>
              <button class="action-btn delete-forever-btn" title="Delete Forever" onclick="permanentlyDeleteNote(${note.id})">🗑️</button>
            ` : `
              <button class="action-btn delete-btn" title="Delete" onclick="deleteNote(${note.id})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#dc2626" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 0 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0v-6a1 1 0 0 1 1-1z"/>
                </svg>
              </button>
            `}
          </div>
        </div>
        ${note.content ? `<p contenteditable="true" class="note-content" onblur="updateNote(${note.id}, '${note.title}', this.innerText)">${note.content}</p>` : ''}
        ${note.images && note.images.length > 0 ? note.images.map((img, index) => `<img src="data:${note.image_types[index]};base64,${img}" alt="Note image" class="note-img" onclick="viewImage(this.src)">`).join('') : ''}
        ${note.files && note.files.length > 0 ? note.files.map((file, index) => `
          <a href="data:${note.filetypes[index]};base64,${file}" download="${note.filenames[index]}" class="download-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#9333ea" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1a.5.5 0 0 1 .5.5v6.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 8.293V1.5A.5.5 0 0 1 8 1z"/>
              <path d="M3 12.5v1a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 1 1 0v1a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-1a.5.5 0 0 1 1 0z"/>
            </svg>
            Download ${note.filenames[index]}
          </a>
        `).join('') : ''}
        <p class="timestamp">${date}</p>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error('Fetch error:', err);
    document.getElementById('notes').innerHTML = '<p class="error">Failed to load notes. Please try again later.</p>';
  }
}

function updateNote(id, newTitle, newContent) {
  if (!isAuthenticated) return;
  fetch(`/update-note/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle, content: newContent || '' }),
  })
    .then(() => fetchNotes())
    .catch((err) => console.error('Update error:', err));
}

function deleteNote(id) {
  if (!isAuthenticated) return;
  fetch(`/delete-note/${id}`, { method: 'DELETE' })
    .then(() => fetchNotes())
    .catch((err) => console.error('Delete error:', err));
}

function restoreNote(id) {
  if (!isAuthenticated) return;
  fetch(`/restore-note/${id}`, { method: 'PUT' })
    .then(() => fetchNotes())
    .catch((err) => console.error('Restore error:', err));
}

function permanentlyDeleteNote(id) {
  if (!isAuthenticated) return;
  if (confirm('Are you sure you want to permanently delete this note?')) {
    fetch(`/permanently-delete/${id}`, { method: 'DELETE' })
      .then(() => fetchNotes())
      .catch((err) => console.error('Permanent delete error:', err));
  }
}

function viewImage(src) {
  if (!isAuthenticated) return;
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <img src="${src}" alt="Full image">
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

// Disable right-click
document.addEventListener('contextmenu', (e) => {
  if (!isAuthenticated) e.preventDefault();
});

// Block common devtools shortcuts
document.addEventListener('keydown', (e) => {
  if (!isAuthenticated) {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
      alert('This action is disabled.');
    }
  }
});

// Disable Ctrl+S or Cmd+S
document.addEventListener('keydown', (e) => {
  if (!isAuthenticated && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    alert('Save is disabled on this page.');
  }
});

// Initial fetch only if authenticated
if (isAuthenticated) fetchNotes();
