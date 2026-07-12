import fs from 'fs';

const src = fs.readFileSync('packages/ui-shared/src/components/StudioHub.tsx', 'utf8');
const lines = src.split('\n');

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderUpdaterContent(')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  console.log(`Found renderUpdaterContent at line ${startIdx + 1}`);
  console.log(lines.slice(startIdx, startIdx + 150).join('\n'));
} else {
  console.log('renderUpdaterContent not found.');
}
