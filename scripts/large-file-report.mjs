import fs from 'fs';
import path from 'path';

const workspaceRoot = process.cwd();
const reportPath = path.join(workspaceRoot, 'docs', 'large_file_report.md');

const tsFiles = [];
const reactFiles = [];
const hookFiles = [];
const utilFiles = [];
const docFiles = [];

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.agents',
  'build',
  '.gradle',
  '.capacitor',
  'capacitor-cordova-android-plugins',
  'firebase-public',
  'firebase-public-android',
  'gradle',
  'artifacts',
  'scratch',
  'screenshots',
  '.firebase',
]);

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);

    // Check symlinks to prevent loops
    let stat;
    try {
      stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) continue; // skip symlinks to prevent cycles
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue; // skip files we can't access
    }

    if (stat && stat.isDirectory()) {
      if (!EXCLUDED_DIRS.has(file)) {
        scanDir(fullPath);
      }
    } else {
      const relPath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;

      const fileData = { path: relPath, basename: file, lines };

      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        reactFiles.push(fileData);
        if (file.startsWith('use') || relPath.includes('/hooks/')) {
          hookFiles.push(fileData);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.mjs')) {
        tsFiles.push(fileData);
        if (file.startsWith('use') || relPath.includes('/hooks/')) {
          hookFiles.push(fileData);
        } else if (
          relPath.includes('/utils/') ||
          relPath.includes('/helpers/') ||
          file.includes('helper') ||
          file.includes('util')
        ) {
          utilFiles.push(fileData);
        }
      } else if (file.endsWith('.md')) {
        docFiles.push(fileData);
      }
    }
  }
}

console.log('Running large files scan...');
scanDir(workspaceRoot);

// Sort helper
const sortByLines = (arr) => arr.sort((a, b) => b.lines - a.lines).slice(0, 10);

const topTs = sortByLines(tsFiles);
const topReact = sortByLines(reactFiles);
const topHooks = sortByLines(hookFiles);
const topUtils = sortByLines(utilFiles);
const topDocs = sortByLines(docFiles);

// Determine refactoring candidates (files > 500 lines)
const refactorCandidates = [];
[...tsFiles, ...reactFiles].forEach((f) => {
  if (f.lines > 500) {
    refactorCandidates.push(f);
  }
});
refactorCandidates.sort((a, b) => b.lines - a.lines);

const mdContent = `# Large File Report

This report indexes the largest source code and documentation files in the workspace, highlighting components, hooks, utilities, and documentation that exceed line count thresholds.

---

## 1. Top 10 Largest TS / JS Core Files
| File Path | Lines of Code |
|---|---|
${topTs.map((f) => `| [${f.basename}](file:///${workspaceRoot.replace(/\\/g, '/')}/${f.path}) | ${f.lines} |`).join('\n')}

Source:
* \`scripts/large-file-report.mjs\`

---

## 2. Top 10 Largest React Component Files
| Component Path | Lines of Code |
|---|---|
${topReact.map((f) => `| [${f.basename}](file:///${workspaceRoot.replace(/\\/g, '/')}/${f.path}) | ${f.lines} |`).join('\n')}

Source:
* \`scripts/large-file-report.mjs\`

---

## 3. Top 10 Largest Custom Hooks
| Hook File | Lines of Code |
|---|---|
${
  topHooks.length > 0
    ? topHooks
        .map(
          (f) =>
            `| [${f.basename}](file:///${workspaceRoot.replace(/\\/g, '/')}/${f.path}) | ${f.lines} |`
        )
        .join('\n')
    : '| *None found in the codebase.* | 0 |'
}

Source:
* \`scripts/large-file-report.mjs\`

---

## 4. Top 10 Largest Utility / Helper Modules
| Utility Path | Lines of Code |
|---|---|
${
  topUtils.length > 0
    ? topUtils
        .map(
          (f) =>
            `| [${f.basename}](file:///${workspaceRoot.replace(/\\/g, '/')}/${f.path}) | ${f.lines} |`
        )
        .join('\n')
    : '| *None found in the codebase.* | 0 |'
}

Source:
* \`scripts/large-file-report.mjs\`

---

## 5. Top 10 Largest Documentation Files
| Document | Lines of Code |
|---|---|
${topDocs.map((f) => `| [${f.basename}](file:///${workspaceRoot.replace(/\\/g, '/')}/${f.path}) | ${f.lines} |`).join('\n')}

Source:
* \`scripts/large-file-report.mjs\`

---

## 6. Recommended Refactoring Candidates (Files > 500 lines)
These files are recommended for modular split audits:
${
  refactorCandidates.length > 0
    ? refactorCandidates
        .map(
          (c) =>
            `*   [${c.path}](file:///${workspaceRoot.replace(/\\/g, '/')}/${c.path}) (${c.lines} lines)`
        )
        .join('\n')
    : '*   *None detected! All files satisfy the split threshold.*'
}

Source:
* \`scripts/large-file-report.mjs\`
`;

fs.writeFileSync(reportPath, mdContent, 'utf8');
console.log(`Large file report successfully generated: ${reportPath}`);
