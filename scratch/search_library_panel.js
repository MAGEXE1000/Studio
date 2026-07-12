import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(filepath, callback);
      }
    } else {
      callback(filepath);
    }
  }
}

const rootDir = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app';
console.log('Searching for LibraryPanel in workspace...');

walk(path.join(rootDir, 'packages'), (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('LibraryPanel')) {
    console.log(`packages: ${filepath}`);
  }
});

walk(path.join(rootDir, 'apps'), (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('LibraryPanel')) {
    console.log(`apps: ${filepath}`);
  }
});
