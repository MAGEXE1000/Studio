import fs from 'fs';
import path from 'path';

const files = [
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\panels\\ChordPanel.tsx',
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\panels\\LibraryPanel.tsx',
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\panels\\SongsPanel.tsx'
];

files.forEach(filepath => {
  console.log(`=== File: ${path.basename(filepath)} ===`);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('useBackHandler')) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  });
});
