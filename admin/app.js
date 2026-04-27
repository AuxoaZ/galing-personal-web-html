let contentData = {};
const repoConfig = {
    owner: 'AuxoaZ', // GitHub Username
    repo: 'galing-personal-web-html'   // Nama Repository
};

let editors = {};

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    initEditors();
    initAuth();
});

// Tab Logic
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
            document.getElementById(`tab-${tabId}`).style.display = 'block';
        });
    });
}

function initEditors() {
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'align': [] }],
        ['link', 'video'],
        ['clean']                                         // remove formatting button
    ];

    ['teaching', 'service', 'awards', 'media', 'fun'].forEach(id => {
        editors[id] = new Quill(`#${id}-editor`, {
            theme: 'snow',
            modules: { toolbar: toolbarOptions }
        });
    });
}

// Auth Logic
function initAuth() {
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('access-key');

    // Setup input listener for 'Enter'
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    loginBtn.addEventListener('click', () => {
        const pass = passwordInput.value.trim();
        if (pass === 'admin321') {
            localStorage.setItem('admin_pass', pass);
            showDashboard();
            loadContent();
        } else {
            showLoginError('Invalid Access Key');
        }
    });

    // Auto-login if previously logged in
    if (localStorage.getItem('admin_pass') === 'admin321') {
        showDashboard();
        loadContent();
    }
}

function showLoginError(msg) {
    const err = document.getElementById('login-error');
    err.textContent = msg;
    err.style.display = 'block';
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('save-bar').style.display = 'flex';
}

// Data Handling
async function loadContent() {
    try {
        const response = await fetch('/content.json');
        if(!response.ok) throw new Error('Root json failed');
        contentData = await response.json();
        populateForm(contentData);
    } catch (e) {
        try {
            const res2 = await fetch('../content.json');
            contentData = await res2.json();
            populateForm(contentData);
        } catch(e2) {
            showToast('Error loading content.json. Check connection or console.', true);
        }
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function populateForm(data) {
    const form = document.getElementById('admin-form');
    
    // Fill basic fields
    Object.keys(data.metadata || {}).forEach(key => {
        if (form[`metadata.${key}`]) form[`metadata.${key}`].value = data.metadata[key];
    });
    
    Object.keys(data.profile || {}).forEach(key => {
        if (typeof data.profile[key] === 'string') {
            if (form[`profile.${key}`]) form[`profile.${key}`].value = data.profile[key];
        }
    });
    
    if(data.job_market) {
        if(form['job_market.show']) form['job_market.show'].value = String(data.job_market.show);
        if(form['job_market.text']) form['job_market.text'].value = data.job_market.text;
    }
    
    // Fill dynamic lists
    renderList('social', data.profile ? data.profile.social : []);
    renderList('bio', data.bio || []);
    renderList('talks', data.upcoming_talks || []);
    renderList('news', data.recent_news || []);
    renderResearchList();

    // Fill Quill Editors
    ['teaching', 'service', 'awards', 'media', 'fun'].forEach(id => {
        if (data[`${id}_html`]) {
            editors[id].clipboard.dangerouslyPasteHTML(data[`${id}_html`]);
        }
    });
}

function renderList(type, items) {
    const container = document.getElementById(`${type}-list`);
    if(!container) return;
    container.innerHTML = '';
    if(items) {
        items.forEach((item, index) => {
            container.appendChild(createItemEl(type, item, index));
        });
    }
}

function createItemEl(type, item, index) {
    const div = document.createElement('div');
    div.className = 'list-item';
    
    let html = `<button type="button" class="remove-btn" onclick="removeItem('${type}', ${index})"><i class="fas fa-trash"></i> Remove</button>`;
    
    if (type === 'social') {
        html += `
            <div class="section-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="input-group"><label>Type</label><input type="text" value="${escapeHtml(item.type)}" onchange="updateItem('${type}', ${index}, 'type', this.value)"></div>
                <div class="input-group"><label>Icon Class</label><input type="text" value="${escapeHtml(item.icon)}" onchange="updateItem('${type}', ${index}, 'icon', this.value)"></div>
            </div>
            <div class="input-group"><label>URL</label><input type="text" value="${escapeHtml(item.url)}" onchange="updateItem('${type}', ${index}, 'url', this.value)"></div>
        `;
    } else if (type === 'bio') {
        html += `<textarea rows="3" onchange="updateItem('${type}', ${index}, null, this.value)">${item}</textarea>`;
    } else if (type === 'talks' || type === 'news') {
        html += `
            <div class="input-group"><label>Date</label><input type="text" value="${escapeHtml(item.date)}" onchange="updateItem('${type}', ${index}, 'date', this.value)"></div>
            <div class="input-group"><label>Content (HTML OK)</label><textarea rows="3" onchange="updateItem('${type}', ${index}, 'content', this.value)">${item.content}</textarea></div>
        `;
    }
    
    div.innerHTML = html;
    return div;
}

// Research Rendering Logic
function renderResearchList() {
    const container = document.getElementById('research-list');
    if(!container) return;
    container.innerHTML = '';
    if(!contentData.research) contentData.research = [];

    contentData.research.forEach((yearBlock, yIndex) => {
        const yearDiv = document.createElement('div');
        yearDiv.className = 'year-block section-grid';
        yearDiv.style.marginBottom = '2rem';
        yearDiv.style.border = '1px solid var(--border)';
        yearDiv.style.padding = '1.5rem';
        yearDiv.style.borderRadius = '8px';
        
        let html = `
            <div style="grid-column: span 2; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                <div class="input-group" style="margin-bottom:0; flex-grow: 1; margin-right: 1rem;">
                    <label>Year</label>
                    <input type="text" value="${escapeHtml(yearBlock.year)}" onchange="updateResearchYear(${yIndex}, this.value)" style="font-size: 1.25rem; font-weight: bold; background: transparent;">
                </div>
                <button type="button" class="remove-btn" onclick="removeResearchYear(${yIndex})" style="align-self: flex-end;"><i class="fas fa-trash"></i> Remove Year Group</button>
            </div>
            <div style="grid-column: span 2;">
                <div id="research-items-${yIndex}">
        `;
        
        if(!yearBlock.items) yearBlock.items = [];
        yearBlock.items.forEach((item, pIndex) => {
           html += `
             <div class="list-item" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-dark); padding: 1.5rem; border-radius: 6px; border: 1px solid var(--border); margin-bottom: 1rem;">
                <div class="input-group"><label>ID (Unique Identifier e.g. fu2026siam)</label><input type="text" value="${escapeHtml(item.id)}" onchange="updateResearchItem(${yIndex}, ${pIndex}, 'id', this.value)"></div>
                <div class="input-group"><label>Badge (e.g. SIAM, ICLR)</label><input type="text" value="${escapeHtml(item.badge)}" onchange="updateResearchItem(${yIndex}, ${pIndex}, 'badge', this.value)"></div>
                <div class="input-group" style="grid-column: span 2;"><label>Title</label><input type="text" value="${escapeHtml(item.title)}" onchange="updateResearchItem(${yIndex}, ${pIndex}, 'title', this.value)"></div>
                <div class="input-group" style="grid-column: span 2;"><label>Authors (HTML format)</label><textarea rows="2" onchange="updateResearchItem(${yIndex}, ${pIndex}, 'authors_html', this.value)">${item.authors_html}</textarea></div>
                <div class="input-group"><label>Periodical Info 1</label><input type="text" value="${escapeHtml(item.periodical_1)}" onchange="updateResearchItem(${yIndex}, ${pIndex}, 'periodical_1', this.value)"></div>
                <div class="input-group"><label>Periodical Info 2</label><input type="text" value="${escapeHtml(item.periodical_2)}" onchange="updateResearchItem(${yIndex}, ${pIndex}, 'periodical_2', this.value)"></div>
                <div class="input-group" style="grid-column: span 2;"><label>Abstract (HTML format)</label><textarea rows="3" onchange="updateResearchItem(${yIndex}, ${pIndex}, 'abstract', this.value)">${item.abstract}</textarea></div>
                <div style="grid-column: span 2; text-align: right;"><button type="button" class="remove-btn" onclick="removeResearchItem(${yIndex}, ${pIndex})"><i class="fas fa-trash"></i> Remove Publication</button></div>
             </div>
           `;
        });
        
        html += `
                </div>
                <button type="button" class="add-btn" style="width: auto; margin-top: 1rem;" onclick="addResearchItem(${yIndex})"><i class="fas fa-plus"></i> Add Publication</button>
            </div>
        `;
        yearDiv.innerHTML = html;
        container.appendChild(yearDiv);
    });
}


// Actions
window.addItem = (type) => {
    const newItem = {
        social: { type: 'link', url: '#', icon: 'fas fa-link' },
        bio: 'New bio paragraph...',
        talks: { date: 'New Date', content: 'Details...' },
        news: { date: 'New Date', content: 'Details...' }
    }[type];
    
    getListByType(type).push(newItem);
    renderList(type, getListByType(type));
};

window.removeItem = (type, index) => {
    getListByType(type).splice(index, 1);
    renderList(type, getListByType(type));
};

window.updateItem = (type, index, key, value) => {
    const list = getListByType(type);
    if (key) list[index][key] = value;
    else list[index] = value;
};

function getListByType(type) {
    if (type === 'social') return contentData.profile.social;
    if (type === 'bio') return contentData.bio;
    if (type === 'talks') return contentData.upcoming_talks;
    if (type === 'news') return contentData.recent_news;
}

// Research Actions
window.addResearchYear = () => {
    if(!contentData.research) contentData.research = [];
    contentData.research.unshift({ year: new Date().getFullYear().toString(), items: [] });
    renderResearchList();
};

window.removeResearchYear = (index) => {
    if(confirm('Are you sure you want to delete this entire year group?')) {
        contentData.research.splice(index, 1);
        renderResearchList();
    }
};

window.updateResearchYear = (index, value) => {
    contentData.research[index].year = value;
};

window.addResearchItem = (yearIndex) => {
    contentData.research[yearIndex].items.push({
        id: 'new_id_' + Date.now(),
        badge: 'NEW',
        title: 'New Publication Title',
        authors_html: 'Author List...',
        periodical_1: 'Journal/Conference Name, Year',
        periodical_2: 'Status/Notes',
        abstract: 'Abstract goes here...'
    });
    renderResearchList();
};

window.removeResearchItem = (yearIndex, pubIndex) => {
    contentData.research[yearIndex].items.splice(pubIndex, 1);
    renderResearchList();
};

window.updateResearchItem = (yearIndex, pubIndex, key, value) => {
    contentData.research[yearIndex].items[pubIndex][key] = value;
};


// SAVE & DEPLOY
document.getElementById('save-btn').addEventListener('click', async () => {
    const saveBtn = document.getElementById('save-btn');
    const statusMsg = document.getElementById('status-msg');
    const form = document.getElementById('admin-form');
    
    // Sync static fields from form back to contentData
    contentData.metadata.title = form['metadata.title'].value;
    contentData.metadata.author = form['metadata.author'].value;
    contentData.metadata.keywords = form['metadata.keywords'].value;
    contentData.profile.name = form['profile.name'].value;
    contentData.profile.subtitle = form['profile.subtitle'].value;
    contentData.profile.image = form['profile.image'].value;
    contentData.profile.email = form['profile.email'].value;
    contentData.profile.cv_path = form['profile.cv_path'].value;
    contentData.job_market.show = form['job_market.show'].value === 'true';
    contentData.job_market.text = form['job_market.text'].value;

    // Sync Quill Editors back to contentData
    ['teaching', 'service', 'awards', 'media', 'fun'].forEach(id => {
        contentData[`${id}_html`] = editors[id].root.innerHTML;
    });

    let cvBase64 = null;
    const cvInput = document.getElementById('cv-upload');
    if (cvInput.files.length > 0) {
        statusMsg.textContent = 'Reading PDF...';
        cvBase64 = await fileToBase64(cvInput.files[0]);
    }

    let imgBase64 = null;
    const imgInput = document.getElementById('image-upload');
    if (imgInput.files.length > 0) {
        statusMsg.textContent = 'Reading Image...';
        imgBase64 = await fileToBase64(imgInput.files[0]);
        contentData.profile.image = 'assets/img/profile.jpg'; // Point JSON to new image
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAVING...';
    statusMsg.textContent = 'Contacting secure API...';

    const payload = {
        password: 'admin321', 
        content: contentData,
        cvFile: cvBase64,
        imageFile: imgBase64,
        owner: repoConfig.owner,
        repo: repoConfig.repo
    };

    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Changes saved! Deploying to production...');
            statusMsg.textContent = 'Last successful save: ' + new Date().toLocaleTimeString();
        } else {
            showToast(result.message || 'Error occurred', true);
            statusMsg.textContent = 'Error: ' + result.message;
        }
    } catch (e) {
        showToast('Server connection failed', true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> SAVE & DEPLOY';
    }
});

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
