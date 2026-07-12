import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components\\SongPracticeView.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences of keywords in SongPracticeView.tsx:');
lines.forEach((line, index) => {
  const l = line.toLowerCase();
  if (l.includes('transpose') || l.includes('finder') || l.includes('builder')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
