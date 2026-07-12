import fs from 'fs';
import path from 'path';

function searchDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.mjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('3.7.5') || content.includes('v3.7.')) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('3.7.5') || line.includes('v3.7.')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDirectory('packages');
searchDirectory('apps');
