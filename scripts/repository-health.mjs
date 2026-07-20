import fs from 'fs';
import path from 'path';

const workspaceRoot = process.cwd();
const reportPath = path.join(workspaceRoot, 'docs', 'repository_health_report.md');

const SIZE_THRESHOLD_LINES = 1000;
const LARGE_COMP_LIMIT = 500;
const LARGE_HOOK_LIMIT = 200;
const LARGE_UTIL_LIMIT = 150;

const allFiles = [];
const fileLinesMap = {};
const duplicateFilenames = {};
let docFilesCount = 0;
let srcFilesCount = 0;

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

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);

    // Check symlinks to prevent loops
    let stat;
    try {
      stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) continue;
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }

    if (stat && stat.isDirectory()) {
      if (!EXCLUDED_DIRS.has(file)) {
        scanDirectory(fullPath);
      }
    } else {
      const relPath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
      allFiles.push({ relPath, size: stat.size, basename: file });

      // Duplicate filename tracking
      if (duplicateFilenames[file]) {
        duplicateFilenames[file].push(relPath);
      } else {
        duplicateFilenames[file] = [relPath];
      }

      if (
        file.endsWith('.ts') ||
        file.endsWith('.tsx') ||
        file.endsWith('.js') ||
        file.endsWith('.jsx') ||
        file.endsWith('.java') ||
        file.endsWith('.mjs')
      ) {
        srcFilesCount++;
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        fileLinesMap[relPath] = lines.length;
      } else if (file.endsWith('.md')) {
        docFilesCount++;
      }
    }
  }
}

console.log('Scanning repository...');
scanDirectory(workspaceRoot);

// Filter duplicate filenames
const duplicates = Object.keys(duplicateFilenames)
  .filter(
    (name) =>
      duplicateFilenames[name].length > 1 &&
      !name.endsWith('.png') &&
      !name.endsWith('.json') &&
      !name.endsWith('.md')
  )
  .map((name) => ({ name, paths: duplicateFilenames[name] }));

// Find largest files
const largestFiles = [...allFiles].sort((a, b) => b.size - a.size).slice(0, 15);

// Find files over threshold
const largeSourceFiles = Object.keys(fileLinesMap)
  .map((filePath) => ({ path: filePath, lines: fileLinesMap[filePath] }))
  .filter((file) => file.lines > SIZE_THRESHOLD_LINES)
  .sort((a, b) => b.lines - a.lines);

// Segment large components, hooks, utilities
const largeComponents = [];
const largeHooks = [];
const largeUtils = [];

Object.keys(fileLinesMap).forEach((filePath) => {
  const lines = fileLinesMap[filePath];
  if (filePath.includes('components/') && lines > LARGE_COMP_LIMIT) {
    largeComponents.push({ path: filePath, lines });
  } else if (filePath.includes('hooks/') && lines > LARGE_HOOK_LIMIT) {
    largeHooks.push({ path: filePath, lines });
  } else if (filePath.includes('utils/') && lines > LARGE_UTIL_LIMIT) {
    largeUtils.push({ path: filePath, lines });
  }
});

// Dependency Overview (from package.json)
let dependenciesOverview = '';
const packageJsonPath = path.join(workspaceRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies || {}).length;
  const devDeps = Object.keys(pkg.devDependencies || {}).length;
  dependenciesOverview = `Workspace root package has ${deps} production dependencies and ${devDeps} devDependencies.`;
}

// Generate report content
const reportContent = `# Repository Health Report

This report provides a detailed health audit of the codebase, identifying large files, duplicated filenames, modularity leaks, and code documentation coverage.

---

## 1. Codebase Summary & Modularity Metrics
- **Total Source Files**: ${srcFilesCount}
- **Total Documentation Files**: ${docFilesCount}
- **Documentation Coverage Ratio**: ${((docFilesCount / (srcFilesCount || 1)) * 100).toFixed(1)}%
- **Dependencies Overview**: ${dependenciesOverview}

Source:
* \`package.json\`
* \`scripts/repository-health.mjs\`

---

## 2. Largest Files (by byte size)
| File Path | Size (KB) |
|---|---|
${largestFiles.map((f) => `| [${f.basename}](file:///${workspaceRoot.replace(/\\/g, '/')}/${f.relPath}) | ${(f.size / 1024).toFixed(1)} |`).join('\n')}

Source:
* \`scripts/repository-health.mjs\`

---

## 3. Files Exceeding Recommended Line Count (>${SIZE_THRESHOLD_LINES} lines)
These files represent prime candidates for modular refactoring:
${
  largeSourceFiles.length > 0
    ? largeSourceFiles
        .map(
          (f) =>
            `*   [${f.path}](file:///${workspaceRoot.replace(/\\/g, '/')}/${f.path}) (${f.lines} lines)`
        )
        .join('\n')
    : '*   *None detected! All files satisfy the line count recommendation.*'
}

Source:
* \`scripts/repository-health.mjs\`

---

## 4. Large Components, Hooks, & Utilities
Segmented list of oversized logical components:

### Large Components (>${LARGE_COMP_LIMIT} lines)
${
  largeComponents.length > 0
    ? largeComponents
        .map(
          (c) =>
            `*   [${c.path}](file:///${workspaceRoot.replace(/\\/g, '/')}/${c.path}) (${c.lines} lines)`
        )
        .join('\n')
    : '*   *None detected.*'
}

### Large Hooks (>${LARGE_HOOK_LIMIT} lines)
${
  largeHooks.length > 0
    ? largeHooks
        .map(
          (h) =>
            `*   [${h.path}](file:///${workspaceRoot.replace(/\\/g, '/')}/${h.path}) (${h.lines} lines)`
        )
        .join('\n')
    : '*   *None detected.*'
}

### Large Utilities (>${LARGE_UTIL_LIMIT} lines)
${
  largeUtils.length > 0
    ? largeUtils
        .map(
          (u) =>
            `*   [${u.path}](file:///${workspaceRoot.replace(/\\/g, '/')}/${u.path}) (${u.lines} lines)`
        )
        .join('\n')
    : '*   *None detected.*'
}

Source:
* \`scripts/repository-health.mjs\`

---

## 5. Duplicate Filenames (Clash warnings)
Clashing filenames in different workspace folders:
${
  duplicates.length > 0
    ? duplicates
        .map(
          (d) => `*   **${d.name}** present in:
${d.paths.map((p) => `    - [${p}](file:///${workspaceRoot.replace(/\\/g, '/')}/${p})`).join('\n')}`
        )
        .join('\n')
    : '*   *None detected.*'
}

Source:
* \`scripts/repository-health.mjs\`
`;

fs.writeFileSync(reportPath, reportContent, 'utf8');
console.log(`Repository health report successfully written to: ${reportPath}`);
