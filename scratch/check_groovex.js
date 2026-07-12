import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\groovex\\GroovexApp.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences in GroovexApp.tsx:');
lines.forEach((line, index) => {
  if (line.includes('useBackHandler') || line.includes('useState') || line.includes('Page') || line.includes('Route')) {
    if (line.trim().length < 150) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  }
});
