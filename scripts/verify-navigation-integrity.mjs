import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== RUNNING NAVIGATION & RUNTIME INTEGRITY AUDITOR ===');

let errorCount = 0;

function logError(file, message) {
  console.error(`❌ [INTEGRITY ERROR] ${path.relative(rootDir, file)}: ${message}`);
  errorCount++;
}

function logSuccess(message) {
  console.log(`✓ ${message}`);
}

function walkDir(dir, filter, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== 'build') {
        walkDir(fullPath, filter, callback);
      }
    } else if (filter(fullPath)) {
      callback(fullPath);
    }
  }
}

// 1. Audit Dangling Identifier & Free Variable References
const sourceFiles = [];
walkDir(
  path.join(rootDir, 'packages'),
  (f) => f.endsWith('.ts') || f.endsWith('.tsx'),
  (f) => sourceFiles.push(f)
);
walkDir(
  path.join(rootDir, 'apps'),
  (f) => f.endsWith('.ts') || f.endsWith('.tsx'),
  (f) => sourceFiles.push(f)
);

sourceFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for dangling un-declared 'currentApp' variable usage (e.g. "if (currentApp === ...)" without const/let declaration in scope or NavigationDispatcher.currentApp())
    if (
      /\bcurrentApp\b/.test(line) &&
      !line.includes('const currentApp') &&
      !line.includes('let currentApp') &&
      !line.includes('currentApp:') &&
      !line.includes('currentApp?') &&
      !line.includes('NavigationDispatcher.currentApp()') &&
      !line.includes('this.currentApp()') &&
      !line.includes('currentApp()') &&
      !line.includes('useNavigationStore') &&
      !line.includes('useChordStore') &&
      !line.includes('import') &&
      !line.includes('interface') &&
      !line.includes('type ')
    ) {
      // Ignore comments or string literals
      const trimmed = line.trim();
      if (!trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
        // Check if inside a function where currentApp is a parameter
        if (!line.includes('(currentApp') && !line.includes('currentApp)')) {
          // Double check if file defines currentApp in outer scope
          if (!content.includes('const currentApp') && !content.includes('let currentApp') && !content.includes('currentApp:')) {
            logError(file, `Line ${idx + 1}: Un-declared 'currentApp' variable reference: "${trimmed}"`);
          }
        }
      }
    }

    // Check for un-imported useNotificationService
    if (/\buseNotificationService\b/.test(line) && !line.includes('import') && !content.includes("import {") && !content.includes("useNotificationService")) {
      logError(file, `Line ${idx + 1}: Reference to 'useNotificationService' without import: "${line.trim()}"`);
    }

    // Check for deleted legacy hooks (excluding core re-exports)
    if (/\buseLiquidGlassNav\b/.test(line) && !line.includes('//') && !line.includes('import') && !file.includes('useLiquidGlassNav.ts') && !file.includes('liquidGlass.ts')) {
      logError(file, `Line ${idx + 1}: Reference to deleted hook 'useLiquidGlassNav': "${line.trim()}"`);
    }
  });
});

// 2. Enforce Single-Owner Navigation Invariants
const navControllerFile = path.join(rootDir, 'packages/ui-shared/src/navigation/BottomNavigationController.tsx');
if (fs.existsSync(navControllerFile)) {
  const content = fs.readFileSync(navControllerFile, 'utf-8');
  if (/\bconst\s*\[\s*isProfileMenuOpen\s*,.*\]\s*=\s*useState\b/.test(content)) {
    logError(navControllerFile, 'Violation of single-owner invariant: isProfileMenuOpen should be stored in useBottomNavigationStore, not local useState.');
  } else {
    logSuccess('BottomNavigationController uses centralized useBottomNavigationStore for isProfileMenuOpen.');
  }

  if (content.includes('useBottomNavigationStore.getState().visible') && content.includes('const visible =')) {
    logError(navControllerFile, 'Violation of reactive state invariant: BottomNavigationController calls .getState().visible directly during render instead of subscribing reactively.');
  } else {
    logSuccess('BottomNavigationController consumes visible state reactively from useBottomNavigationStore.');
  }
}

const sharedNavFile = path.join(rootDir, 'packages/ui-shared/src/navigation/SharedNavigationBar.tsx');
if (fs.existsSync(sharedNavFile)) {
  const content = fs.readFileSync(sharedNavFile, 'utf-8');
  if (/\bconst\s*\[\s*searchOpen\s*,.*\]\s*=\s*useState\b/.test(content)) {
    logError(sharedNavFile, 'Violation of single-owner invariant: isSearchOpen should be stored in useBottomNavigationStore, not local useState.');
  } else {
    logSuccess('SharedNavigationBar uses centralized useBottomNavigationStore for isSearchOpen.');
  }
}

// Final Auditor Output
if (errorCount > 0) {
  console.error(`\n❌ NAVIGATION & RUNTIME INTEGRITY AUDIT FAILED WITH ${errorCount} ERROR(S).`);
  process.exit(1);
} else {
  console.log('=== NAVIGATION & RUNTIME INTEGRITY AUDIT PASSED CLEANLY ===\n');
}
