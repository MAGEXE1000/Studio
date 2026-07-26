import fs from 'fs';
import path from 'path';

const rootDir = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages';

function searchDir(dir, query) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(searchDir(full, query));
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(query)) {
        results.push(full);
      }
    }
  });
  return results;
}

console.log('Files with useDeveloperInspectorStore:');
searchDir(rootDir, 'useDeveloperInspectorStore').forEach(f => console.log(' - ' + f));
