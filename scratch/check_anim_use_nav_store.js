import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components\\AppAnimationSystem.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('useNavigationStore references in AppAnimationSystem.tsx:');
lines.forEach((line, index) => {
  if (line.includes('useNavigationStore')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
