import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components\\StudioHub.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Touch event listeners in StudioHub.tsx:');
lines.forEach((line, index) => {
  if (line.includes('onTouch') || line.includes('onPointer')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
