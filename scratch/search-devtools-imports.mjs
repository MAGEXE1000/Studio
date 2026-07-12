import fs from 'fs';

const src = fs.readFileSync('packages/ui-shared/src/components/DevToolsDashboard.tsx', 'utf8');
const lines = src.split('\n');

for (let i = 0; i < 60; i++) {
  if (lines[i].includes('@workspace/studio-core')) {
    console.log(`Line ${i + 1}:`);
    console.log(lines.slice(Math.max(0, i - 10), i + 5).join('\n'));
  }
}
