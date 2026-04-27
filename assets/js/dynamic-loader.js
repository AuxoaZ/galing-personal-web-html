/**
 * Dynamic content loader for Zhe Fu's personal website
 * Fetches data from content.json and populates the DOM
 */

document.addEventListener('DOMContentLoaded', () => {
    fetch('/content.json') // ensure absolute path from root
        .then(response => {
            if(!response.ok) {
                 return fetch('../content.json').then(r => r.json()); // Fallback for subdirectories
            }
            return response.json();
        })
        .then(data => {
            renderContent(data);
        })
        .catch(error => {
            console.error('Error loading content.json:', error);
        });
});

function renderContent(data) {
    // 1. Metadata
    if (data.metadata) {
        // Only update title if it's the home page, or append to it
        if(window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
            const isSubPage = window.location.pathname.split('/').filter(p => p).length > 0 && !window.location.pathname.endsWith('index.html');
            if(!isSubPage) {
               document.title = data.metadata.title;
            }
        }
        
        const siteTitle = document.getElementById('site-title');
        if (siteTitle) siteTitle.textContent = data.metadata.title;
        const brandTitle = document.querySelector('.navbar-brand');
        if (brandTitle) brandTitle.textContent = data.metadata.title;
    }

    // Determine current page based on pathname or specific container IDs
    const path = window.location.pathname;

    if (path === '/' || path.endsWith('/index.html') && !path.includes('research') && !path.includes('teaching') && !path.includes('service') && !path.includes('awards') && !path.includes('media') && !path.includes('fun') && !path.includes('admin') && !path.includes('cv')) {
        renderHomePage(data);
    } 
    
    // Check specific containers for sub-pages
    const container = document.querySelector('article');
    
    if (path.includes('/research') && container) {
        renderResearchPage(data.research, container);
    } else if (path.includes('/teaching') && container) {
        container.innerHTML = data.teaching_html || '';
    } else if (path.includes('/service') && container) {
        container.innerHTML = data.service_html || '';
    } else if (path.includes('/awards') && container) {
        container.innerHTML = data.awards_html || '';
    } else if (path.includes('/media') && container) {
        container.innerHTML = data.media_html || '';
    } else if (path.includes('/fun') && container) {
        container.innerHTML = data.fun_html || '';
    }
    
    // 6. Footer
    const footer = document.querySelector('footer .container');
    if (footer && data.footer) {
        footer.textContent = data.footer;
    }
}

function renderHomePage(data) {
    // 2. Profile
    if (data.profile) {
        const nameEl = document.getElementById('profile-name');
        const subtitleEl = document.getElementById('profile-subtitle');
        const imageEl = document.getElementById('profile-image');
        const emailEl = document.getElementById('profile-email');

        if (nameEl) nameEl.innerHTML = data.profile.name;
        if (subtitleEl) subtitleEl.textContent = data.profile.subtitle;
        if (imageEl && data.profile.image) {
            imageEl.src = data.profile.image;
        }
        if (emailEl) {
            emailEl.innerHTML = `<p>${data.profile.email.replace('@', '[at]').replace('.', '[dot]')}</p>`;
        }

        // Social Icons
        const iconsContainer = document.getElementById('social-icons');
        if (iconsContainer && data.profile.social) {
            iconsContainer.innerHTML = data.profile.social.map(icon => `
                <a href="${icon.url}" title="${icon.type}" rel="external nofollow noopener" target="_blank">
                    <i class="${icon.icon}"></i>
                </a>
            `).join('');
        }
    }

    // 3. Bio
    const bioContainer = document.getElementById('bio-content');
    if (bioContainer && data.bio) {
        const badgeEl = document.getElementById('job-market-badge');
        let bioHtml = data.bio.map(p => `<p>${p}</p>`).join('');
        if (badgeEl) {
            badgeEl.textContent = data.job_market.text;
            badgeEl.style.display = data.job_market.show ? 'block' : 'none';
            bioHtml += badgeEl.outerHTML;
        }
        bioContainer.innerHTML = bioHtml;
    }

    // 4. Upcoming Talks
    const talksContainer = document.getElementById('upcoming-talks-container');
    if (talksContainer && data.upcoming_talks) {
        let html = `
            <h2 id="upcoming-talks--recent-research-highlights">Upcoming Talks & Recent Research Highlights</h2>
            <div class="table-responsive">
                <table class="table table-sm table-borderless">
                    ${data.upcoming_talks.map(talk => `
                        <tr>
                            <th scope="row" style="white-space: nowrap;">${talk.date}</th>
                            <td>${talk.content}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        talksContainer.innerHTML = html;
    }

    // 5. Recent News
    const newsContainer = document.getElementById('recent-news-container');
    if (newsContainer && data.recent_news) {
        let html = `
            <h2 id="recent-news">Recent News</h2>
            <div class="table-responsive">
                <table class="table table-sm table-borderless">
                    ${data.recent_news.map(news => `
                        <tr>
                            <th scope="row" style="width: 120px; vertical-align: top; padding-top: 4px;">${news.date}</th>
                            <td style="padding-top: 4px;">${news.content}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        newsContainer.innerHTML = html;
    }
}

function renderResearchPage(researchData, container) {
    if (!researchData) return;
    
    // We recreate the publications div exactly as the template expects
    let html = `
        <script src="../assets/js/bibsearch.js" type="module"></script>
        <p><input type="text" id="bibsearch" spellcheck="false" autocomplete="off" class="search bibsearch-form-input" placeholder="Type to filter"></p>
        <div class="publications">
    `;
    
    researchData.forEach(yearBlock => {
        html += `<h2 class="bibliography">${yearBlock.year}</h2>`;
        html += `<ol class="bibliography">`;
        
        yearBlock.items.forEach(item => {
            html += `
                <li>
                    <div class="row">
                        <div class="col col-sm-2 abbr">
                            ${item.badge ? `<abbr class="badge rounded w-100">${item.badge}</abbr>` : ''}
                        </div>
                        <div id="${item.id}" class="col-sm-8">
                            <div class="title">${item.title}</div>
                            <div class="author">${item.authors_html}</div>
                            ${item.periodical_1 ? `<div class="periodical">${item.periodical_1}</div>` : ''}
                            ${item.periodical_2 ? `<div class="periodical">${item.periodical_2}</div>` : ''}
                            ${item.abstract ? `
                            <div class="links">
                                <a class="abstract btn btn-sm z-depth-0" role="button">Abs</a>
                            </div>
                            <div class="abstract hidden">
                                <p>${item.abstract}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </li>
            `;
        });
        
        html += `</ol>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Re-attach abstract click listeners since we overwrote the DOM
    setTimeout(() => {
        const absButtons = container.querySelectorAll('.abstract.btn');
        absButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const abstractDiv = e.target.closest('.col-sm-8').querySelector('.abstract.hidden, .abstract.open');
                if(abstractDiv) {
                    abstractDiv.classList.toggle('hidden');
                    abstractDiv.classList.toggle('open');
                }
            });
        });
    }, 100);
}

