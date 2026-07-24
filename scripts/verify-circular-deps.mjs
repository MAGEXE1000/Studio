#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== RUNNING REPOSITORY-WIDE CIRCULAR DEPENDENCY DETECTOR ===');

const aliasMap = {
  '@workspace/studio-core': path.join(rootDir, 'packages/studio-core/src/index.ts'),
  '@workspace/ui-shared': path.join(rootDir, 'packages/ui-shared/src/index.ts'),
  '@workspace/ui-web': path.join(rootDir, 'packages/ui-web/src/index.ts'),
  '@workspace/ui-android': path.join(rootDir, 'packages/ui-android/src/index.ts'),
  '@/': path.join(rootDir, 'packages/ui-shared/src/'),
};

function walkDir(dir, filter, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (
        file !== 'node_modules' &&
        file !== 'dist' &&
        file !== '.git' &&
        file !== 'build' &&
        file !== 'tmp'
      ) {
        walkDir(fullPath, filter, callback);
      }
    } else if (filter(fullPath)) {
      callback(fullPath);
    }
  }
}

const sourceFiles = [];
walkDir(
  path.join(rootDir, 'packages'),
  (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.d.ts'),
  (f) => sourceFiles.push(f)
);
walkDir(
  path.join(rootDir, 'apps'),
  (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.d.ts'),
  (f) => sourceFiles.push(f)
);

function resolveImport(importPath, containingFile) {
  let resolved = null;

  if (importPath.startsWith('.')) {
    resolved = path.resolve(path.dirname(containingFile), importPath);
  } else if (importPath.startsWith('@workspace/')) {
    const pkgMatch = importPath.match(/^(@workspace\/[^/]+)(?:\/(.*))?$/);
    if (pkgMatch) {
      const pkgName = pkgMatch[1];
      const subPath = pkgMatch[2];
      if (aliasMap[pkgName]) {
        if (!subPath) {
          resolved = aliasMap[pkgName];
        } else {
          const pkgDir = path.dirname(aliasMap[pkgName]);
          resolved = path.resolve(pkgDir, subPath);
        }
      }
    }
  } else if (importPath.startsWith('@/')) {
    resolved = path.join(aliasMap['@/'], importPath.slice(2));
  }

  if (!resolved) return null;

  // Try file extensions
  const extensions = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

const graph = new Map();

sourceFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');
  const importRegex =
    /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\))/g;
  let match;
  const deps = new Set();

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    const resolved = resolveImport(importPath, file);
    if (resolved && resolved !== file) {
      deps.add(resolved);
    }
  }

  graph.set(file, Array.from(deps));
});

let cyclesFound = 0;
const visited = new Map(); // 0: unvisited, 1: visiting, 2: visited
const stack = [];

function dfs(node) {
  visited.set(node, 1);
  stack.push(node);

  const neighbors = graph.get(node) || [];
  for (const neighbor of neighbors) {
    const state = visited.get(neighbor) || 0;
    if (state === 1) {
      // Cycle detected!
      const cycleStartIdx = stack.indexOf(neighbor);
      const cyclePath = stack.slice(cycleStartIdx).concat(neighbor);
      const relCycle = cyclePath.map((p) => path.relative(rootDir, p)).join(' ->\n   ');
      console.error(`❌ [CIRCULAR DEPENDENCY DETECTED]\n   ${relCycle}\n`);
      cyclesFound++;
    } else if (state === 0) {
      dfs(neighbor);
    }
  }

  stack.pop();
  visited.set(node, 2);
}

sourceFiles.forEach((file) => {
  if ((visited.get(file) || 0) === 0) {
    dfs(file);
  }
});

console.log(`Scanned ${sourceFiles.length} source files for circular dependencies.`);

if (cyclesFound > 0) {
  console.error(`❌ CIRCULAR DEPENDENCY CHECK FAILED WITH ${cyclesFound} CYCLE(S).`);
  process.exit(1);
} else {
  console.log('✓ NO CIRCULAR DEPENDENCIES DETECTED.\n=== CIRCULAR DEPENDENCY CHECK PASSED CLEANLY ===\n');
  process.exit(0);
}
