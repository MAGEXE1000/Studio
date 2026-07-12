import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\panels\\LibraryPanel.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences of practice/Practice/SongPracticeView in LibraryPanel.tsx:');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('practice')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
