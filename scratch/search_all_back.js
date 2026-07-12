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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('useBackHandler') || content.includes('pushBackHandler')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const res = searchDirectory('C:\\Users\\ayuda\\Documents\\Studio\\chordex-app');
console.log('Files using useBackHandler/pushBackHandler:');
res.forEach(r => console.log(' -', r));
