window.onload = function () {
  // Prevent right-click and certain key shortcuts
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => {
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
      (e.ctrlKey && e.keyCode === 83) || // Ctrl+S
      (e.ctrlKey && e.shiftKey && e.keyCode === 67)
    ) {
      e.preventDefault();
    }
  });

  function generatePassword() {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    return (parseInt(hour + minute) + 1001).toString();
  }

  function checkPassword() {
    const input = document.getElementById("passwordInput").value;
    const correct = generatePassword();

    const errorMsg = document.getElementById("errorMessage");
    const accessMsg = document.getElementById("accessGranted");
    const crashMsg = document.getElementById("crashMessage");
    const container = document.getElementById("passwordContainer");
    const content = document.getElementById("content");

    errorMsg.classList.add("hidden");
    accessMsg.classList.add("hidden");
    crashMsg.classList.add("hidden");

    if (input === correct || input === "lordaccess") {
      accessMsg.classList.remove("hidden");
      setTimeout(() => {
        container.style.display = "none";
        content.style.display = "flex";
      }, 1000);
    } else if (input === "2025") {
      crashMsg.classList.remove("hidden");
    } else {
      errorMsg.classList.remove("hidden");
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") checkPassword();
  }

  // Attach events
  document.getElementById("submitBtn").addEventListener("click", checkPassword);
  document.getElementById("passwordInput").addEventListener("keypress", handleKey);
};

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

    if (note.deleted) {
  const restoreBtn = document.createElement('button');
  restoreBtn.innerHTML = '🔁';
  restoreBtn.title = 'Restore';
  restoreBtn.onclick = async () => {
    await fetch(`/restore-note/${note.id}`, { method: 'PUT' });
    fetchNotes(); // re-render notes
  };

  const deleteForeverBtn = document.createElement('button');
  deleteForeverBtn.innerHTML = '🗑️';
  deleteForeverBtn.title = 'Delete Forever';
  deleteForeverBtn.onclick = async () => {
    await fetch(`/permanently-delete/${note.id}`, { method: 'DELETE' });
    fetchNotes(); // re-render notes
  };

  card.appendChild(restoreBtn);
  card.appendChild(deleteForeverBtn);
}

    const pinBtn = document.createElement('button');
    pinBtn.className = 'pin-btn';
    pinBtn.innerHTML = note.pinned
      ? `<svg fill="#ffc107" width="20px" height="auto" viewBox="-2.5 -2.5 24 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" class="jam jam-pin"><path d='M12.626 11.346l-.184-1.036 4.49-4.491-2.851-2.852-4.492 4.49-1.035-.184a5.05 5.05 0 0 0-2.734.269l6.538 6.537a5.05 5.05 0 0 0 .268-2.733zm-4.25 1.604L2.67 18.654a1.008 1.008 0 0 1-1.426-1.426l5.705-5.704L2.67 7.245a7.051 7.051 0 0 1 6.236-1.958l3.747-3.747a2.017 2.017 0 0 1 2.853 0l2.852 2.853a2.017 2.017 0 0 1 0 2.852l-3.747 3.747a7.051 7.051 0 0 1-1.958 6.236L8.376 12.95z'/></svg>`
      : `<svg fill="#bbb" width="20px" height="auto" viewBox="-2.5 -2.5 24 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" class="jam jam-pin"><path d='M12.626 11.346l-.184-1.036 4.49-4.491-2.851-2.852-4.492 4.49-1.035-.184a5.05 5.05 0 0 0-2.734.269l6.538 6.537a5.05 5.05 0 0 0 .268-2.733zm-4.25 1.604L2.67 18.654a1.008 1.008 0 0 1-1.426-1.426l5.705-5.704L2.67 7.245a7.051 7.051 0 0 1 6.236-1.958l3.747-3.747a2.017 2.017 0 0 1 2.853 0l2.852 2.853a2.017 2.017 0 0 1 0 2.852l-3.747 3.747a7.051 7.051 0 0 1-1.958 6.236L8.376 12.95z'/></svg>`;
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

// Disable right-click
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Block common devtools shortcuts
document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
    (e.ctrlKey && e.key === 'U')
  ) {
    e.preventDefault();
    alert("This action is disabled.");
  }
});

// Fake anti-debugging loop (harder to inspect)
setInterval(function () {
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function () {
      throw new Error("DevTools is not allowed!");
    }
  });
  console.log(element);
}, 1000);

// Disable Ctrl+S or Cmd+S (Save Page)
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    alert("Save is disabled on this page.");
  }
});

