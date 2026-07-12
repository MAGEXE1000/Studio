import fs from 'fs';
import path from 'path';

const files = [
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\LabPanel.tsx',
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\PracticePanel.tsx',
  'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\ui-shared\\src\\vocalex\\TakesPanel.tsx'
];

files.forEach(filepath => {
  console.log(`=== File: ${path.basename(filepath)} ===`);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('setVocalexBack')) {
      // Print context: 3 lines before and 3 lines after
      const start = Math.max(0, index - 3);
      const end = Math.min(lines.length - 1, index + 3);
      for (let i = start; i <= end; i++) {
        console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
      }
      console.log('---');
    }
  });
});
