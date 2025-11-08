document.addEventListener('DOMContentLoaded', () => {
            const noteTitleInput = document.getElementById('noteTitle');
            const noteContentInput = document.getElementById('noteContent');
            const addNoteBtn = document.getElementById('addNoteBtn');
            const clearBtn = document.getElementById('clearBtn');
            const notesGrid = document.getElementById('notesGrid');

            // --- State and Storage Keys ---
            let editingNoteId = null; // Tracks the ID of the note currently being edited
            const LOCAL_STORAGE_KEY = 'quicknotes_v2_notes';
            const SESSION_STORAGE_TITLE_KEY = 'quicknotes_v2_draft_title';
            const SESSION_STORAGE_CONTENT_KEY = 'quicknotes_v2_draft_content';

            // --- Initialization Functions ---

            /**
             * Loads notes from Local Storage and renders them to the grid.
             */
            function loadNotesFromLocalStorage() {
                const notesJson = localStorage.getItem(LOCAL_STORAGE_KEY);
                let notes = [];

                try {
                    notes = notesJson ? JSON.parse(notesJson) : [];
                } catch (e) {
                    console.error("Error parsing notes from Local Storage:", e);
                    notes = []; 
                }

                // Render notes from the stored array (most recent first)
                notes.reverse().forEach(note => {
                    const noteCard = createNoteCard(note.id, note.title, note.content);
                    notesGrid.appendChild(noteCard);
                });
            }

            /**
             * Loads any draft content from Session Storage into the input fields.
             */
            function loadDraftFromSessionStorage() {
                const draftTitle = sessionStorage.getItem(SESSION_STORAGE_TITLE_KEY);
                const draftContent = sessionStorage.getItem(SESSION_STORAGE_CONTENT_KEY);

                if (draftTitle) {
                    noteTitleInput.value = draftTitle;
                }
                if (draftContent) {
                    noteContentInput.value = draftContent;
                }
            }

            /**
             * Sets up listeners to save input to session storage on every key press (for refresh protection).
             */
            function setupDraftSaving() {
                noteTitleInput.addEventListener('input', () => {
                    sessionStorage.setItem(SESSION_STORAGE_TITLE_KEY, noteTitleInput.value);
                });
                noteContentInput.addEventListener('input', () => {
                    sessionStorage.setItem(SESSION_STORAGE_CONTENT_KEY, noteContentInput.value);
                });
            }

            // --- Print Feature (Using native window.print()) ---

            /**
             * Generates a temporary, minimal HTML document and triggers the browser's print dialog.
             */
            function printNote(title, content) {
                const printWindow = window.open('', '_blank', 'height=600,width=800');
                
                // Use <pre> tag and CSS white-space: pre-wrap to preserve original formatting and line breaks
                const htmlContent = `
                    <head>
                        <title>QuickNotes by thehccreation</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 40px; }
                            h1 { font-size: 24px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; }
                            pre { white-space: pre-wrap; margin-top: 20px; font-size: 16px; line-height: 1.5; }
                        </style>
                    </head>
                        <h1>${title}</h1>
                        <pre>${content}</pre>
                `;

                printWindow.document.write(htmlContent);
                printWindow.document.close();
                
                // Wait for the new window to load the content before calling print
                printWindow.onload = function() {
                    printWindow.print();
                };
            }


            // --- Core Functionality ---

            /**
             * Clears the form inputs, resets the editing state, and removes the draft from session storage.
             */
            function clearForm() {
                noteTitleInput.value = '';
                noteContentInput.value = '';
                
                // Reset editing state and button text
                editingNoteId = null;
                addNoteBtn.textContent = 'Add Note'; // Reset button text
                addNoteBtn.classList.remove('save-edit-btn');
                
                // Clear the draft from session storage
                sessionStorage.removeItem(SESSION_STORAGE_TITLE_KEY);
                sessionStorage.removeItem(SESSION_STORAGE_CONTENT_KEY);
            }

            /**
             * Logic to start the editing process.
             * @param {string} id - The ID of the note to edit.
             * @param {string} title - The current title of the note.
             * @param {string} content - The current content of the note.
             */
            function startEdit(id, title, content) {
                // 1. Set the state
                editingNoteId = id;

                // 2. Populate the input fields
                noteTitleInput.value = title;
                noteContentInput.value = content;
                
                // 3. Change button text and style
                addNoteBtn.textContent = 'Save Edit';
                addNoteBtn.classList.add('save-edit-btn');

                // 4. Scroll to the top input form for better UX
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            /**
             * Saves the edited note to Local Storage and updates the DOM element.
             */
            function saveEditAndRefreshDOM(id, newTitle, newContent) {
                // 1. Update Local Storage
                const notesJson = localStorage.getItem(LOCAL_STORAGE_KEY);
                let notes = notesJson ? JSON.parse(notesJson) : [];

                // Find the note by ID and update its data
                const noteIndex = notes.findIndex(note => note.id === id);
                if (noteIndex !== -1) {
                    notes[noteIndex].title = newTitle;
                    notes[noteIndex].content = newContent;
                }
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));

                // 2. Update the DOM card
                const cardToUpdate = document.querySelector(`.note-card[data-note-id="${id}"]`);
                if (cardToUpdate) {
                    cardToUpdate.querySelector('h3').textContent = newTitle;
                    cardToUpdate.querySelector('p').textContent = newContent;
                }
            }


            /**
             * Handles both adding new notes and saving edits based on the editingNoteId state.
             */
            function addNote() {
                const title = noteTitleInput.value.trim();
                const content = noteContentInput.value.trim();

                if (title === '' || content === '') {
                    console.error('Validation Error: Please enter both a title and content for your note.');
                    return;
                }

                if (editingNoteId) {
                    // We are in EDIT mode
                    saveEditAndRefreshDOM(editingNoteId, title, content);
                   // console.log(`Note ID ${editingNoteId} successfully updated.`);
                } else {
                    // We are in ADD mode
                    const id = Date.now().toString();
                    saveNoteToLocalStorage(id, title, content);
                    const noteCard = createNoteCard(id, title, content);
                    notesGrid.prepend(noteCard); // Add new note to the top
                    console.log(`New note ID ${id} successfully added.`);
                }

                // Clear the form and reset state regardless of mode
                clearForm();
            }

            /**
             * Saves a single note object to the existing array in Local Storage.
             */
            function saveNoteToLocalStorage(id, title, content) {
                const notesJson = localStorage.getItem(LOCAL_STORAGE_KEY);
                const notes = notesJson ? JSON.parse(notesJson) : [];

                const newNote = { id, title, content };
                notes.push(newNote);

                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
            }

            /**
             * Removes a note from the DOM and Local Storage.
             */
            function deleteNote(id, cardElement) {
                // 1. Remove from Local Storage
                const notesJson = localStorage.getItem(LOCAL_STORAGE_KEY);
                let notes = notesJson ? JSON.parse(notesJson) : [];

                // Filter out the note with the matching ID
                notes = notes.filter(note => note.id !== id);

                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));

                // 2. Remove from DOM
                cardElement.remove();
            }


            // Full Note Modal Function
            function showFullNote(title, content) {
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.background = 'rgba(0,0,0,0.4)';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.style.padding = '20px';

                const box = document.createElement('div');
                box.style.background = '#fff';
                box.style.maxWidth = '600px';
                box.style.width = '100%';
                box.style.borderRadius = '14px';
                box.style.padding = '20px 24px';
                box.style.maxHeight = '80vh';
                box.style.overflowY = 'auto';

                box.innerHTML = `<h2>${title}</h2><p style="white-space: pre-wrap; line-height:1.5; font-size:16px; color:#444;">${content}</p>
                <button id="closeFullNote" style="margin-top:20px; padding:8px 14px; border:none; border-radius:8px; background:#222; color:#fff; cursor:pointer;">Close</button>`;

                modal.appendChild(box);
                document.body.appendChild(modal);

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.remove();
                });
                document.getElementById('closeFullNote').onclick = () => modal.remove();
            }

            // --- UI Helper ---

            /**
             * Creates the note card element with Print, delete, and edit functionality.
             */
            function createNoteCard(id, title, content) {
                const card = document.createElement('div');
                card.classList.add('note-card');
                card.dataset.noteId = id; // Store the unique ID for deletion/editing

                // --- PRINT BUTTON (Updated to use 'print' icon) ---
                const viewBtn = document.createElement('button');
                viewBtn.classList.add('view-btn');
                viewBtn.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
                viewBtn.title = 'View Full Note';
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const currentTitle = card.querySelector('h3').textContent;
                    const currentContent = card.querySelector('p').textContent;
                    showFullNote(currentTitle, currentContent);
                });

                const pdfBtn = document.createElement('button');
                pdfBtn.classList.add('pdf-btn');
                // Using Material Symbol: 'print'
                pdfBtn.innerHTML = '<span class="material-symbols-outlined">print</span>'; 
                pdfBtn.title = 'Print/Save as PDF';

                pdfBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Read the current title and content directly from the DOM elements
                    const currentTitle = card.querySelector('h3').textContent;
                    const currentContent = card.querySelector('p').textContent;
                    printNote(currentTitle, currentContent); // Call the native print function
                });


                // --- EDIT BUTTON (Updated to use 'edit' icon) ---
                const editBtn = document.createElement('button');
                editBtn.classList.add('edit-btn');
                // Using Material Symbol: 'edit'
                editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>'; 
                editBtn.title = 'Edit Note';

                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Read the current title and content directly from the DOM elements
                    const currentTitle = card.querySelector('h3').textContent;
                    const currentContent = card.querySelector('p').textContent;
                    startEdit(id, currentTitle, currentContent);
                });

                // --- DELETE BUTTON (Updated to use 'delete' icon) ---
                const deleteBtn = document.createElement('button');
                // Using Material Symbol: 'delete'
                deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>'; 
                deleteBtn.classList.add('delete-btn');
                deleteBtn.title = 'Delete Note';

                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteNote(id, card);
                });

                card.innerHTML = `
                    <h3>${title}</h3>
                    <p>${content}</p>
                `;
                card.appendChild(viewBtn);
                card.appendChild(pdfBtn); // Add Print button
                card.appendChild(editBtn);
                card.appendChild(deleteBtn);

                return card;
            }


            // --- Run App Setup ---
            loadDraftFromSessionStorage(); // Load draft if it exists
            setupDraftSaving();           // Start saving drafts immediately
            loadNotesFromLocalStorage();  // Load all persistent notes

            // Event Listeners
            addNoteBtn.addEventListener('click', addNote);
            clearBtn.addEventListener('click', clearForm);

            console.log("QuickNotes 2.0 - Your Personal Note-Taking App by thehccreation.");

        });
