import fs from 'fs';
import path from 'path';

function searchDirectory(dir, term, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git' && entry.name !== 'build') {
        searchDirectory(fullPath, term, results);
      }
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(term)) {
            results.push({ file: fullPath, lineNum: idx + 1, line: line.trim() });
          }
        });
      } catch (err) {}
    }
  }
  return results;
}

const rootDir = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages';
const matches = searchDirectory(rootDir, 'developerMode');

console.log(`Found ${matches.length} references to 'developerMode':`);
matches.forEach(m => {
  console.log(`${m.file}:${m.lineNum} -> ${m.line}`);
});
