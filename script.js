// Online Notepad Application
class OnlineNotepad {
    constructor() {
        this.editor = document.getElementById('editor');
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.lastSaved = document.getElementById('lastSaved');
        this.notesList = document.getElementById('notesList');
        
        this.notes = [];
        this.activeNoteId = null;
        this.saveTimeout = null;
        
        this.init();
    }

    init() {
        this.loadNotes();
        this.loadDarkMode();
        this.loadSettings();
        this.setupEventListeners();
        this.updateCounts();
        this.loadFromURL(); // Check if a note is being shared
    }

    setupEventListeners() {
        // Editor input events
        this.editor.addEventListener('input', () => {
            this.updateCounts();
            this.autoSave();
        });

        // Sidebar listeners
        document.getElementById('newNoteBtn').addEventListener('click', () => this.handleNewNote());
        this.notesList.addEventListener('click', (e) => this.handleNoteListClick(e));
        
        // Mobile Sidebar Toggle
        document.getElementById('toggleNotesBtn').addEventListener('click', () => this.toggleNotesSidebar());
        document.getElementById('notesOverlay').addEventListener('click', () => this.toggleNotesSidebar(false));

        // Toolbar buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.formatText('undo'));
        document.getElementById('redoBtn').addEventListener('click', () => this.formatText('redo'));
        
        document.getElementById('cutBtn').addEventListener('click', () => this.formatText('cut'));
        document.getElementById('copyBtn').addEventListener('click', () => this.formatText('copy'));
        document.getElementById('pasteBtn').addEventListener('click', () => this.formatText('paste'));
        
        document.getElementById('boldBtn').addEventListener('click', () => this.formatText('bold'));
        document.getElementById('italicBtn').addEventListener('click', () => this.formatText('italic'));
        document.getElementById('underlineBtn').addEventListener('click', () => this.formatText('underline'));
        document.getElementById('strikeBtn').addEventListener('click', () => this.formatText('strikeThrough'));
        
        document.getElementById('linkBtn').addEventListener('click', () => this.formatText('createLink'));
        document.getElementById('ulBtn').addEventListener('click', () => this.formatText('insertUnorderedList'));
        document.getElementById('olBtn').addEventListener('click', () => this.formatText('insertOrderedList'));
        
        document.getElementById('alignLeftBtn').addEventListener('click', () => this.formatText('justifyLeft'));
        document.getElementById('alignCenterBtn').addEventListener('click', () => this.formatText('justifyCenter'));
        document.getElementById('alignRightBtn').addEventListener('click', () => this.formatText('justifyRight'));
        
        // Font selectors
        document.getElementById('fontFamilySelect').addEventListener('change', (e) => this.saveSettings());
        document.getElementById('fontSizeSelect').addEventListener('change', (e) => this.saveSettings());

        // Color pickers and hex inputs
        const fontColorPicker = document.getElementById('fontColorPicker');
        const fontColorHex = document.getElementById('fontColorHex');
        const highlightColorPicker = document.getElementById('highlightColorPicker');
        const highlightColorHex = document.getElementById('highlightColorHex');

        // Sync picker to hex
        fontColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            fontColorHex.value = color;
            this.formatText('foreColor', color);
        });
        // Sync hex to picker
        fontColorHex.addEventListener('change', (e) => {
            let color = e.target.value;
            if (!color.startsWith('#')) color = '#' + color;
            fontColorPicker.value = color;
            this.formatText('foreColor', color);
        });

        // Sync picker to hex
        highlightColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            highlightColorHex.value = color;
            this.formatText('backColor', color);
        });
        // Sync hex to picker
        highlightColorHex.addEventListener('change', (e) => {
            let color = e.target.value;
            if (!color.startsWith('#')) color = '#' + color;
            highlightColorPicker.value = color;
            this.formatText('backColor', color);
        });

        // Utility buttons
        document.getElementById('printBtn').addEventListener('click', () => this.printNote());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('fullWidthBtn').addEventListener('click', () => this.toggleFullWidth());
        document.getElementById('darkModeBtn').addEventListener('click', () => this.toggleDarkMode());

        // File operations
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadFile());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadFile());
        document.getElementById('duplicateBtn').addEventListener('click', () => this.duplicateNote());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareNote());

        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // Modal
        const modal = document.getElementById('shareModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        // Copy link button
        document.getElementById('copyLinkBtn').addEventListener('click', () => this.copyShareLink());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b': e.preventDefault(); this.formatText('bold'); break;
                    case 'i': e.preventDefault(); this.formatText('italic'); break;
                    case 'u': e.preventDefault(); this.formatText('underline'); break;
                    case 's': e.preventDefault(); this.saveActiveNote(); break;
                    case 'z': e.preventDefault(); this.formatText('undo'); break;
                    case 'y': e.preventDefault(); this.formatText('redo'); break;
                    case 'x': e.preventDefault(); this.formatText('cut'); break;
                    case 'c': e.preventDefault(); this.formatText('copy'); break;
                }
            }
        });
    }
    
    // --- Note Management ---

    loadNotes() {
        const savedNotes = localStorage.getItem('notepad_notes');
        this.notes = savedNotes ? JSON.parse(savedNotes) : [];
        
        let activeId = localStorage.getItem('notepad_activeNoteId');
        
        if (this.notes.length === 0) {
            // Create a default note if none exist
            const newNote = { id: Date.now(), title: "My First Note", content: "Welcome to your new notepad!", isRenamed: false };
            this.notes.push(newNote);
            this.activeNoteId = newNote.id;
            this.saveNotes();
        } else {
            // Check if activeId is valid, otherwise default to first note
            this.activeNoteId = activeId && this.notes.find(n => n.id == activeId) ? activeId : this.notes[0].id;
        }
        
        localStorage.setItem('notepad_activeNoteId', this.activeNoteId);
        const activeNote = this.notes.find(n => n.id == this.activeNoteId);
        this.editor.innerHTML = activeNote.content;
        this.updateSidebarUI();
    }
    
    updateSidebarUI() {
        this.notesList.innerHTML = '';
        if (this.notes.length === 0) {
            this.notesList.innerHTML = '<p style="padding: 0.5rem; text-align: center; font-size: 0.9rem; color: #888;">No notes yet.</p>';
            return;
        }
        
        this.notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.dataset.id = note.id;
            
            if (note.id == this.activeNoteId) {
                noteItem.classList.add('active');
            }
            
            const title = document.createElement('div');
            title.className = 'note-item-title';
            title.textContent = note.title;
            
            const actions = document.createElement('div');
            actions.className = 'note-item-actions';
            
            const renameBtn = document.createElement('span');
            renameBtn.className = 'note-action-btn note-item-rename';
            renameBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            renameBtn.dataset.id = note.id;
            renameBtn.title = "Rename Note";
            
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'note-action-btn note-item-delete';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>'; // 'X' icon
            deleteBtn.dataset.id = note.id;
            deleteBtn.title = "Delete Note";
            
            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);
            
            noteItem.appendChild(title);
            noteItem.appendChild(actions);
            this.notesList.appendChild(noteItem);
        });
    }
    
    handleNoteListClick(e) {
        const deleteBtn = e.target.closest('.note-item-delete');
        if (deleteBtn) {
            e.stopPropagation(); // Prevent selection
            this.handleDeleteNote(deleteBtn.dataset.id);
            return;
        }
        
        const renameBtn = e.target.closest('.note-item-rename');
        if (renameBtn) {
            e.stopPropagation(); // Prevent selection
            this.handleRenameNote(renameBtn.dataset.id);
            return;
        }
        
        const noteItem = e.target.closest('.note-item');
        if (noteItem) {
            this.handleSelectNote(noteItem.dataset.id);
        }
    }
    
    handleRenameNote(noteId) {
        const note = this.notes.find(n => n.id == noteId);
        if (!note) return;
        
        const noteItem = this.notesList.querySelector(`.note-item[data-id="${noteId}"]`);
        const titleEl = noteItem.querySelector('.note-item-title');
        const actionsEl = noteItem.querySelector('.note-item-actions');
        
        // Hide title and actions
        titleEl.classList.add('editing');
        actionsEl.style.display = 'none';
        
        // Create and show input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = note.title;
        input.className = 'note-item-rename-input';
        
        // Insert input after the title element
        titleEl.after(input);
        input.focus();
        input.select();
        
        const saveRename = () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== note.title) {
                note.title = newTitle;
                note.isRenamed = true; // Lock the title from auto-updates
                this.saveNotes();
                titleEl.textContent = newTitle;
            }
            // Clean up
            input.remove();
            titleEl.classList.remove('editing');
            actionsEl.style.display = ''; // Show actions again
        };
        
        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Triggers saveRename
            } else if (e.key === 'Escape') {
                // Cancel rename
                input.remove();
                titleEl.classList.remove('editing');
                actionsEl.style.display = '';
            }
        });
    }

    handleNewNote() {
        this.saveActiveNote(); // Save current work
        
        const newNote = { id: Date.now(), title: "New Note", content: "", isRenamed: false };
        this.notes.unshift(newNote); // Add to top
        this.activeNoteId = newNote.id;
        
        this.saveNotes();
        
        this.editor.innerHTML = "";
        this.updateCounts();
        this.updateSidebarUI();
        this.editor.focus();
        
        this.toggleNotesSidebar(false); // Close mobile sidebar if open
    }

    handleSelectNote(noteId) {
        // Check if we are in rename mode
        const renamingInput = this.notesList.querySelector('.note-item-rename-input');
        if (renamingInput) {
            renamingInput.blur(); // Save rename before switching
        }

        if (noteId == this.activeNoteId) return;
        
        this.saveActiveNote(); // Save previous note
        
        this.activeNoteId = noteId;
        const activeNote = this.notes.find(n => n.id == this.activeNoteId);
        
        if (activeNote) {
            this.editor.innerHTML = activeNote.content;
            localStorage.setItem('notepad_activeNoteId', this.activeNoteId);
            this.updateCounts();
            this.updateSidebarUI();
            this.loadSettings(); // Re-apply font settings
        } else {
            // Note was deleted or is invalid, load first note
            this.handleSelectNote(this.notes[0].id);
        }
        
        this.toggleNotesSidebar(false); // Close mobile sidebar if open
    }
    
    handleDeleteNote(noteId) {
        this.notes = this.notes.filter(n => n.id != noteId);
        
        let nextActiveId = null;
        if (this.activeNoteId == noteId) {
            if (this.notes.length > 0) {
                nextActiveId = this.notes[0].id; // Select first note
            }
        }
        
        this.saveNotes(); // Save the deletion
        this.updateSidebarUI();

        if (nextActiveId) {
            this.handleSelectNote(nextActiveId); // Switch to new active note
        } else if (this.notes.length === 0) {
            this.handleNewNote(); // Create a new note if list is empty
        }
    }
    
    getNoteTitle(plainText) {
        const trimmedText = plainText.trim();
        if (!trimmedText) return "New Note";
        return trimmedText.split('\n')[0].substring(0, 40) || "New Note";
    }
    
    // --- Saving and Loading ---

    autoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveActiveNote();
        }, 1000);
    }

    saveActiveNote() {
        if (!this.activeNoteId) return;
        
        const activeNote = this.notes.find(n => n.id == this.activeNoteId);
        if (!activeNote) return;

        const currentContent = this.editor.innerHTML;
        let currentTitle = activeNote.title;
        let titleChanged = false;

        // Only auto-update title if it has not been manually renamed
        if (!activeNote.isRenamed) {
            const newAutoTitle = this.getNoteTitle(this.editor.innerText);
            if (newAutoTitle !== activeNote.title) {
                activeNote.title = newAutoTitle;
                currentTitle = newAutoTitle;
                titleChanged = true;
            }
        }
        
        // Only save if content or title changed
        if (activeNote.content !== currentContent || titleChanged) {
            activeNote.content = currentContent;
            
            this.saveNotes();
            this.updateLastSaved();
            
            // Update title in sidebar if it changed
            if (titleChanged) {
                const noteItem = this.notesList.querySelector(`.note-item[data-id="${this.activeNoteId}"] .note-item-title`);
                if (noteItem) {
                    noteItem.textContent = currentTitle;
                }
            }
        }
    }
    
    saveNotes() {
        localStorage.setItem('notepad_notes', JSON.stringify(this.notes));
        localStorage.setItem('notepad_activeNoteId', this.activeNoteId);
    }

    loadSettings() {
        const fontSize = localStorage.getItem('notepad_fontSize');
        const fontFamily = localStorage.getItem('notepad_fontFamily');
        
        this.editor.style.fontSize = fontSize || '16px';
        document.getElementById('fontSizeSelect').value = fontSize || '16px';
        
        this.editor.style.fontFamily = fontFamily || "Inter, -apple-system, sans-serif";
        document.getElementById('fontFamilySelect').value = fontFamily || "Inter, -apple-system, sans-serif";
    }

    saveSettings() {
        const fontSize = document.getElementById('fontSizeSelect').value;
        const fontFamily = document.getElementById('fontFamilySelect').value;
        
        this.editor.style.fontSize = fontSize;
        this.editor.style.fontFamily = fontFamily;
        
        localStorage.setItem('notepad_fontSize', fontSize);
        localStorage.setItem('notepad_fontFamily', fontFamily);
        
        this.autoSave(); // Save note as settings affect it
    }
    
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const note = urlParams.get('note');
        
        if (note) {
            try {
                // Import the shared note as a new note
                const content = decodeURIComponent(atob(note));
                const title = this.getNoteTitle(content.replace(/<[^>]+>/g, ' ')); // Get title from plain text
                
                const newNote = { id: Date.now(), title, content, isRenamed: true }; // Assume shared notes have fixed names
                this.notes.unshift(newNote);
                this.activeNoteId = newNote.id;
                
                this.saveNotes();
                this.editor.innerHTML = content;
                this.updateCounts();
                this.updateSidebarUI();
                
                // Clear the URL parameter
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
                console.error('Error loading shared note:', e);
                this.editor.innerHTML = "<p>Error: Could not load the shared note. It might be corrupted.</p>";
            }
        }
    }

    // --- Formatting and Utility ---

    async formatText(command, value = null) { // Added 'async'
        if (command === 'createLink') {
            const url = prompt("Enter the URL:", "https://");
            if (url) {
                document.execCommand(command, false, url);
            }
        } else if (command === 'paste') {
            // MODIFIED PASTE LOGIC
            // Use the modern Clipboard API
            if (navigator.clipboard && navigator.clipboard.readText) {
                try {
                    // This is async and returns the text from the clipboard
                    const text = await navigator.clipboard.readText();
                    // Insert the text at the cursor
                    document.execCommand('insertText', false, text);
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                    // Fallback for browsers or permissions issues (e.g., in iframes)
                    // This will likely not work in many modern browsers but is the original behavior.
                    document.execCommand(command, false, value);
                }
            } else {
                // Fallback for very old browsers
                document.execCommand(command, false, value);
            }
        } else {
            document.execCommand(command, false, value);
        }
        
        this.editor.focus();
        this.updateCounts();
        this.autoSave(); // Trigger save after formatting
    }

    updateCounts() {
        const text = this.editor.innerText || '';
        const chars = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        this.charCount.textContent = chars;
        this.wordCount.textContent = words;
    }

    updateLastSaved() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.lastSaved.textContent = `Auto-saved at ${time}`;
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('notepad_darkMode', isDark);
        
        const icon = document.querySelector('#darkModeBtn i');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    loadDarkMode() {
        const isDark = localStorage.getItem('notepad_darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            const icon = document.querySelector('#darkModeBtn i');
            icon.className = 'fas fa-sun';
        }
    }

    toggleFullWidth() {
        document.body.classList.toggle('full-width');
        const icon = document.querySelector('#fullWidthBtn i');
        const isFullWidth = document.body.classList.contains('full-width');
        icon.className = isFullWidth ? 'fas fa-compress-arrows-alt' : 'fas fa-expand-arrows-alt';
    }
    
    toggleNotesSidebar(forceOpen = null) {
        const sidebar = document.getElementById('notes-sidebar');
        const overlay = document.getElementById('notesOverlay');
        const isOpen = sidebar.classList.contains('open');
        
        if (forceOpen === true || (forceOpen === null && !isOpen)) {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        }
    }

    clearAll() {
        // Now "Clear All" clears the *current* note.
        this.editor.innerHTML = '';
        this.updateCounts();
        this.saveActiveNote(); // Saves the cleared content
    }

    printNote() {
        document.body.style.setProperty('--editor-font-size', this.editor.style.fontSize || '16px');
        document.body.style.setProperty('--editor-line-height', this.editor.style.lineHeight || '1.8');
        document.body.style.setProperty('--editor-font-family', this.editor.style.fontFamily || "'Times New Roman', serif");
        window.print();
    }

    // --- File Operations ---

    uploadFile() {
        // This will import the file as a *new note*
        document.getElementById('fileInput').click();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            let content = e.target.result;
            
            if (file.type === 'text/plain') {
                content = content.replace(/\n/g, '<br>');
            }
            
            // Create a new note for the uploaded content
            const title = file.name.replace(/\.(txt|html|htm)$/i, ''); // Use file name as title
            const newNote = { id: Date.now(), title, content, isRenamed: true }; // Lock title
            this.notes.unshift(newNote);
            this.activeNoteId = newNote.id;
            
            this.saveNotes();
            this.editor.innerHTML = content;
            this.updateCounts();
            this.updateSidebarUI();
        };

        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    downloadFile() {
        // Downloads the *current* note as .txt
        const activeNote = this.notes.find(n => n.id == this.activeNoteId);
        const content = this.editor.innerText; // Download plain text version
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Sanitize title for filename
        const fileName = (activeNote.title || 'notepad').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${fileName}.txt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    duplicateNote() {
        // Duplicates the *current* note and opens it in a new window (original behavior)
        const content = this.editor.innerHTML;
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`
                <!DOCTYPE html><html lang="en"><head><title>Duplicated Note</title>
                <style>body { font-family: -apple-system, sans-serif; padding: 2rem; } .editor { border: 1px solid #ccc; padding: 1rem; }</style></head>
                <body><h1>Duplicated Note</h1><div class="editor" contenteditable="true">${content}</div></body></html>
            `);
            newWindow.document.close();
        }
    }

    shareNote() {
        // Shares the *current* note
        try {
            const content = this.editor.innerHTML;
            const encoded = btoa(encodeURIComponent(content));
            const url = `${window.location.origin}${window.location.pathname}?note=${encoded}`;
            
            document.getElementById('shareLink').value = url;
            document.getElementById('shareModal').style.display = 'block';
        } catch (e) {
            console.error("Error creating share link:", e);
            document.getElementById('shareLink').value = "Error: Note is too large to share via URL.";
            document.getElementById('shareModal').style.display = 'block';
        }
    }

    copyShareLink() {
        const input = document.getElementById('shareLink');
        input.select();
        try {
            document.execCommand('copy'); // Using execCommand for iframe compatibility
            this.showCopySuccess();
        } catch (err) {
            console.error('Failed to copy link.');
        }
    }
    
    showCopySuccess() {
        const btn = document.getElementById('copyLinkBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OnlineNotepad();
});
