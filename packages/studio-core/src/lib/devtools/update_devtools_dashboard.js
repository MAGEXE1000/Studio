import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace old CopyDropdown component definition with simple re-export/compatibility layer
const oldDropdownStart = content.indexOf('export interface CopyDropdownProps');
const oldDropdownEnd = content.indexOf('export interface DevToolsDashboardProps');

if (oldDropdownStart !== -1 && oldDropdownEnd !== -1) {
  const replacement = `// Unified Copy System imported from ./CopyButton and ./CopyDropdown\n\n`;
  content = content.substring(0, oldDropdownStart) + replacement + content.substring(oldDropdownEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully replaced old CopyDropdown component in DevToolsDashboard.tsx');
