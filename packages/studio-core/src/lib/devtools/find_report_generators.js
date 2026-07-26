import fs from 'fs';
import path from 'path';

const rootDir = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages';

function searchIn(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(searchIn(full));
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('Report') || content.includes('buildCopy') || content.includes('generateDiagnostics')) {
        results.push(full);
      }
    }
  });
  return results;
}

console.log('Files with report generators:', searchIn(rootDir));
