import fs from 'fs';
const content = fs.readFileSync('C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx', 'utf8');
content.split('\n').forEach((l, idx) => {
  if (l.includes('renderStorageTab') || l.includes('renderStateTab') || l.includes('renderProvidersTab')) {
    console.log(`Line ${idx + 1}: ${l}`);
  }
});
