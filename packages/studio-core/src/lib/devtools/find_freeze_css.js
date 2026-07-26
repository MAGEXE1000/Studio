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
    } else if (/\.(css|scss|less|ts|tsx)$/.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

let allFiles = [];
rootDirs.forEach((d) => {
  if (fs.existsSync(d)) allFiles = allFiles.concat(getAllFiles(d));
});

allFiles.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('livex-freeze-ui')) {
    console.log(`File: ${f}`);
  }
});
