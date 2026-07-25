import fs from 'fs';
import path from 'path';

function auditHooksInFile(fullPath) {
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  let currentFn = null;
  let returnsBeforeHooks = [];
  let fnReturns = false;
  let fnHooks = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Check function boundary
    if (/^\s*(export\s+)?(default\s+)?function\s+([A-Za-z0-9_]+)/.test(line) || /^\s*(const|let)\s+([A-Za-z0-9_]+)\s*:\s*React\.FC/.test(line) || /^\s*(const|let)\s+([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>/.test(line)) {
      if (currentFn && fnReturns && fnHooks.length > 0) {
        // Check if any return happened before a hook
        const lastReturnLine = Math.max(...fnReturns);
        const hooksAfterReturn = fnHooks.filter(h => h.lineNum > lastReturnLine);
        if (hooksAfterReturn.length > 0) {
          returnsBeforeHooks.push({
            fn: currentFn,
            lastReturnLine,
            hooksAfterReturn
          });
        }
      }
      currentFn = line.substring(0, 60);
      fnReturns = [];
      fnHooks = [];
    }

    if (currentFn) {
      if (trimmed.startsWith('if (') && trimmed.includes('return')) {
        fnReturns.push(lineNum);
      } else if (trimmed === 'return;' || trimmed.startsWith('return ') || trimmed.startsWith('return(')) {
        fnReturns.push(lineNum);
      }

      if (/\b(useState|useEffect|useMemo|useCallback|useRef)\b/.test(line)) {
        fnHooks.push({ lineNum, line: trimmed });
      }
    }
  });

  return returnsBeforeHooks;
}

const dir = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools';

function scan(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) scan(p);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      const issues = auditHooksInFile(p);
      if (issues.length > 0) {
        console.log(`\n🚨 POTENTIAL HOOK VIOLATION IN ${p}:`);
        issues.forEach(iss => {
          console.log(`  Function "${iss.fn}" has returns at line ${iss.lastReturnLine} BEFORE hooks:`);
          iss.hooksAfterReturn.forEach(h => console.log(`    Line ${h.lineNum}: ${h.line}`));
        });
      }
    }
  }
}

scan(dir);
console.log('\nHook scan complete.');
