import fs from 'fs';

const src = fs.readFileSync('packages/ui-shared/src/components/DevToolsDashboard.tsx', 'utf8');
const lines = src.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('renderLabButtonBlock')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
