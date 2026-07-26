import fs from 'fs';
import path from 'path';

const coreDir = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\studio-core';

function searchIn(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(searchIn(full));
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('useDeveloperInspectorStore')) {
        results.push(full);
      }
    }
  });
  return results;
}

console.log('Results:', searchIn(coreDir));
