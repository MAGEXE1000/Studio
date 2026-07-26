import fs from 'fs';
import path from 'path';

const rootDirs = [
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages',
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\apps',
];

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        results = results.concat(getAllFiles(fullPath));
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

let allFiles = [];
rootDirs.forEach((d) => {
  if (fs.existsSync(d)) allFiles = allFiles.concat(getAllFiles(d));
});

console.log('=== SEARCHING FOR TOGGLE & FREEZE UI IMPLEMENTATIONS ===');

allFiles.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('freezeUI') || content.includes('Freeze UI') || content.includes('freeze_ui') || content.includes('developerMode')) {
    console.log(`\nFile: ${f}`);
    content.split('\n').forEach((line, idx) => {
      if (line.includes('freeze') || line.includes('Freeze') || line.includes('developerMode') || line.includes('toggle')) {
        if (line.length < 120) console.log(`  L${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
