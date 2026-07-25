import fs from 'fs';
import path from 'path';

function scan(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) scan(p);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('getNavigationEntries') || content.includes('clearNavigationEntries') || content.includes('NavigationEntry')) {
        console.log(`Found reference in: ${p}`);
      }
    }
  }
}

scan('C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages');
scan('C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\apps');
console.log('Scan complete.');
