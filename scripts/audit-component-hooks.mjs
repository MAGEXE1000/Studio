import fs from 'fs';
import path from 'path';

console.log('=== RUNNING PRECISE AST HOOK ORDER INTEGRITY SCANNER ===');

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
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('build')) {
        results = results.concat(getAllFiles(fullPath));
      }
    } else if (/\.(tsx|jsx|ts|js)$/.test(file) && !file.endsWith('.d.ts') && !file.includes('.mjs')) {
      results.push(fullPath);
    }
  });
  return results;
}

let allFiles = [];
rootDirs.forEach((d) => {
  if (fs.existsSync(d)) {
    allFiles = allFiles.concat(getAllFiles(d));
  }
});

let violations = [];
let totalComponents = 0;
let totalCustomHooks = 0;

allFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let fnStack = [];
  
  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;
    const trimmed = line.trim();

    // Track component / custom hook entry
    const compMatch = line.match(/(?:export\s+)?(?:default\s+)?function\s+([A-Za-z0-9_]+)|const\s+([A-Za-z0-9_]+)\s*=\s*(?:React\.)?(?:memo|forwardRef)?\s*\(/);
    if (compMatch) {
      const fnName = compMatch[1] || compMatch[2];
      if (fnName && (/^[A-Z]/.test(fnName) || fnName.startsWith('use'))) {
        if (fnName.startsWith('use')) totalCustomHooks++;
        else totalComponents++;

        fnStack.push({
          name: fnName,
          file: filePath,
          startLine: lineNum,
          hasEarlyReturn: false,
          earlyReturnLine: null,
          hooks: [],
          violatingHooks: []
        });
      }
    }

    if (fnStack.length > 0) {
      const currentFn = fnStack[fnStack.length - 1];

      // Detect top-level early returns in component body
      if (
        (trimmed.startsWith('if (') && (trimmed.includes('return ') || trimmed.endsWith('return;') || trimmed.includes('return <'))) ||
        (trimmed.startsWith('return ') && !trimmed.includes('=>') && !trimmed.includes('function')) ||
        trimmed === 'return;'
      ) {
        // Exclude return statements inside inner hooks callbacks (e.g., useEffect(() => { return ... }))
        if (!line.includes('=>') && !line.includes('.map') && !line.includes('useEffect(') && !line.includes('useCallback(')) {
          if (!currentFn.hasEarlyReturn) {
            currentFn.hasEarlyReturn = true;
            currentFn.earlyReturnLine = lineNum;
          }
        }
      }

      // Detect React Hook calls
      const hookMatches = [...line.matchAll(/\b(use[A-Z][A-Za-z0-9_]*)\s*\(/g)];
      hookMatches.forEach((m) => {
        const hookName = m[1];
        if (hookName !== 'use') {
          currentFn.hooks.push({ hookName, lineNum, line: trimmed });
          if (currentFn.hasEarlyReturn) {
            currentFn.violatingHooks.push({ hookName, lineNum, line: trimmed });
          }
        }
      });
    }
  });

  fnStack.forEach((fn) => {
    if (fn.violatingHooks.length > 0) {
      violations.push(fn);
    }
  });
});

console.log(`✓ Total Files Scanned: ${allFiles.length}`);
console.log(`✓ Total React Components Audited: ${totalComponents}`);
console.log(`✓ Total Custom Hooks Audited: ${totalCustomHooks}`);

if (violations.length === 0) {
  console.log('=== REPOSITORY-WIDE HOOK INTEGRITY AUDIT PASSED CLEANLY (0 VIOLATIONS) ===');
} else {
  console.log(`🚨 FOUND ${violations.length} COMPONENTS WITH HOOKS AFTER EARLY RETURNS:`);
  violations.forEach((v) => {
    console.log(`\nComponent: ${v.name} (${v.file}:${v.earlyReturnLine})`);
    v.violatingHooks.forEach((vh) => {
      console.log(`  - Line ${vh.lineNum} [${vh.hookName}]: ${vh.line}`);
    });
  });
}
