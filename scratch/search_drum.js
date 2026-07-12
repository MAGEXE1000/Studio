import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\panels\\DrumEditor.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('useBackHandler')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
