import fs from 'fs';
import path from 'path';
import ts from 'typescript';

console.log('=== RUNNING REPOSITORY-WIDE AST REACT HOOK AUDITOR ===');

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

let totalComponentsAudited = 0;
let totalCustomHooksAudited = 0;
let violations = [];

function isHookName(name) {
  return /^use[A-Z0-9]/.test(name) && name !== 'use';
}

function isComponentName(name) {
  return /^[A-Z]/.test(name);
}

allFiles.forEach((file) => {
  const code = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);

  function inspectNode(node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    ) {
      let fnName = node.name ? node.name.text : null;
      if (!fnName && node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        fnName = node.parent.name.text;
      }

      if (fnName && (isComponentName(fnName) || isHookName(fnName))) {
        if (isHookName(fnName)) totalCustomHooksAudited++;
        else totalComponentsAudited++;

        if (node.body && ts.isBlock(node.body)) {
          let seenReturn = false;
          let firstReturnLine = 0;

          node.body.statements.forEach((stmt) => {
            // Check 1: Return statement in component root body
            if (ts.isReturnStatement(stmt)) {
              seenReturn = true;
              if (firstReturnLine === 0) {
                firstReturnLine = sourceFile.getLineAndCharacterOfPosition(stmt.getStart()).line + 1;
              }
            } else {
              // Check 2: If we saw a return, make sure NO hooks are called in statements after it
              if (seenReturn) {
                function checkPostReturnHooks(n) {
                  if (ts.isCallExpression(n)) {
                    const expr = n.expression;
                    if (ts.isIdentifier(expr) && isHookName(expr.text)) {
                      const line = sourceFile.getLineAndCharacterOfPosition(n.getStart()).line + 1;
                      violations.push({
                        file,
                        component: fnName,
                        type: 'HOOK_AFTER_EARLY_RETURN',
                        returnLine: firstReturnLine,
                        hookLine: line,
                        hookName: expr.text,
                      });
                    }
                  }
                  ts.forEachChild(n, checkPostReturnHooks);
                }
                checkPostReturnHooks(stmt);
              }

              // Check 3: Check conditional / loop / try-catch hook calls inside statement
              function checkConditionalHooks(n, inConditional = false, condType = '') {
                let currentCond = inConditional;
                let currentType = condType;

                if (
                  ts.isIfStatement(n) ||
                  ts.isSwitchStatement(n) ||
                  ts.isForStatement(n) ||
                  ts.isForInStatement(n) ||
                  ts.isForOfStatement(n) ||
                  ts.isWhileStatement(n) ||
                  ts.isDoStatement(n) ||
                  ts.isTryStatement(n) ||
                  ts.isConditionalExpression(n)
                ) {
                  currentCond = true;
                  currentType = ts.SyntaxKind[n.kind];
                }

                if (ts.isCallExpression(n)) {
                  const expr = n.expression;
                  if (ts.isIdentifier(expr) && isHookName(expr.text)) {
                    if (currentCond) {
                      const line = sourceFile.getLineAndCharacterOfPosition(n.getStart()).line + 1;
                      violations.push({
                        file,
                        component: fnName,
                        type: 'CONDITIONAL_HOOK',
                        condType: currentType,
                        hookLine: line,
                        hookName: expr.text,
                      });
                    }
                  }
                }

                // Stop traversing inside nested inner function definitions (they have their own hook scope)
                if (n !== stmt && (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n))) {
                  return;
                }

                ts.forEachChild(n, (child) => checkConditionalHooks(child, currentCond, currentType));
              }

              checkConditionalHooks(stmt);
            }
          });
        }
      }
    }

    ts.forEachChild(node, inspectNode);
  }

  inspectNode(sourceFile);
});

console.log(`✓ Total Files Scanned: ${allFiles.length}`);
console.log(`✓ Total React Components Audited: ${totalComponentsAudited}`);
console.log(`✓ Total Custom Hooks Audited: ${totalCustomHooksAudited}`);

if (violations.length === 0) {
  console.log('=== REPOSITORY-WIDE AST HOOK AUDIT PASSED CLEANLY (0 VIOLATIONS FOUND) ===');
} else {
  console.log(`🚨 FOUND ${violations.length} HOOK-ORDER VIOLATIONS:`);
  violations.forEach((v) => {
    if (v.type === 'HOOK_AFTER_EARLY_RETURN') {
      console.log(`\n[${v.type}] ${v.component} in ${v.file}`);
      console.log(`  - Early return at line ${v.returnLine}, Hook [${v.hookName}] at line ${v.hookLine}`);
    } else {
      console.log(`\n[${v.type}] ${v.component} in ${v.file}`);
      console.log(`  - Hook [${v.hookName}] inside ${v.condType} at line ${v.hookLine}`);
    }
  });
}
