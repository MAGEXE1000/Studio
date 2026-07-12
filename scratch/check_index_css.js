import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\apps\\studio-android\\src\\index.css';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('CSS Transitions/Animations in apps/studio-android/src/index.css:');
lines.forEach((line, index) => {
  const trim = line.trim();
  if (trim.startsWith('@keyframes') || trim.includes('transition:') || trim.includes('animation:') || trim.includes('cubic-bezier') || trim.includes('--easing') || trim.includes('--duration')) {
    console.log(`  Line ${index + 1}: ${trim}`);
  }
});
