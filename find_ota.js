const fs = require('fs');
const path = require('path');
function walk(dir, terms) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (
        !filePath.includes('node_modules') &&
        !filePath.includes('.git') &&
        !filePath.includes('dist') &&
        !filePath.includes('build')
      ) {
        results.push(...walk(filePath, terms));
      }
    } else {
      const ext = path.extname(filePath);
      if (['.ts', '.tsx', '.json', '.js', '.mjs', '.ps1'].includes(ext)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          terms.forEach((term) => {
            if (line.toLowerCase().includes(term.toLowerCase())) {
              results.push(`${filePath}:${index + 1}: ${line.trim()}`);
            }
          });
        });
      }
    }
  });
  return results;
}
const results = walk('.', ['capgo', 'ota', 'bundle', 'live update', 'over the air']);
fs.writeFileSync('search_results.txt', results.join('\n'));
console.log('Found ' + results.length + ' matches');
