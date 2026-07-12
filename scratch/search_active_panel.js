import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\apps\\studio-android\\src\\App.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences of activePanel in App.tsx:');
lines.forEach((line, index) => {
  if (line.includes('activePanel')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
