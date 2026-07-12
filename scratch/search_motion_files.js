import fs from 'fs';
import path from 'path';

function searchDirectory(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.gemini' && file !== 'dist' && file !== 'build') {
        results.push(...searchDirectory(fullPath));
      }
    } else {
      const lower = file.toLowerCase();
      if (lower.includes('motion') || lower.includes('animation') || lower.includes('transition') || lower.includes('ease') || lower.includes('spring') || lower.includes('gesture')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const res = searchDirectory('C:\\Users\\ayuda\\Documents\\Studio\\chordex-app');
console.log('Motion/Animation related files:');
res.forEach(r => console.log(' -', r));
