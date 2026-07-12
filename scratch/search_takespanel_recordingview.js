import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\TakesPanel.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('RecordingView instantiation in TakesPanel.tsx:');
lines.forEach((line, index) => {
  if (line.includes('RecordingView') || line.includes('onCancel') || line.includes('setShowRecord') || line.includes('showRecord')) {
    console.log(`  Line ${index + 1}: ${line.trim()}`);
  }
});
