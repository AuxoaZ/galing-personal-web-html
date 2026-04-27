const fs = require('fs');
const files = [
  'research/index.html',
  'teaching/index.html',
  'service/index.html',
  'awards/index.html',
  'media/index.html',
  'fun/index.html'
];
files.forEach(f => {
  let h = fs.readFileSync(f, 'utf8');
  if (!h.includes('<script src="../assets/js/dynamic-loader.js"></script>')) {
     h = h.replace(/<\/body>\s*<\/html>/, '  <script src="../assets/js/dynamic-loader.js"></script>\n</body>\n</html>');
     fs.writeFileSync(f, h);
     console.log('Injected into ' + f);
  } else {
     console.log('Already in ' + f);
  }
});
