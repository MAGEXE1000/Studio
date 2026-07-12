import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components\\DevToolsDashboard.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences in DevToolsDashboard.tsx:');
lines.forEach((line, index) => {
  const l = line.toLowerCase();
  if (l.includes('usebackhandler') || l.includes('back') || l.includes('pop') || l.includes('push') || l.includes('subview')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
