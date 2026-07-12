import fs from 'fs';
import path from 'path';

function findFile(dir, name) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        const found = findFile(fullPath, name);
        if (found) return found;
      }
    } else if (file === name) {
      return fullPath;
    }
  }
  return null;
}

const res = findFile('C:\\Users\\ayuda\\Documents\\Studio\\chordex-app', 'CustomChordBuilder.tsx');
console.log('Result:', res);
