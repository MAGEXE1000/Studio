import fs from 'fs';
import ts from 'typescript';

console.log('=== TESTING AST REACT HOOK AUDITOR ===');

const file = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\apps\\studio-android\\src\\App.tsx';
const code = fs.readFileSync(file, 'utf8');

const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);

let componentsAudited = 0;
let customHooksAudited = 0;
let violations = [];

function isHookName(name) {
  return /^use[A-Z0-9]/.test(name);
}

function isComponentName(name) {
  return /^[A-Z]/.test(name);
}

function inspectNode(node, currentFnName = null, currentFnStatements = []) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  ) {
    const fnName = node.name ? node.name.text : (node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) ? node.parent.name.text : null);
    
    if (fnName && (isComponentName(fnName) || isHookName(fnName))) {
      if (isHookName(fnName)) customHooksAudited++;
      else componentsAudited++;

      // Scan body statements of this component top-level ONLY
      if (node.body && ts.isBlock(node.body)) {
        let seenReturn = false;
        let returnLine = 0;

        node.body.statements.forEach((stmt) => {
          if (ts.isReturnStatement(stmt)) {
            // Check if return has an expression or is a guard return
            seenReturn = true;
            returnLine = sourceFile.getLineAndCharacterOfPosition(stmt.getStart()).line + 1;
          } else if (seenReturn) {
            // Check if hooks are called AFTER return in top-level statements
            function checkStmtForHooks(n) {
              if (ts.isCallExpression(n)) {
                const expr = n.expression;
                if (ts.isIdentifier(expr) && isHookName(expr.text)) {
                  const line = sourceFile.getLineAndCharacterOfPosition(n.getStart()).line + 1;
                  violations.push({
                    file,
                    component: fnName,
                    returnLine,
                    hookLine: line,
                    hookName: expr.text
                  });
                }
              }
              ts.forEachChild(n, checkStmtForHooks);
            }
            checkStmtForHooks(stmt);
          }
        });
      }
    }
  }

  ts.forEachChild(node, (child) => inspectNode(child, currentFnName, currentFnStatements));
}

inspectNode(sourceFile);

console.log(`Components Audited: ${componentsAudited}, Custom Hooks: ${customHooksAudited}`);
console.log(`AST Violations Found: ${violations.length}`);
if (violations.length > 0) {
  console.log(violations);
}
