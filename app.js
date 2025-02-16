class CodeSnap {
    constructor() {
        this.snippets = this.loadSnippets();
        this.initializeElements();
        this.attachEventListeners();
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
    }

    attachEventListeners() {
        this.saveBtn.addEventListener('click', () => this.saveSnippet());
        this.searchInput.addEventListener('input', () => this.filterSnippets());
        this.snippetsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                this.deleteSnippet(parseInt(e.target.dataset.id));
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

        const snippet = {
            id: Date.now(),
            title,
            language,
            code,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            created: new Date().toISOString()
        };

        this.snippets.unshift(snippet);
        this.saveSnippets();
        this.renderSnippets();
        this.clearForm();
    }

    clearForm() {
        this.titleInput.value = '';
        this.codeInput.value = '';
        this.tagsInput.value = '';
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

    filterSnippets() {
        const query = this.searchInput.value.toLowerCase();
        const filtered = this.snippets.filter(snippet => 
            snippet.title.toLowerCase().includes(query) ||
            snippet.code.toLowerCase().includes(query) ||
            snippet.tags.some(tag => tag.toLowerCase().includes(query))
        );
        this.renderSnippets(filtered);
    }

    deleteSnippet(id) {
        if (confirm('Are you sure you want to delete this snippet?')) {
            this.snippets = this.snippets.filter(snippet => snippet.id !== id);
            this.saveSnippets();
            this.renderSnippets();
        }
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