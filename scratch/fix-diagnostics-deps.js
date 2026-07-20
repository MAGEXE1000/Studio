const fs = require('fs');
const path = require('path');

const devToolsDashboardPath = path.join(
  process.cwd(),
  'packages',
  'ui-shared',
  'src',
  'components',
  'devtools',
  'DevToolsDashboard.tsx'
);
let content = fs.readFileSync(devToolsDashboardPath, 'utf8');

// Remove UpdaterDiagnosticsPage import
content = content.replace(
  /import UpdaterDiagnosticsPage from '\.\.\/updater-diagnostics\/UpdaterDiagnosticsPage';\n?/,
  ''
);

// Remove diagnosticsGenerator import
content = content.replace(
  /import \{ generateUnifiedReport \} from '\.\.\/updater-diagnostics\/diagnosticsGenerator';\n?/,
  ''
);

// Add getDiagnosticsReport if missing
if (!content.includes(`import { getDiagnosticsReport }`)) {
  content = content.replace(
    /import \{ UpdaterFlightRecorder /,
    "import { getDiagnosticsReport } from '@workspace/studio-core';\nimport { UpdaterFlightRecorder "
  );
}

content = content.replace(
  /const fullReport = generateUnifiedReport\([\s\S]*?\);/,
  'const fullReport = await getDiagnosticsReport();'
);

// Since we added an await, we need to make sure the containing function is async.
// It's probably in an onClick handler or similar. We should check if the function is async, but this is a rough replacement. Let's just fix the function if it errors out later. Actually, wait. Let's see if generateUnifiedReport was used synchronously.
// Let's modify it to be async.
content = content.replace(
  /const handleCopyReport = \(\) => \{/g,
  'const handleCopyReport = async () => {'
);
content = content.replace(
  /const handleCopyReport = \(type: 'full' | 'summary' | 'section'\) => \{/g,
  "const handleCopyReport = async (type: 'full' | 'summary' | 'section') => {"
);

// Remove UpdaterDiagnosticsPage rendering
content = content.replace(
  /<UpdaterDiagnosticsPage onBack=\{\(\) => setSubView\('dashboard'\)\} \/>/,
  '<div>Updater Diagnostics removed</div>'
);

fs.writeFileSync(devToolsDashboardPath, content, 'utf8');

const indexPath = path.join(process.cwd(), 'packages', 'ui-shared', 'src', 'index.ts');
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(
  /export \{ default as UpdaterDiagnosticsPage \} from '\.\/components\/updater-diagnostics\/UpdaterDiagnosticsPage';\n?/,
  ''
);
fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log('Cleaned up DevToolsDashboard and index.ts');
