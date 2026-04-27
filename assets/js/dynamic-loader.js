/**
 * Dynamic content loader for Zhe Fu's personal website
 * Fetches data from content.json and populates the DOM
 */

document.addEventListener('DOMContentLoaded', () => {
    fetch('content.json')
        .then(response => response.json())
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
        document.title = data.metadata.title || document.title;
        const siteTitle = document.getElementById('site-title');
        if (siteTitle) siteTitle.textContent = data.metadata.title;
    }

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
        // Keep everything after the last paragraph (like Job Market and tables)
        const badgeEl = document.getElementById('job-market-badge');
        const talksContainer = document.getElementById('upcoming-talks-container');
        const newsContainer = document.getElementById('recent-news-container');
        
        // We only replace the paragraph parts
        let bioHtml = data.bio.map(p => `<p>${p}</p>`).join('');
        
        // Re-append the badge if it exists
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

    // 6. Footer
    const footer = document.querySelector('footer .container');
    if (footer && data.footer) {
        footer.textContent = data.footer;
    }
}
