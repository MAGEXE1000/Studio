import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\apps\\studio-android\\src\\App.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('export default function App')) {
    console.log(`export default function App matches line ${index + 1}: ${line.trim()}`);
  }
});
