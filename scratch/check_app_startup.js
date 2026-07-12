import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\apps\\studio-android\\src\\App.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Intro/Splash/Loading occurrences in Android App.tsx:');
lines.forEach((line, index) => {
  const lower = line.toLowerCase();
  if (lower.includes('intro') || lower.includes('splash') || lower.includes('loading') || lower.includes('welcome') || lower.includes('init')) {
    if (line.trim().length < 150) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  }
});
