import fs from 'fs';
import path from 'path';

console.log('=== STARTING REPOSITORY-WIDE COMPREHENSIVE REACT HOOK AUDITOR ===');

const HOOK_REGEX = /\b(use[A-Z][A-Za-z0-9_]*)\s*\(/g;
const RETURN_REGEX = /^\s*return(\s|;|\()/;
const COND_HOOK_REGEX = /\bif\s*\(.*?\)\s*\{?[^}]*\b(use[A-Z][A-Za-z0-9_]*)\s*\(/g;

const rootDirs = [
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages',
  'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\apps',
];

let totalFilesScanned = 0;
let totalComponentsAudited = 0;
let totalCustomHooksAudited = 0;
let violationsFound = [];

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

totalFilesScanned = allFiles.length;

allFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Track component functions & hook positions
  let currentFn = null;
  let returnsBeforeHook = [];
  let fnReturns = [];
  let fnHooks = [];
  let fnDepth = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Check function declaration
    if (
      /^\s*(export\s+)?(default\s+)?function\s+([A-Za-z0-9_]+)/.test(line) ||
      /^\s*(const|let)\s+([A-Za-z0-9_]+)\s*:\s*React\.FC/.test(line) ||
      /^\s*(const|let)\s+([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>/.test(line) ||
      /^\s*(export\s+)?const\s+(use[A-Z][A-Za-z0-9_]*)\s*=/.test(line)
    ) {
      if (line.includes('use') && line.includes('const use')) {
        totalCustomHooksAudited++;
      } else if (/[A-Z]/.test(line)) {
        totalComponentsAudited++;
      }

      if (currentFn && fnReturns.length > 0 && fnHooks.length > 0) {
        const firstReturn = Math.min(...fnReturns);
        const hooksAfterReturn = fnHooks.filter((h) => h.lineNum > firstReturn);
        if (hooksAfterReturn.length > 0) {
          violationsFound.push({
            file,
            fn: currentFn,
            firstReturnLine: firstReturn,
            hooksAfterReturn,
          });
        }
      }

      currentFn = line.substring(0, 70);
      fnReturns = [];
      fnHooks = [];
    }

    if (currentFn) {
      // Check early return inside component root body (ignore inner arrow functions or render helper callbacks)
      if (
        (trimmed.startsWith('if (') && (trimmed.includes('return ') || trimmed.includes('return;'))) ||
        (trimmed.startsWith('return ') && !trimmed.includes('() =>') && !trimmed.includes('function')) ||
        trimmed === 'return;'
      ) {
        // Exclude inner arrow function returns like arr.map(x => return ...)
        if (!line.includes('=>') && !line.includes('.map') && !line.includes('.filter')) {
          fnReturns.push(lineNum);
        }
      }

      // Check hook calls
      let match;
      HOOK_REGEX.lastIndex = 0;
      while ((match = HOOK_REGEX.exec(line)) !== null) {
        const hookName = match[1];
        // Exclude custom hook definitions or non-React utilities if any
        if (hookName !== 'use' && !trimmed.startsWith('const use') && !trimmed.startsWith('function use')) {
          fnHooks.push({ lineNum, hookName, line: trimmed });
        }
      }
    }
  });

  // Final check for last component in file
  if (currentFn && fnReturns.length > 0 && fnHooks.length > 0) {
    const firstReturn = Math.min(...fnReturns);
    const hooksAfterReturn = fnHooks.filter((h) => h.lineNum > firstReturn);
    if (hooksAfterReturn.length > 0) {
      violationsFound.push({
        file,
        fn: currentFn,
        firstReturnLine: firstReturn,
        hooksAfterReturn,
      });
    }
  }
});

console.log(`✓ Scanned ${totalFilesScanned} source files.`);
console.log(`✓ Audited ~${totalComponentsAudited} React components.`);
console.log(`✓ Audited ~${totalCustomHooksAudited} custom Hooks.`);

if (violationsFound.length === 0) {
  console.log('=== REPOSITORY-WIDE HOOK AUDIT PASSED CLEANLY (0 VIOLATIONS FOUND) ===');
} else {
  console.log(`🚨 FOUND ${violationsFound.length} POTENTIAL HOOK-ORDER VIOLATIONS:`);
  violationsFound.forEach((v) => {
    console.log(`\nFile: ${v.file}`);
    console.log(`Function: "${v.fn}"`);
    console.log(`Early return at line ${v.firstReturnLine} before hook calls:`);
    v.hooksAfterReturn.forEach((h) => console.log(`  - Line ${h.lineNum} [${h.hookName}]: ${h.line}`));
  });
}
