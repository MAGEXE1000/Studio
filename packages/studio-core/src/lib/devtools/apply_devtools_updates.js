import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports for CopyButton and CopyDropdown if missing
if (!content.includes("import CopyButton")) {
  content = `import CopyButton from './CopyButton';\nimport CopyDropdown from './CopyDropdown';\n` + content;
}

// 2. Replace 'Logs & Warnings' title in sub-views with 'Logs'
content = content.replace(/Logs & Warnings/g, 'Logs');

// 3. Remove 'Navigation Stack' from TabId or logFilterMode
content = content.replace(/\| 'nav'/g, '');

console.log('Applied initial text updates to DevToolsDashboard.tsx');
fs.writeFileSync(filePath, content, 'utf8');
