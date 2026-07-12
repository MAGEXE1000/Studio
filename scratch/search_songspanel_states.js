import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\panels\\SongsPanel.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences of showCustomBuilder in SongsPanel.tsx:');
lines.forEach((line, index) => {
  if (line.includes('showCustomBuilder')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
