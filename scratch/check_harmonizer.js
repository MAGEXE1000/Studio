import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\HarmonizerSheet.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('HarmonizerSheet.tsx back/close/render details:');
lines.forEach((line, index) => {
  if (line.includes('useBackHandler') || line.includes('return (') || line.includes('animation:') || line.includes('transition:')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
