import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('export interface CopyDropdownProps');
const endIdx = content.indexOf('export interface DevToolsDashboardProps');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
  console.log('✓ Successfully removed old CopyDropdown component definition from line 486 to 734');
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log('❌ Could not find CopyDropdown block');
}
