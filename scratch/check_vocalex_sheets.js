import fs from 'fs';
import path from 'path';

const files = [
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\LabPanel.tsx',
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\TakesPanel.tsx'
];

files.forEach(filepath => {
  console.log(`=== File: ${path.basename(filepath)} ===`);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('HarmonizerSheet') || line.includes('showHarmonizer') || line.includes('harmonizerOpen')) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  });
});
