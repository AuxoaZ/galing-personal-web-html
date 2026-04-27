let contentData = {};
const repoConfig = {
    owner: 'AuxoaZ', // GitHub Username
    repo: 'galing-personal-web-html'   // Nama Repository
};

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    initAuth();
});

// Tab Logic
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
            document.getElementById(`tab-${tabId}`).style.display = 'block';
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
        const response = await fetch('../content.json');
        contentData = await response.json();
        populateForm(contentData);
    } catch (e) {
        showToast('Error loading content.json', true);
    }
}

function populateForm(data) {
    const form = document.getElementById('admin-form');
    
    // Fill basic fields
    Object.keys(data.metadata).forEach(key => {
        if (form[`metadata.${key}`]) form[`metadata.${key}`].value = data.metadata[key];
    });
    
    Object.keys(data.profile).forEach(key => {
        if (typeof data.profile[key] === 'string') {
            if (form[`profile.${key}`]) form[`profile.${key}`].value = data.profile[key];
        }
    });
    
    form['job_market.show'].value = String(data.job_market.show);
    form['job_market.text'].value = data.job_market.text;
    
    // Fill dynamic lists
    renderList('social', data.profile.social);
    renderList('bio', data.bio);
    renderList('talks', data.upcoming_talks);
    renderList('news', data.recent_news);
}

function renderList(type, items) {
    const container = document.getElementById(`${type}-list`);
    container.innerHTML = '';
    items.forEach((item, index) => {
        container.appendChild(createItemEl(type, item, index));
    });
}

function createItemEl(type, item, index) {
    const div = document.createElement('div');
    div.className = 'list-item';
    
    let html = `<button type="button" class="remove-btn" onclick="removeItem('${type}', ${index})">Remove</button>`;
    
    if (type === 'social') {
        html += `
            <div class="section-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="input-group"><label>Type</label><input type="text" value="${item.type}" onchange="updateItem('${type}', ${index}, 'type', this.value)"></div>
                <div class="input-group"><label>Icon Class</label><input type="text" value="${item.icon}" onchange="updateItem('${type}', ${index}, 'icon', this.value)"></div>
            </div>
            <div class="input-group"><label>URL</label><input type="text" value="${item.url}" onchange="updateItem('${type}', ${index}, 'url', this.value)"></div>
        `;
    } else if (type === 'bio') {
        html += `<textarea rows="3" onchange="updateItem('${type}', ${index}, null, this.value)">${item}</textarea>`;
    } else if (type === 'talks' || type === 'news') {
        html += `
            <div class="input-group"><label>Date</label><input type="text" value="${item.date}" onchange="updateItem('${type}', ${index}, 'date', this.value)"></div>
            <div class="input-group"><label>Content (HTML OK)</label><textarea rows="3" onchange="updateItem('${type}', ${index}, 'content', this.value)">${item.content}</textarea></div>
        `;
    }
    
    div.innerHTML = html;
    return div;
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
    contentData.job_market.show = form['job_market.show'].value === 'true';
    contentData.job_market.text = form['job_market.text'].value;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAVING...';
    statusMsg.textContent = 'Contacting secure API...';

    const payload = {
        password: 'admin321', // The user requested this
        content: contentData,
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
