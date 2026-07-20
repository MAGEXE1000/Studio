const fs = require('fs');
const path = require('path');

function searchFiles(dir, regexes) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', '.git', 'dist', 'build', 'scratch', 'artifacts'].includes(file)) continue;

    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath, regexes);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const { name, regex } of regexes) {
        if (regex.test(content)) {
          console.log(`MATCH ${name}: ${fullPath}`);
        }
      }
    }
  }
}

const regexes = [
  { name: 'Official Release Downloads', regex: /Official Release Downloads/i },
  { name: 'Start On', regex: /Start On/i },
  { name: 'View Mode', regex: /View Mode/i },
  { name: 'Help & Support', regex: /Help \& Support|Help and Support/i },
  { name: 'Terms of Service', regex: /Terms of Service/i },
  { name: 'Privacy Policy', regex: /Privacy Policy/i },
];

searchFiles(__dirname, regexes);
