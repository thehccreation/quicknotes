const noteInput = document.getElementById('note-input');
const saveNoteBtn = document.getElementById('save-note');
const notesList = document.getElementById('notes-list');
const toggleDark = document.getElementById('toggle-dark');

// Load notes on page load
window.onload = loadNotes;

saveNoteBtn.addEventListener('click', () => {
    const note = noteInput.value.trim();
    if (note !== '') {
        saveNoteToStorage(note);
        noteInput.value = '';
        loadNotes();
    }
});

function saveNoteToStorage(note) {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.push(note);
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotes() {
    notesList.innerHTML = '';
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.forEach((note, index) => {
        const li = document.createElement('li');
        li.textContent = note;
        const del = document.createElement('span');
        del.textContent = 'X';
        del.classList.add('note-actions');
        del.onclick = () => deleteNote(index);
        li.appendChild(del);
        notesList.appendChild(li);
    });
}

function deleteNote(index) {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// Dark Mode Toggle
toggleDark.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

const exportPdfBtn = document.getElementById('export-pdf');

exportPdfBtn.addEventListener('click', () => {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    if (notes.length === 0) {
        alert('No notes to export.');
        return;
    }

    let printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>QuickNotes by THEHCCREATION</title>');
    printWindow.document.write('</head><body >');
    printWindow.document.write('<h1>QuickNotes <sub>by THEHCCREATION</sub></h1><hr>');

    notes.forEach(note => {
        printWindow.document.write('<p>' + note.replace(/\n/g, '<br>') + '</p><hr>');
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
});

