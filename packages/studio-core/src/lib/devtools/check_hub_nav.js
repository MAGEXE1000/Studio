import fs from 'fs';
const content = fs.readFileSync('C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\hub\\StudioHub.tsx', 'utf8');
content.split('\n').forEach((l, idx) => {
  if (l.includes('NavigationEntry') || l.includes('recordNavigation')) {
    console.log(`Line ${idx + 1}: ${l}`);
  }
});
