import fs from 'fs';
import path from 'path';

const rootDir = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\panels';
const files = ['ChordPanel.tsx', 'SongsPanel.tsx'];

files.forEach(file => {
  const filepath = path.join(rootDir, file);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  console.log(`\nOccurrences in ${file}:`);
  lines.forEach((line, index) => {
    if (line.includes('CustomChordBuilder')) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  });
});
