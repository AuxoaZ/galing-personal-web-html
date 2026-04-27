const fs = require('fs');

function extractResearch() {
    const html = fs.readFileSync('research/index.html', 'utf8');
    const years = [];
    
    // Split by <h2 class="bibliography">
    const parts = html.split('<h2 class="bibliography">');
    // skip the first part before the first h2
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const yearMatch = part.match(/^(.*?)<\/h2>/);
        if (!yearMatch) continue;
        const year = yearMatch[1].trim();
        
        const listMatch = part.match(/<ol class="bibliography">([\s\S]*?)<\/ol>/);
        if (!listMatch) continue;
        
        const listHtml = listMatch[1];
        const items = listHtml.split('<li>');
        const entries = [];
        
        for (let j = 1; j < items.length; j++) {
            const itemHtml = items[j];
            
            const badgeMatch = itemHtml.match(/<abbr class="badge.*?>(.*?)<\/abbr>/);
            const idMatch = itemHtml.match(/<div id="(.*?)"/);
            const titleMatch = itemHtml.match(/<div class="title">(.*?)<\/div>/);
            const authorMatch = itemHtml.match(/<div class="author">([\s\S]*?)<\/div>/);
            
            // periodicals: there might be multiple
            const periodicals = [];
            const r = /<div class="periodical">([\s\S]*?)<\/div>/g;
            let pMatch;
            while ((pMatch = r.exec(itemHtml)) !== null) {
                periodicals.push(pMatch[1].trim().replace(/\s+/g, ' '));
            }
            
            const abstractMatch = itemHtml.match(/<div class="abstract hidden">([\s\S]*?)<\/div>/);
            
            if (idMatch && titleMatch) {
                entries.push({
                    id: idMatch[1].trim(),
                    badge: badgeMatch ? badgeMatch[1].trim() : '',
                    title: titleMatch[1].trim(),
                    authors_html: authorMatch ? authorMatch[1].trim().replace(/\s+/g, ' ') : '',
                    periodical_1: periodicals[0] || '',
                    periodical_2: periodicals[1] || '',
                    abstract: abstractMatch ? abstractMatch[1].replace(/<p>/g, '').replace(/<\/p>/g, '').trim().replace(/\s+/g, ' ') : ''
                });
            }
        }
        
        years.push({
            year: year,
            items: entries
        });
    }
    return years;
}

const research = extractResearch();
const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
content.research = research;
fs.writeFileSync('content.json', JSON.stringify(content, null, 2));
console.log('Extracted ' + research.length + ' research years with total ' + research.reduce((acc, curr) => acc + curr.items.length, 0) + ' items.');

// Now extract Teaching HTML body to put in content.json
function extractBodyHtml(filepath, selector) {
    const html = fs.readFileSync(filepath, 'utf8');
    const startObj = '<article>';
    const endObj = '</article>';
    const startIdx = html.indexOf(startObj);
    const endIdx = html.indexOf(endObj);
    if (startIdx !== -1 && endIdx !== -1) {
        return html.substring(startIdx + startObj.length, endIdx).trim();
    }
    return "";
}

content.teaching_html = extractBodyHtml('teaching/index.html');
content.service_html = extractBodyHtml('service/index.html');
content.awards_html = extractBodyHtml('awards/index.html');
content.media_html = extractBodyHtml('media/index.html');
content.fun_html = extractBodyHtml('fun/index.html');

fs.writeFileSync('content.json', JSON.stringify(content, null, 2));
console.log('Extracted HTML bodies for teaching, service, awards, media, fun.');
