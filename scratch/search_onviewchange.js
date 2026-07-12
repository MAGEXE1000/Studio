import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\apps\\studio-android\\public\\stage-core\\app.js';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences of __onViewChange:');
lines.forEach((line, index) => {
  if (line.includes('__onViewChange')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
