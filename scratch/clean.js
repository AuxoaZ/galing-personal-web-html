const fs = require('fs');

const filesToClean = [
  'research/index.html',
  'teaching/index.html',
  'service/index.html',
  'awards/index.html',
  'media/index.html',
  'fun/index.html'
];

filesToClean.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  
  html = html.replace(/<article>[\s\S]*?<\/article>/, '<article>\n<!-- Content will be dynamically loaded via assets/js/dynamic-loader.js -->\n</article>');
  
  if (!html.includes('dynamic-loader.js')) {
    html = html.replace('</body>', '  <!-- Inject Dynamic Content Loader -->\n  <script src="../assets/js/dynamic-loader.js"></script>\n</body>');
  }
  
  fs.writeFileSync(file, html);
  console.log('Cleaned ' + file);
});
