document.getElementById("noteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const res = await fetch("/api/notes", {
    method: "POST",
    body: formData
  });

  if (res.ok) {
    form.reset();
    loadNotes();
  }
});

async function loadNotes() {
  const res = await fetch("/api/notes");
  const notes = await res.json();
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content.slice(0, 100)}...</p>
    `;
    card.onclick = () => showModal(note);
    container.appendChild(card);
  });
}

function showModal(note) {
  const modal = document.getElementById("modal");
  const details = document.getElementById("modalDetails");
  details.innerHTML = `
    <h2>${note.title}</h2>
    <p>${note.content}</p>
    ${note.image ? `<img src="data:image/*;base64,${note.image}" width="100%" />` : ""}
    ${note.file ? `<a href="data:${note.filetype};base64,${note.file}" download="${note.filename}">📄 Download ${note.filename}</a>` : ""}
  `;
  modal.classList.remove("hidden");
}

document.querySelector(".close-btn").onclick = () => {
  document.getElementById("modal").classList.add("hidden");
};

loadNotes();
