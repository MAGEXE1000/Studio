import fs from 'fs';

const src = fs.readFileSync('packages/ui-shared/src/components/StudioHub.tsx', 'utf8');
const lines = src.split('\n');

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('HubUpdaterPage')) {
    console.log(`${i + 1}: ${lines[i].trim()}`);
  }
}
