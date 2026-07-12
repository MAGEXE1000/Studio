import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(filepath, callback);
      }
    } else {
      callback(filepath);
    }
  }
}

const searchPath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\apps\\studio-android\\public\\stage-core';
console.log(`Searching for stageGoBack in ${searchPath}...`);

walk(searchPath, (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('stageGoBack')) {
    console.log(`Found in: ${filepath}`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('stageGoBack')) {
        console.log(`  Line ${index + 1}: ${line.trim()}`);
      }
    });
  }
});
