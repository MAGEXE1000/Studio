import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components\\StageCorePanel.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences of toolbar back button in StageCorePanel.tsx:');
lines.forEach((line, index) => {
  if (index >= 1930 && index <= 1990) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
