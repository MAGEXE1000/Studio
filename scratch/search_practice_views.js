import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components\\SongPracticeView.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences in SongPracticeView.tsx:');
lines.forEach((line, index) => {
  if (line.includes('CustomChordBuilder') || line.includes('Transpose') || line.includes('Finder') || line.includes('builder') || line.includes('chordBuilder')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
