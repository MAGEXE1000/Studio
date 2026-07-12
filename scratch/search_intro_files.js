import fs from 'fs';
import path from 'path';

const dir = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\components';
const files = fs.readdirSync(dir);
console.log('Intro/Splash/Loading files:');
files.forEach(file => {
  const lower = file.toLowerCase();
  if (lower.includes('intro') || lower.includes('splash') || lower.includes('loading') || lower.includes('spinner') || lower.includes('skeleton')) {
    console.log(` - ${file}`);
  }
});
