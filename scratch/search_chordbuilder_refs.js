import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build' && file !== 'android') {
        walk(filepath, callback);
      }
    } else {
      if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
        callback(filepath);
      }
    }
  }
}

const rootDir = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app';
console.log('Searching for CustomChordBuilder references...');

const dirsToSearch = [
  path.join(rootDir, 'packages', 'ui-shared', 'src'),
  path.join(rootDir, 'apps', 'studio-android', 'src')
];

dirsToSearch.forEach(searchPath => {
  if (fs.existsSync(searchPath)) {
    walk(searchPath, (filepath) => {
      const content = fs.readFileSync(filepath, 'utf8');
      if (content.includes('CustomChordBuilder') && !filepath.includes('CustomChordBuilder.tsx')) {
        console.log(`CustomChordBuilder reference in: ${filepath}`);
      }
    });
  }
});
