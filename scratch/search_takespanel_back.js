import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\TakesPanel.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Context in TakesPanel.tsx:');
lines.forEach((line, index) => {
  if (index >= 260 && index <= 290) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
  if (index >= 645 && index <= 675) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
