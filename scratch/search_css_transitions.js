import fs from 'fs';
import path from 'path';

function searchCSS(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.gemini' && file !== 'dist' && file !== 'build') {
        results.push(...searchCSS(fullPath));
      }
    } else if (file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('transition') || content.includes('@keyframes') || content.includes('cubic-bezier') || content.includes('animation:')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const res = searchCSS('C:\\Users\\ayuda\\Documents\\Studio\\chordex-app');
console.log('CSS files with transitions/animations:');
res.forEach(r => console.log(' -', r));
