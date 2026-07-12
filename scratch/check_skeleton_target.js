import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components\\StudioSkeleton.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('data-intro-target in StudioSkeleton.tsx:');
lines.forEach((line, index) => {
  if (line.includes('data-intro-target')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
