import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Auditing ${filePath} (${lines.length} lines)...`);

let insideComponent = false;
let returnsSeen = [];
let hookCalls = [];

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  const trimmed = line.trim();

  if (trimmed.startsWith('export default function DevToolsDashboard') || trimmed.includes('function DevToolsDashboard')) {
    insideComponent = true;
    console.log(`DevToolsDashboard start at line ${lineNum}`);
  }

  if (insideComponent) {
    if (trimmed.startsWith('return (') || trimmed.startsWith('return <') || (trimmed.startsWith('return') && trimmed.endsWith(';'))) {
      // Check if return is inside an inner function or sub-render helper
      if (line.includes('const render') || line.includes('() =>')) {
        // inner helper
      } else {
        returnsSeen.push({ lineNum, line: trimmed });
      }
    }

    if (/\b(useState|useEffect|useMemo|useCallback|useRef|useChordStore|useNavigationStore|useSettingsStore|useIsWebDesktop|useScrollHide|useBackHandler)\b/.test(line)) {
      hookCalls.push({ lineNum, line: trimmed });
    }
  }
});

console.log(`Found ${hookCalls.length} hook calls.`);
console.log(`Found ${returnsSeen.length} return statements.`);

console.log('\nHook calls summary:');
hookCalls.forEach(h => console.log(`  Line ${h.lineNum}: ${h.line.substring(0, 80)}`));

console.log('\nReturn statements summary:');
returnsSeen.forEach(r => console.log(`  Line ${r.lineNum}: ${r.line.substring(0, 80)}`));
