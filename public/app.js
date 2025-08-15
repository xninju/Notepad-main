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
      <h3 contenteditable="true" class="note-title" onblur="updateNote(${note.id}, this.innerText, '${note.content}')">${note.title}</h3>
      <p contenteditable="true" onblur="updateNote(${note.id}, '${note.title}', this.innerText)">${note.content}</p>
      ${note.image ? `<img src="data:image/png;base64,${note.image}" alt="note image" class="note-img">` : ''}
      ${note.file && note.filename && note.filetype ? `
        <a href="data:${note.filetype};base64,${note.file}" download="${note.filename}" class="download-link">
          Download File
        </a>
      ` : ''}
      <br><p class="timestamp">${date}</p>
    `;

    if (note.deleted) {
      const restoreBtn = document.createElement('button');
      restoreBtn.innerHTML = '🔁';
      restoreBtn.title = 'Restore';
      restoreBtn.onclick = async () => {
        await fetch(`/restore-note/${note.id}`, { method: 'PUT' });
        fetchNotes();
      };

      const deleteForeverBtn = document.createElement('button');
      deleteForeverBtn.innerHTML = '🗑️';
      deleteForeverBtn.title = 'Delete Forever';
      deleteForeverBtn.onclick = async () => {
        await fetch(`/permanently-delete/${note.id}`, { method: 'DELETE' });
        fetchNotes();
      };

      card.appendChild(restoreBtn);
      card.appendChild(deleteForeverBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ff5e5e" xmlns="http://www.w3.org/2000/svg"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0v-6a1 1 0 0 1 1-1z"/></svg>`;
    deleteBtn.onclick = () => deleteNote(note.id);

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

document.getElementById('executeSql').addEventListener('click', async () => {
  const query = document.getElementById('sqlQuery').value;
  try {
    const res = await fetch('/execute-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const result = await res.json();
    const resultsDiv = document.getElementById('sqlResults');
    if (result.error) {
      resultsDiv.innerHTML = `<p style="color: red;">${result.error}: ${result.details || ''}</p>`;
    } else {
      resultsDiv.innerHTML = '<h3>Query Results</h3>';
      if (result.data.length === 0) {
        resultsDiv.innerHTML += '<p>No results found.</p>';
      } else {
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.marginTop = '10px';
        table.style.border = '1px solid #9D4EDD';

        // Table headers
        const headers = Object.keys(result.data[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
          const th = document.createElement('th');
          th.textContent = header;
          th.style.border = '1px solid #9D4EDD';
          th.style.padding = '8px';
          th.style.background = '#292929';
          th.style.color = '#fff';
          headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Table rows
        result.data.forEach(row => {
          const tr = document.createElement('tr');
          headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            td.style.border = '1px solid #9D4EDD';
            td.style.padding = '8px';
            td.style.color = '#ccc';
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });

        resultsDiv.appendChild(table);
      }
    }
  } catch (err) {
    console.error('SQL execution error:', err);
    document.getElementById('sqlResults').innerHTML = `<p style="color: red;">Error executing query</p>`;
  }
});

fetchNotes();

window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.createElement("div");
  overlay.id = "auth-overlay";
  overlay.innerHTML = `
    <div class="auth-box">
      <h2>Enter Password</h2>
      <input type="password" id="auth-input" maxlength="4" />
      <button id="auth-submit">Unlock</button>
      <p id="auth-error" style="color:red; display:none;">Wrong password</p>
    </div>
  `;
  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";

  const submitPassword = () => {
    const userInput = document.getElementById("auth-input").value;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const password = `${hours}${minutes.toString().padStart(2, '0')}`;

    if (userInput === password) {
      overlay.remove();
      document.body.style.overflow = "auto";
    } else {
      document.getElementById("auth-error").style.display = "block";
    }
  };

  document.getElementById("auth-submit").onclick = submitPassword;

  document.getElementById("auth-input").addEventListener("keyup", (e) => {
    if (e.key === "Enter") submitPassword();
  });
});

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

// Fake anti-debugging loop
setInterval(function () {
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function () {
      throw new Error("DevTools is not allowed!");
    }
  });
  console.log(element);
}, 1000);

// Disable Ctrl+S or Cmd+S
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    alert("Save is disabled on this page.");
  }
});
