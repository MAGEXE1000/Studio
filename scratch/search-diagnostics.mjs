import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/updater/diagnostics.ts', 'utf8');
const lines = src.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('installedVersionCode')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
