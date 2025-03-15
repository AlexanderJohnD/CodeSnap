class CodeSnap {
    constructor() {
        this.snippets = this.loadSnippets();
        this.editingId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.initTheme();
        this.updateTagFilter();
        this.renderSnippets();
    }

    initializeElements() {
        this.titleInput = document.getElementById('snippet-title');
        this.languageSelect = document.getElementById('language');
        this.codeInput = document.getElementById('code-input');
        this.tagsInput = document.getElementById('tags');
        this.saveBtn = document.getElementById('save-btn');
        this.searchInput = document.getElementById('search');
        this.snippetsContainer = document.getElementById('snippets-container');
        this.exportBtn = document.getElementById('export-btn');
        this.importBtn = document.getElementById('import-btn');
        this.importFile = document.getElementById('import-file');
        this.tagFilter = document.getElementById('tag-filter');
        this.themeToggle = document.getElementById('theme-toggle');
    }

    attachEventListeners() {
        this.saveBtn.addEventListener('click', () => this.saveSnippet());
        this.searchInput.addEventListener('input', () => this.filterSnippets());
        this.tagFilter.addEventListener('change', () => this.filterSnippets());
        this.exportBtn.addEventListener('click', () => this.exportSnippets());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.importSnippets(e));
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.snippetsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                this.deleteSnippet(parseInt(e.target.dataset.id));
            } else if (e.target.classList.contains('copy-btn')) {
                this.copySnippet(parseInt(e.target.dataset.id));
            } else if (e.target.classList.contains('edit-btn')) {
                this.editSnippet(parseInt(e.target.dataset.id));
            }
        });
    }

    loadSnippets() {
        const stored = localStorage.getItem('codesnap-snippets');
        return stored ? JSON.parse(stored) : [];
    }

    saveSnippets() {
        localStorage.setItem('codesnap-snippets', JSON.stringify(this.snippets));
    }

    saveSnippet() {
        const title = this.titleInput.value.trim();
        const language = this.languageSelect.value;
        const code = this.codeInput.value.trim();
        const tags = this.tagsInput.value.trim();

        if (!title || !code) {
            alert('Please fill in title and code');
            return;
        }

        if (this.editingId) {
            const index = this.snippets.findIndex(s => s.id === this.editingId);
            if (index !== -1) {
                this.snippets[index] = {
                    ...this.snippets[index],
                    title,
                    language,
                    code,
                    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                    updated: new Date().toISOString()
                };
            }
            this.editingId = null;
            this.saveBtn.textContent = 'Save Snippet';
        } else {
            const snippet = {
                id: Date.now(),
                title,
                language,
                code,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                created: new Date().toISOString()
            };
            this.snippets.unshift(snippet);
        }

        this.saveSnippets();
        this.updateTagFilter();
        this.renderSnippets();
        this.clearForm();
    }

    editSnippet(id) {
        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            this.titleInput.value = snippet.title;
            this.languageSelect.value = snippet.language;
            this.codeInput.value = snippet.code;
            this.tagsInput.value = snippet.tags.join(', ');
            this.editingId = id;
            this.saveBtn.textContent = 'Update Snippet';
            this.titleInput.focus();
        }
    }

    clearForm() {
        this.titleInput.value = '';
        this.codeInput.value = '';
        this.tagsInput.value = '';
        this.editingId = null;
        this.saveBtn.textContent = 'Save Snippet';
    }

    renderSnippets(snippetsToRender = this.snippets) {
        if (snippetsToRender.length === 0) {
            this.snippetsContainer.innerHTML = '<p>No snippets found</p>';
            return;
        }

        this.snippetsContainer.innerHTML = snippetsToRender.map(snippet => `
            <div class="snippet-item">
                <div class="snippet-header">
                    <span class="snippet-title">${this.escapeHtml(snippet.title)}</span>
                    <div class="snippet-actions">
                        <span class="snippet-language">${snippet.language}</span>
                        <button class="copy-btn" data-id="${snippet.id}">Copy</button>
                        <button class="edit-btn" data-id="${snippet.id}">Edit</button>
                        <button class="delete-btn" data-id="${snippet.id}">Delete</button>
                    </div>
                </div>
                <pre class="snippet-code">${this.escapeHtml(snippet.code)}</pre>
                <div class="snippet-tags">
                    Tags: ${snippet.tags.map(tag => this.escapeHtml(tag)).join(', ') || 'None'}
                </div>
            </div>
        `).join('');
    }

    updateTagFilter() {
        const allTags = new Set();
        this.snippets.forEach(snippet => {
            snippet.tags.forEach(tag => allTags.add(tag));
        });
        
        const currentValue = this.tagFilter.value;
        this.tagFilter.innerHTML = '<option value="">All Tags</option>';
        Array.from(allTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            this.tagFilter.appendChild(option);
        });
        
        if (allTags.has(currentValue)) {
            this.tagFilter.value = currentValue;
        }
    }

    filterSnippets() {
        const query = this.searchInput.value.toLowerCase();
        const selectedTag = this.tagFilter.value;
        
        const filtered = this.snippets.filter(snippet => {
            const matchesSearch = snippet.title.toLowerCase().includes(query) ||
                snippet.code.toLowerCase().includes(query) ||
                snippet.tags.some(tag => tag.toLowerCase().includes(query));
            
            const matchesTag = !selectedTag || snippet.tags.includes(selectedTag);
            
            return matchesSearch && matchesTag;
        });
        
        this.renderSnippets(filtered);
    }

    deleteSnippet(id) {
        if (confirm('Are you sure you want to delete this snippet?')) {
            this.snippets = this.snippets.filter(snippet => snippet.id !== id);
            this.saveSnippets();
            this.updateTagFilter();
            this.renderSnippets();
        }
    }

    copySnippet(id) {
        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            navigator.clipboard.writeText(snippet.code).then(() => {
                const copyBtn = document.querySelector(`button.copy-btn[data-id="${id}"]`);
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#27ae60';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.backgroundColor = '';
                }, 2000);
            }).catch(() => {
                alert('Failed to copy to clipboard');
            });
        }
    }

    exportSnippets() {
        if (this.snippets.length === 0) {
            alert('No snippets to export');
            return;
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            count: this.snippets.length,
            snippets: this.snippets
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `codesnap-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importSnippets(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                let snippetsToImport = [];

                if (importData.snippets && Array.isArray(importData.snippets)) {
                    snippetsToImport = importData.snippets;
                } else if (Array.isArray(importData)) {
                    snippetsToImport = importData;
                } else {
                    throw new Error('Invalid format');
                }

                let imported = 0;
                snippetsToImport.forEach(snippet => {
                    if (snippet.title && snippet.code) {
                        const newSnippet = {
                            id: Date.now() + imported,
                            title: snippet.title,
                            language: snippet.language || 'javascript',
                            code: snippet.code,
                            tags: snippet.tags || [],
                            created: snippet.created || new Date().toISOString(),
                            imported: true
                        };
                        this.snippets.unshift(newSnippet);
                        imported++;
                    }
                });

                if (imported > 0) {
                    this.saveSnippets();
                    this.renderSnippets();
                    alert(`Successfully imported ${imported} snippets!`);
                } else {
                    alert('No valid snippets found to import');
                }
            } catch (error) {
                alert('Error importing file. Please check the format.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    initTheme() {
        const savedTheme = localStorage.getItem('codesnap-theme') || 'light';
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        this.updateThemeToggle();
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('codesnap-theme', isDark ? 'dark' : 'light');
        this.updateThemeToggle();
    }

    updateThemeToggle() {
        const isDark = document.body.classList.contains('dark-theme');
        this.themeToggle.textContent = isDark ? '☀️' : '🌙';
        this.themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CodeSnap();
});