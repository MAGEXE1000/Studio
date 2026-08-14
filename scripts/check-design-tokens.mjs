#!/usr/bin/env node
/**
 * check-design-tokens.mjs — Fix X regression guard
 *
 * Scans the Hub + Settings scope (the Fix W migration boundary) for hardcoded
 * styling values that should reference the canonical token file (tokens.css).
 *
 * Scope:
 *   packages/ui-shared/src/features/hub/
 *   packages/ui-shared/src/shared/settings/
 *
 * Run:
 *   node scripts/check-design-tokens.mjs
 *   pnpm check:tokens           (after adding to package.json)
 *
 * Exit codes:
 *   0 — all clean
 *   1 — one or more violations found
 *
 * Design notes:
 *   Rules are intentionally high-specificity to avoid false positives.
 *   We flag the exact literal values that were migrated in Fix W, not every
 *   numeric pixel value. Icon sizes (fontSize:18, fontSize:32 on Material
 *   Symbols spans) are NOT flagged — they are rendering sizes, not layout
 *   tokens. See the RULES array for rationale on each pattern.
 *
 *   To suppress a legitimate exception, add an inline comment:
 *     // token-guard-ignore
 *   on the same line. Use sparingly and add a comment explaining why.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ── Scoped directories (Fix W migration boundary) ──────────────────────────
const SCOPE_DIRS = [
  path.join(repoRoot, 'packages/ui-shared/src/features/hub'),
  path.join(repoRoot, 'packages/ui-shared/src/features/updater'),
  path.join(repoRoot, 'packages/ui-shared/src/shared/settings'),
  path.join(repoRoot, 'packages/ui-shared/src/shared/layout'),
];

// ── Rules ───────────────────────────────────────────────────────────────────
// Each rule is a { pattern, message, token } object.
// pattern — RegExp applied to each source line
// message — printed when the pattern matches
// token   — the CSS custom property that should be used instead
//
// False-positive analysis:
//   '14px 20px'   — density-row-pad shorthand; no other UI uses this exact pairing
//   '32px 48px'   — desktop right-pane layout; unique in the codebase
//   '40px 0'      — section-spacer pattern; unusual shorthand
//   maxWidth 640px/720px — content-max-w* context; always structural in this scope
//   fontSize 28   — no Material Symbol icon is 28 px; always a structural title
//   surface rgba  — exact alpha values tuned in Fix O; any direct use bypasses theming
const RULES = [
  // ── Structural padding shorthands ─────────────────────────────────────────
  {
    pattern: /padding:\s*['"]14px\s+20px['"]/,
    message: "Hardcoded padding '14px 20px' — use var(--density-row-pad)",
    token: '--density-row-pad',
  },
  {
    pattern: /padding:\s*['"]32px\s+48px['"]/,
    message: "Hardcoded padding '32px 48px' — use 'var(--space-8) var(--space-12)'",
    token: '--space-8, --space-12',
  },
  {
    pattern: /padding:\s*['"]40px\s+0['"]/,
    message: "Hardcoded padding '40px 0' — use 'var(--space-10) 0'",
    token: '--space-10',
  },

  // ── Content max-widths ────────────────────────────────────────────────────
  {
    // Matches maxWidth: '640px' but NOT height: '640px'
    pattern: /maxWidth:\s*['"]640px['"]/,
    message: "Hardcoded maxWidth '640px' — use var(--content-max-w)",
    token: '--content-max-w',
  },
  {
    pattern: /maxWidth:\s*['"]720px['"]/,
    message: "Hardcoded maxWidth '720px' — use var(--content-max-w-wide)",
    token: '--content-max-w-wide',
  },

  // ── Typography: desktop settings page title ───────────────────────────────
  // fontSize:28 is never an icon size; it is always the desktop-settings h1.
  {
    pattern: /fontSize:\s*28\b/,
    message: "Hardcoded fontSize 28 — use var(--font-display-page) for desktop settings h1",
    token: '--font-display-page',
  },

  // ── Floating-surface rgba values ──────────────────────────────────────────
  // These exact values are the dark-mode bottom-nav and top-bar alphas (Fix O).
  // Direct use bypasses light/AMOLED theme overrides in tokens.css.
  {
    pattern: /rgba\(\s*12\s*,\s*12\s*,\s*14\s*,\s*0\.45\s*\)/,
    message: "Hardcoded float-surface rgba(12,12,14,0.45) — use var(--surface-float-bg)",
    token: '--surface-float-bg',
  },
  {
    pattern: /rgba\(\s*12\s*,\s*12\s*,\s*14\s*,\s*0\.12\s*\)/,
    message: "Hardcoded topbar-surface rgba(12,12,14,0.12) — use var(--surface-topbar-bg)",
    token: '--surface-topbar-bg',
  },
  {
    pattern: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.78\s*\)/,
    message: "Hardcoded light float-surface rgba(255,255,255,0.78) — use var(--surface-float-bg)",
    token: '--surface-float-bg',
  },
  // ── Structural layouts and spacing (Fix W) ───────────────────────────────
  {
    pattern: /padding:\s*['"]24px\s+20px['"]/,
    message: "Hardcoded padding '24px 20px' — use 'var(--space-6) var(--space-5)'",
    token: '--space-6, --space-5',
  },
  {
    pattern: /margin:\s*['"]16px\s+0\s+0['"]/,
    message: "Hardcoded margin '16px 0 0' — use 'var(--space-4) 0 0'",
    token: '--space-4',
  },
  {
    pattern: /margin:\s*['"]14px\s+0\s+0['"]/,
    message: "Hardcoded margin '14px 0 0' — use 'var(--space-3) 0 0'",
    token: '--space-3',
  },
  {
    // Match gap 16 only inside flex layout containers
    pattern: /display:\s*['"]flex['"].*gap:\s*16\b|gap:\s*16\b.*display:\s*['"]flex['"]|flexDirection:\s*['"]column['"].*gap:\s*16\b|gap:\s*16\b.*flexDirection:\s*['"]column['"]/,
    message: "Hardcoded layout gap 16 — use var(--space-4) or appropriate token",
    token: '--space-4',
  },
  {
    // Match gap 20 inside flex layout containers
    pattern: /display:\s*['"]flex['"].*gap:\s*20\b|gap:\s*20\b.*display:\s*['"]flex['"]|flexDirection:\s*['"]column['"].*gap:\s*20\b|gap:\s*20\b.*flexDirection:\s*['"]column['"]/,
    message: "Hardcoded layout gap 20 — use var(--space-5) or appropriate token",
    token: '--space-5',
  },
  {
    // Match paddingBottom 24 inside structural layout styles
    pattern: /paddingBottom:\s*24\b/,
    message: "Hardcoded paddingBottom 24 — use var(--space-6) or appropriate token",
    token: '--space-6',
  },
  {
    pattern: /paddingLeft:\s*['"]24px['"]/,
    message: "Hardcoded paddingLeft '24px' — use var(--page-inset-h)",
    token: '--page-inset-h',
  },
  {
    pattern: /paddingRight:\s*['"]24px['"]/,
    message: "Hardcoded paddingRight '24px' — use var(--page-inset-h)",
    token: '--page-inset-h',
  },
  // ── Typography (Fix W) ───────────────────────────────────────────────────
  {
    // Match fontSize 24 but only when NOT on an icon line
    pattern: /^(?!.*(material-symbols|material-icons|person|system_update|refresh)).*fontSize:\s*24\b/,
    message: "Hardcoded fontSize 24 — use var(--font-display-sm)",
    token: '--font-display-sm',
  },
  {
    // Match ANY numeric fontSize: 11 not on a material-symbols/icon line and not already a var() reference.
    // All 11px usages in this scope are section-label headings — they should all use --font-section-label.
    pattern: /^(?!.*(material-symbols|material-icons)).*fontSize:\s*11\b(?!.*var\()/,
    message: "Hardcoded fontSize 11 — use var(--font-section-label)",
    token: '--font-section-label',
  },
  // ── Glassmorphism backdrop blurs (Fix W) ─────────────────────────────────
  {
    pattern: /blur\(25px\)/,
    message: "Hardcoded backdrop-filter blur(25px) — use var(--surface-float-blur)",
    token: '--surface-float-blur',
  },
  {
    pattern: /blur\(20px\)/,
    message: "Hardcoded backdrop-filter blur(20px) — use var(--surface-float-blur)",
    token: '--surface-float-blur',
  },
  {
    pattern: /blur\(16px\s*saturate\(1.8\)\)/,
    message: "Hardcoded backdrop-filter blur(16px) saturate(1.8) — use var(--surface-float-blur)",
    token: '--surface-float-blur',
  },
  {
    pattern: /blur\(16px\)/,
    message: "Hardcoded backdrop-filter blur(16px) — use var(--surface-float-blur)",
    token: '--surface-float-blur',
  },
];

// ── File walker ──────────────────────────────────────────────────────────────
function readdirRecursive(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== '.git') {
        results = results.concat(readdirRecursive(filePath));
      }
    } else {
      results.push(filePath);
    }
  }
  return results;
}

// ── Checker ──────────────────────────────────────────────────────────────────
let violationCount = 0;

function checkFile(filePath) {
  if (!/\.(ts|tsx)$/.test(filePath)) return;

  // Exclude component definitions, tools, and indicators that aren't page screens
  const basename = path.basename(filePath);
  if (
    basename === 'UpdateIndicator.tsx' ||
    basename === 'SettingControls.tsx' ||
    basename === 'InspectorRouteTracer.tsx' ||
    basename === 'faqConstants.tsx'
  ) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Respect inline suppression comments
    if (line.includes('token-guard-ignore')) return;

    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        const relPath = path.relative(repoRoot, filePath);
        const lineNum = idx + 1;
        console.error(`  ✗ ${relPath}:${lineNum}`);
        console.error(`    ${rule.message}`);
        console.error(`    → Replace with: var(${rule.token})`);
        console.error(`    Source: ${line.trim()}`);
        console.error('');
        violationCount++;
      }
    }
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('Design token regression guard (Fix X)');
console.log(`Scope: Hub + Settings (${SCOPE_DIRS.length} directories)\n`);

for (const dir of SCOPE_DIRS) {
  const files = readdirRecursive(dir);
  for (const file of files) {
    checkFile(file);
  }
}

if (violationCount > 0) {
  console.error(`✗ Token check failed — ${violationCount} violation(s) found.`);
  console.error('  Each flagged value should reference the canonical token.');
  console.error('  See packages/ui-shared/src/styles/tokens.css (Fix V block).');
  console.error('  To suppress a known exception: add // token-guard-ignore on the same line.');
  process.exit(1);
} else {
  console.log('✓ Token check passed — no hardcoded values detected in scope.');
  process.exit(0);
}
