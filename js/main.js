// Online Notepad Application
class OnlineNotepad {
    constructor() {
        this.editor = document.getElementById('editor');
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.lastSaved = document.getElementById('lastSaved');
        this.saveTimeout = null;
        
        this.init();
    }

    init() {
        // Load saved content
        this.loadContent();
        
        // Load dark mode preference
        this.loadDarkMode();
        
        // Load from URL if shared
        this.loadFromURL();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial count update
        this.updateCounts();
    }

    setupEventListeners() {
        // Editor input events
        this.editor.addEventListener('input', () => {
            this.updateCounts();
            this.autoSave();
        });

        this.editor.addEventListener('paste', (e) => {
            // Handle paste to ensure plain text in some cases
            // Allow default behavior for rich content
        });

        // Toolbar buttons
        document.getElementById('boldBtn').addEventListener('click', () => this.formatText('bold'));
        document.getElementById('italicBtn').addEventListener('click', () => this.formatText('italic'));
        document.getElementById('underlineBtn').addEventListener('click', () => this.formatText('underline'));
        document.getElementById('strikeBtn').addEventListener('click', () => this.formatText('strikeThrough'));
        document.getElementById('ulBtn').addEventListener('click', () => this.formatText('insertUnorderedList'));
        document.getElementById('olBtn').addEventListener('click', () => this.formatText('insertOrderedList'));
        
        // Font size
        document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
            this.editor.style.fontSize = e.target.value;
            this.saveSettings();
        });

        // Utility buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
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
                    case 'b':
                        e.preventDefault();
                        this.formatText('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.formatText('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.formatText('underline');
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveContent();
                        break;
                }
            }
        });
    }

    // Text formatting
    formatText(command) {
        document.execCommand(command, false, null);
        this.editor.focus();
        this.updateCounts();
        this.autoSave();
    }

    // Update character and word counts
    updateCounts() {
        const text = this.editor.innerText || '';
        const chars = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        this.charCount.textContent = chars;
        this.wordCount.textContent = words;
    }

    // Auto-save functionality
    autoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveContent();
        }, 1000);
    }

    saveContent() {
        const content = this.editor.innerHTML;
        localStorage.setItem('notepad_content', content);
        this.updateLastSaved();
    }

    loadContent() {
        const saved = localStorage.getItem('notepad_content');
        if (saved) {
            this.editor.innerHTML = saved;
        }
        
        // Load font size
        const fontSize = localStorage.getItem('notepad_fontSize');
        if (fontSize) {
            this.editor.style.fontSize = fontSize;
            document.getElementById('fontSizeSelect').value = fontSize;
        }
    }

    saveSettings() {
        localStorage.setItem('notepad_fontSize', this.editor.style.fontSize);
    }

    updateLastSaved() {
        const now = new Date();
        const time = now.toLocaleTimeString();
        this.lastSaved.textContent = `Auto-saved at ${time}`;
    }

    // Dark mode
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

    // Fullscreen mode
    toggleFullscreen() {
        document.body.classList.toggle('fullscreen');
        const icon = document.querySelector('#fullscreenBtn i');
        const isFullscreen = document.body.classList.contains('fullscreen');
        icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
    }

    // Clear all content
    clearAll() {
        if (confirm('Are you sure you want to clear all content? This cannot be undone.')) {
            this.editor.innerHTML = '';
            this.updateCounts();
            this.saveContent();
        }
    }

    // File upload
    uploadFile() {
        document.getElementById('fileInput').click();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            let content = e.target.result;
            
            // Handle different file types
            if (file.name.endsWith('.txt')) {
                // Plain text - convert to HTML
                content = content.replace(/\n/g, '<br>');
            } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
                // HTML file - use as is
            } else {
                // For other formats, treat as plain text
                content = content.replace(/\n/g, '<br>');
            }
            
            this.editor.innerHTML = content;
            this.updateCounts();
            this.saveContent();
        };

        // Read as text
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // File download
    downloadFile() {
        const content = this.editor.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notepad_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Duplicate note
    duplicateNote() {
        const content = this.editor.innerHTML;
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Duplicated Note - Online Notepad</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="css/style.css">
            </head>
            <body>
                <div class="container">
                    <header class="header">
                        <div class="logo">
                            <i class="fas fa-file-alt"></i>
                            <h1>Online Notepad - Duplicate</h1>
                        </div>
                    </header>
                    <div class="editor-container">
                        <div class="editor" contenteditable="true">${content}</div>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    // Share note
    shareNote() {
        const content = this.editor.innerHTML;
        const encoded = btoa(encodeURIComponent(content));
        const url = `${window.location.origin}${window.location.pathname}?note=${encoded}`;
        
        document.getElementById('shareLink').value = url;
        document.getElementById('shareModal').style.display = 'block';
    }

    copyShareLink() {
        const input = document.getElementById('shareLink');
        input.select();
        document.execCommand('copy');
        
        const btn = document.getElementById('copyLinkBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }

    // Load content from URL
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const note = urlParams.get('note');
        
        if (note) {
            try {
                const decoded = decodeURIComponent(atob(note));
                this.editor.innerHTML = decoded;
                this.updateCounts();
            } catch (e) {
                console.error('Error loading shared note:', e);
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OnlineNotepad();
});