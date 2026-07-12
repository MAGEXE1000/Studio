import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\PracticePanel.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('Modals/sheets/dialogs in PracticePanel.tsx:');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('modal') || line.toLowerCase().includes('sheet') || line.toLowerCase().includes('dialog')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
