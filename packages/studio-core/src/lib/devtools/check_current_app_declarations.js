import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];
  lines.forEach((line, idx) => {
    if (line.includes('currentApp')) {
      matches.push({ lineNum: idx + 1, text: line.trim() });
    }
  });

  console.log(`\n=== Checking: ${filePath} (${matches.length} matches) ===`);
  matches.forEach(m => console.log(`  L${m.lineNum}: ${m.text}`));
}

const targetFiles = [
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx',
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\hub\\StudioHub.tsx',
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\navigation\\BottomNavigationController.tsx',
  'C:\\Users\\ayuda\\Documents\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\navigation\\SharedNavigationBar.tsx',
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\panels\\SettingsPanel.tsx',
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\features\\hub\\StudioHubSettingsPanel.tsx',
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-android\\src\\components\\StudioHubSettingsPanel.tsx'
];

targetFiles.forEach(f => {
  if (fs.existsSync(f)) checkFile(f);
});
