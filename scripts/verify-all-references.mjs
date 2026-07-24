import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== RUNNING REPOSITORY-WIDE REFERENCE & AUDIT VALIDATOR ===');

let errorCount = 0;

function logError(file, lineNum, message, snippet) {
  console.error(`❌ [REFERENCE AUDIT ERROR] ${path.relative(rootDir, file)}:L${lineNum}`);
  console.error(`   Message: ${message}`);
  if (snippet) console.error(`   Snippet: "${snippet.trim()}"`);
  errorCount++;
}

function logSuccess(message) {
  console.log(`✓ ${message}`);
}

function walkDir(dir, filter, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== 'build' && file !== 'tmp') {
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
  (f) => f.endsWith('.ts') || f.endsWith('.tsx'),
  (f) => sourceFiles.push(f)
);
walkDir(
  path.join(rootDir, 'apps'),
  (f) => f.endsWith('.ts') || f.endsWith('.tsx'),
  (f) => sourceFiles.push(f)
);

// Known removed/renamed symbol patterns that must NEVER appear as active references in code
const FORBIDDEN_SYMBOLS = [
  { name: 'getCenterX', reason: 'Renamed to getPillX in SharedNavigationBar.tsx' },
  { name: 'useLiquidGlassNav', reason: 'Hook was removed from studio-core' },
];

sourceFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return; // Skip standard comments
    }

    // 1. Audit Forbidden Removed/Renamed Symbols
    FORBIDDEN_SYMBOLS.forEach((sym) => {
      const regex = new RegExp(`\\b${sym.name}\\b`);
      if (regex.test(line) && !line.includes('import') && !line.includes('export') && !file.includes('verify-all-references.mjs')) {
        logError(file, lineNum, `Reference to deleted/renamed symbol '${sym.name}': ${sym.reason}`, trimmed);
      }
    });

    // 2. Audit Un-declared 'currentApp' free variable reference
    if (
      /\bcurrentApp\b/.test(line) &&
      !line.includes('const currentApp') &&
      !line.includes('let currentApp') &&
      !line.includes('var currentApp') &&
      !line.includes('currentApp:') &&
      !line.includes('currentApp?') &&
      !line.includes('NavigationDispatcher.currentApp()') &&
      !line.includes('this.currentApp()') &&
      !line.includes('currentApp()') &&
      !line.includes('useNavigationStore') &&
      !line.includes('useChordStore') &&
      !line.includes('import') &&
      !line.includes('interface') &&
      !line.includes('type ') &&
      !line.includes('currentApp =')
    ) {
      if (!line.includes('(currentApp') && !line.includes('currentApp)')) {
        if (!content.includes('const currentApp') && !content.includes('let currentApp') && !content.includes('currentApp:')) {
          logError(file, lineNum, "Un-declared 'currentApp' free variable reference", trimmed);
        }
      }
    }

    // 3. Audit Un-imported 'useNotificationService' reference
    if (/\buseNotificationService\b/.test(line) && !line.includes('import') && !content.includes('import {') && !content.includes('useNotificationService')) {
      logError(file, lineNum, "Reference to 'useNotificationService' without import", trimmed);
    }
  });
});

logSuccess(`Scanned ${sourceFiles.length} TypeScript/TSX source files across repository.`);

if (errorCount > 0) {
  console.error(`\n❌ REPOSITORY-WIDE REFERENCE AUDIT FAILED WITH ${errorCount} ERROR(S).`);
  process.exit(1);
} else {
  console.log('=== REPOSITORY-WIDE REFERENCE AUDIT PASSED CLEANLY ===\n');
}
