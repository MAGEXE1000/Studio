import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/otaUpdate.ts', 'utf8');
const lines = src.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('useOtaUpdate')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
