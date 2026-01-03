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
        this.maxNotes = 10; // Add max notes limit
        
        // Track selection to fix toolbar focus issues
        this.savedRange = null;
        
        this.init();
    }

    init() {
        this.loadNotes();
        this.loadDarkMode();
        this.setupEventListeners();
        this.updateCounts();
        this.loadFromURL(); // Check if a note is being shared
        this.updateToolbar(); // Initial toolbar sync
        
        // Set Footer Year if footer exists
        const yearSpan = document.getElementById('year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    }

    setupEventListeners() {
        // Editor input events
        this.editor.addEventListener('input', () => {
            this.updateCounts();
            this.autoSave();
        });

        // NEW: Smart Paste Handler (Strips colors on paste)
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));

        // Save selection when editor loses focus (crucial for dropdowns)
        this.editor.addEventListener('blur', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                this.savedRange = selection.getRangeAt(0);
            }
        });

        // Sync toolbar on cursor movement
        this.editor.addEventListener('keyup', () => this.updateToolbar());
        this.editor.addEventListener('mouseup', () => this.updateToolbar());
        this.editor.addEventListener('click', () => this.updateToolbar());

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
        
        // NEW: Utility buttons
        document.getElementById('dateTimeBtn').addEventListener('click', () => this.insertDateTime());
        document.getElementById('selectAllBtn').addEventListener('click', () => this.selectAllText());
        document.getElementById('findReplaceBtn').addEventListener('click', () => this.openFindReplaceModal());
        
        // NEW: Lock View Button
        const lockBtn = document.getElementById('lockViewBtn');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => this.toggleViewLock());
        }

        // Font selectors
        document.getElementById('formatBlockSelect').addEventListener('change', (e) => {
            this.formatText('formatBlock', e.target.value);
        });

        document.getElementById('fontFamilySelect').addEventListener('change', (e) => {
            this.formatText('fontName', e.target.value);
        });

        document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
            let size = 3; 
            switch(e.target.value) {
                case '12px': size = 1; break;
                case '14px': size = 2; break;
                case '16px': size = 3; break;
                case '18px': size = 4; break;
                case '20px': size = 5; break;
                case '24px': size = 6; break;
                case '28px': size = 7; break;
                case '32px': size = 7; break;
                default: size = 3;
            }
            this.formatText('fontSize', size);
        });

        // Color pickers
        const fontColorPicker = document.getElementById('fontColorPicker');
        const fontColorHex = document.getElementById('fontColorHex');
        const highlightColorPicker = document.getElementById('highlightColorPicker');
        const highlightColorHex = document.getElementById('highlightColorHex');

        fontColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            fontColorHex.value = color;
            this.formatText('foreColor', color);
        });
        fontColorHex.addEventListener('change', (e) => {
            let color = e.target.value;
            if (!color.startsWith('#')) color = '#' + color;
            fontColorPicker.value = color;
            this.formatText('foreColor', color);
        });

        highlightColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            highlightColorHex.value = color;
            this.formatText('backColor', color);
        });
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

        // Modals
        const modal = document.getElementById('shareModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        
        const frModal = document.getElementById('findReplaceModal');
        const frCloseBtn = frModal.querySelector('.close');
        frCloseBtn.addEventListener('click', () => frModal.style.display = 'none');
        
        document.getElementById('executeReplaceBtn').addEventListener('click', () => this.executeReplace());
        document.getElementById('executeFindBtn').addEventListener('click', () => this.executeFind());

        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
            if (e.target === frModal) frModal.style.display = 'none';
        });

        document.getElementById('copyLinkBtn').addEventListener('click', () => this.copyShareLink());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    this.saveActiveNote();
                    this.showToast('Note saved manually', 'success');
                }
            }
        });
    }

    // --- View Locking Feature ---
    toggleViewLock() {
        document.body.classList.toggle('view-locked');
        const isLocked = document.body.classList.contains('view-locked');
        const btn = document.getElementById('lockViewBtn');
        const icon = btn.querySelector('i');
        
        if (isLocked) {
            btn.classList.add('active');
            // Informative tooltip for Locked state
            btn.title = "View Locked: Scrolling disabled to keep focus on editor";
            icon.className = 'fas fa-lock';
            this.showToast('View Locked: Focus Mode Enabled', 'success');
        } else {
            btn.classList.remove('active');
            // Informative tooltip for Unlocked state
            btn.title = "Lock View: Prevent scrolling to keep focus on the editor";
            icon.className = 'fas fa-lock-open';
            this.showToast('View Unlocked', 'success');
        }
    }

    // NEW: Handle Paste Event to strip conflicting colors AND sizes
    handlePaste(e) {
        e.preventDefault();
        
        const clipboardData = (e.clipboardData || window.clipboardData);
        const html = clipboardData.getData('text/html');
        const text = clipboardData.getData('text/plain');

        if (html) {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            // Remove all inline styles to force pasted content to inherit editor styles
            temp.querySelectorAll('*').forEach(el => {
                el.removeAttribute('style'); // Completely strips style="..." attribute
            });
            
            document.execCommand('insertHTML', false, temp.innerHTML);
        } else {
            document.execCommand('insertText', false, text);
        }
        
        this.updateCounts();
        this.autoSave();
    }

    // Update toolbar state based on cursor position
    updateToolbar() {
        const formatSelect = document.getElementById('formatBlockSelect');
        const block = document.queryCommandValue('formatBlock');
        
        if (block && formatSelect) {
            const targetValue = `<${block.toLowerCase()}>`;
            
            let found = false;
            for(let i = 0; i < formatSelect.options.length; i++) {
                if (formatSelect.options[i].value === targetValue) {
                    formatSelect.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                for(let i = 0; i < formatSelect.options.length; i++) {
                    if (formatSelect.options[i].value === '<p>') {
                        formatSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    }
    
    // --- Note Management ---

    loadNotes() {
        const savedNotes = localStorage.getItem('notepad_notes');
        this.notes = savedNotes ? JSON.parse(savedNotes) : [];
        
        if (this.notes.length > this.maxNotes) {
            this.notes = this.notes.slice(0, this.maxNotes);
        }

        let activeId = localStorage.getItem('notepad_activeNoteId');
        
        if (this.notes.length === 0) {
            const newNote = { id: Date.now(), title: "New Note", content: "", isRenamed: false };
            this.notes.push(newNote);
            this.activeNoteId = newNote.id;
            this.saveNotes();
        } else {
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
            this.updateNewNoteButtonState();
            return;
        }
        
        this.notes.forEach((note, index) => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.dataset.id = note.id;
            
            if (note.id == this.activeNoteId) {
                noteItem.classList.add('active');
            }
            
            const countSpan = document.createElement('span');
            countSpan.className = 'note-count';
            countSpan.textContent = `#${index + 1}`;
            
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
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.dataset.id = note.id;
            deleteBtn.title = "Delete Note";
            
            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);
            
            noteItem.appendChild(countSpan);
            noteItem.appendChild(title);
            noteItem.appendChild(actions);
            this.notesList.appendChild(noteItem);
        });
        
        this.updateNewNoteButtonState();
    }
    
    handleNoteListClick(e) {
        const deleteBtn = e.target.closest('.note-item-delete');
        if (deleteBtn) {
            e.stopPropagation();
            this.handleDeleteNote(deleteBtn.dataset.id);
            return;
        }
        
        const renameBtn = e.target.closest('.note-item-rename');
        if (renameBtn) {
            e.stopPropagation();
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
        
        titleEl.classList.add('editing');
        actionsEl.style.display = 'none';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = note.title;
        input.className = 'note-item-rename-input';
        
        titleEl.after(input);
        input.focus();
        input.select();
        
        const saveRename = () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== note.title) {
                note.title = newTitle;
                note.isRenamed = true;
                this.saveNotes();
                titleEl.textContent = newTitle;
            }
            input.remove();
            titleEl.classList.remove('editing');
            actionsEl.style.display = '';
        };
        
        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                input.remove();
                titleEl.classList.remove('editing');
                actionsEl.style.display = '';
            }
        });
    }

    handleNewNote() {
        if (this.notes.length >= this.maxNotes) {
            console.warn("Maximum number of notes (10) reached.");
            return;
        }
        this.saveActiveNote();
        
        const newNote = { id: Date.now(), title: "New Note", content: "", isRenamed: false };
        this.notes.unshift(newNote);
        this.activeNoteId = newNote.id;
        
        this.saveNotes();
        
        this.editor.innerHTML = "";
        this.updateCounts();
        this.updateSidebarUI();
        this.editor.focus();
        
        this.toggleNotesSidebar(false);
    }

    handleSelectNote(noteId) {
        const renamingInput = this.notesList.querySelector('.note-item-rename-input');
        if (renamingInput) {
            renamingInput.blur();
        }

        if (noteId == this.activeNoteId) return;
        
        this.saveActiveNote();
        
        this.activeNoteId = noteId;
        const activeNote = this.notes.find(n => n.id == this.activeNoteId);
        
        if (activeNote) {
            this.editor.innerHTML = activeNote.content;
            localStorage.setItem('notepad_activeNoteId', this.activeNoteId);
            this.updateCounts();
            this.updateSidebarUI();
        } else {
            this.handleSelectNote(this.notes[0].id);
        }
        
        this.toggleNotesSidebar(false);
    }
    
    handleDeleteNote(noteId) {
        this.notes = this.notes.filter(n => n.id != noteId);
        
        let nextActiveId = null;
        if (this.activeNoteId == noteId) {
            if (this.notes.length > 0) {
                nextActiveId = this.notes[0].id;
            }
        }
        
        this.saveNotes();
        this.updateSidebarUI();

        if (nextActiveId) {
            this.handleSelectNote(nextActiveId);
        } else if (this.notes.length === 0) {
            this.handleNewNote();
        }
    }
    
    updateNewNoteButtonState() {
        const newNoteBtn = document.getElementById('newNoteBtn');
        if (this.notes.length >= this.maxNotes) {
            newNoteBtn.disabled = true;
            newNoteBtn.title = "Maximum number of notes reached (10)";
        } else {
            newNoteBtn.disabled = false;
            newNoteBtn.title = "New Note";
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

        if (!activeNote.isRenamed) {
            const newAutoTitle = this.getNoteTitle(this.editor.innerText);
            if (newAutoTitle !== activeNote.title) {
                activeNote.title = newAutoTitle;
                currentTitle = newAutoTitle;
                titleChanged = true;
            }
        }
        
        if (activeNote.content !== currentContent || titleChanged) {
            activeNote.content = currentContent;
            
            this.saveNotes();
            this.updateLastSaved();
            
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
        // Deprecated
    }

    saveSettings() {
        // Deprecated
    }
    
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const note = urlParams.get('note');
        
        if (note) {
            try {
                if (this.notes.length >= this.maxNotes) {
                    console.warn("Note limit reached. Cannot import shared note.");
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return;
                }

                const content = decodeURIComponent(atob(note));
                const title = this.getNoteTitle(content.replace(/<[^>]+>/g, ' '));
                
                const newNote = { id: Date.now(), title, content, isRenamed: true };
                this.notes.unshift(newNote);
                this.activeNoteId = newNote.id;
                
                this.saveNotes();
                this.editor.innerHTML = content;
                this.updateCounts();
                this.updateSidebarUI();
                
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
                console.error('Error loading shared note:', e);
                this.editor.innerHTML = "<p>Error: Could not load the shared note. It might be corrupted.</p>";
            }
        }
    }

    // --- New Features Implementation ---

    insertDateTime() {
        this.editor.focus();
        const now = new Date();
        const dateString = now.toLocaleString();
        document.execCommand('insertText', false, dateString);
        this.updateCounts();
        this.autoSave();
    }

    selectAllText() {
        this.editor.focus();
        document.execCommand('selectAll', false, null);
    }

    openFindReplaceModal() {
        const modal = document.getElementById('findReplaceModal');
        modal.style.display = 'block';
        document.getElementById('findInput').focus();
    }

    executeReplace() {
        const findText = document.getElementById('findInput').value;
        const replaceText = document.getElementById('replaceInput').value;
        
        if (!findText) {
            this.showToast('Please enter text to find', 'error');
            return;
        }

        const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedFind, 'g');
        
        this.replaceInTextNodes(this.editor, regex, replaceText);
        
        this.updateCounts();
        this.autoSave();
        this.showToast('Replacement complete', 'success');
        document.getElementById('findReplaceModal').style.display = 'none';
    }
    
    replaceInTextNodes(element, regex, replacement) {
        if (element.nodeType === 3) { // Text node
            if (regex.test(element.nodeValue)) {
                element.nodeValue = element.nodeValue.replace(regex, replacement);
            }
        } else if (element.nodeType === 1 && element.nodeName !== 'SCRIPT' && element.nodeName !== 'STYLE') {
            for (let i = 0; i < element.childNodes.length; i++) {
                this.replaceInTextNodes(element.childNodes[i], regex, replacement);
            }
        }
    }

    executeFind() {
       const findText = document.getElementById('findInput').value;
       if (!findText) return;
       
       if (window.find && window.getSelection) {
           this.editor.focus();
           const found = window.find(findText);
           if (!found) {
               this.showToast('Text not found', 'error');
           }
       } else {
           this.showToast('Browser search not supported', 'error');
       }
    }

    // --- Formatting and Utility ---

    async formatText(command, value = null) {
        this.editor.focus();
        if (this.savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.savedRange);
        }

        if (command === 'createLink') {
            const url = prompt("Enter the URL:", "https://");
            if (url) {
                document.execCommand(command, false, url);
            }
        } else if (command === 'paste') {
            if (navigator.clipboard && navigator.clipboard.readText) {
                try {
                    const text = await navigator.clipboard.readText();
                    document.execCommand('insertText', false, text);
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                    document.execCommand(command, false, value);
                }
            } else {
                document.execCommand(command, false, value);
            }
        } else if (command === 'formatBlock') {
            // Apply the block format (H1, H2, etc.)
            document.execCommand(command, false, value);
            
            // --- FIX FOR HEADINGS ---
            // After applying formatBlock, we need to find the node and aggressively 
            // remove inline font-size/weight from it and ALL its children to let CSS take over.
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.anchorNode;
                
                // Traverse up to find the block element (element node with H1-H6, P, DIV tag)
                // Use a safer check to avoid infinite loops or going past editor
                while (node && node !== this.editor) {
                    if (node.nodeType === 1 && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV'].includes(node.tagName)) {
                        break;
                    }
                    node = node.parentNode;
                }
                
                // If we found a valid block element inside the editor
                if (node && node !== this.editor && node.nodeType === 1) {
                    // 1. Clear inline styles on the block tag itself
                    node.style.fontSize = '';
                    node.style.fontWeight = '';
                    node.style.lineHeight = '';
                    node.style.margin = ''; 
                    
                    // 2. Clear inline styles on ALL child elements (spans, strong, b, i, font etc.)
                    // This is crucial because 'font-size' on a child span overrides the parent H1's size.
                    const children = node.querySelectorAll('*');
                    children.forEach(child => {
                        child.style.fontSize = '';
                        // Removed fontWeight reset for children to preserve bold if applied, 
                        // but H1 itself should set weight.
                        child.style.lineHeight = '';
                        
                        // If it's a FONT tag (deprecated but possible), remove size attr
                        if (child.tagName === 'FONT') {
                            child.removeAttribute('size');
                            child.removeAttribute('face');
                        }
                    });
                }
            }
        } else {
            document.execCommand(command, false, value);
        }
        
        this.editor.focus();
        this.updateCounts();
        this.autoSave();
        this.updateToolbar();
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
        this.editor.innerHTML = '';
        this.updateCounts();
        this.saveActiveNote();
    }

    printNote() {
        document.body.style.setProperty('--editor-font-size', this.editor.style.fontSize || '14px');
        document.body.style.setProperty('--editor-line-height', this.editor.style.lineHeight || '1.8');
        document.body.style.setProperty('--editor-font-family', this.editor.style.fontFamily || "'Times New Roman', serif");
        window.print();
    }

    // --- File Operations ---

    uploadFile() {
        if (this.notes.length >= this.maxNotes) {
            console.warn("Cannot upload, maximum number of notes (10) reached.");
            return;
        }
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
            
            if (this.activeNoteId) {
                const currentContent = this.editor.innerHTML.trim();
                
                if (!currentContent || currentContent === '<br>') {
                    this.editor.innerHTML = content;
                } else {
                    this.editor.innerHTML += '<br><br>' + content;
                }
                
                this.updateCounts();
                this.saveActiveNote();
                this.showToast('File content appended successfully', 'success');
            } else {
                const title = file.name.replace(/\.(txt|html|htm)$/i, ''); 
                const newNote = { id: Date.now(), title, content, isRenamed: true };
                this.notes.unshift(newNote);
                this.activeNoteId = newNote.id;
                
                this.saveNotes();
                this.editor.innerHTML = content;
                this.updateCounts();
                this.updateSidebarUI();
                this.showToast('File imported as new note', 'success');
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    downloadFile() {
        const activeNote = this.notes.find(n => n.id == this.activeNoteId);
        const content = this.editor.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const fileName = (activeNote.title || 'notepad').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${fileName}.txt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    duplicateNote() {
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
            document.execCommand('copy');
            this.showCopySuccess();
            this.showToast('Link copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy link.');
            this.showToast('Failed to copy link', 'error');
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

    // Toast Notification System
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        container.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OnlineNotepad();

    // Register Service Worker for PWA/Offline support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
});
