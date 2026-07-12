import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/otaUpdate.ts', 'utf8');
const lines = src.split('\n');

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export async function triggerDowngrade')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  console.log(`Found triggerDowngrade at line ${startIdx + 1}`);
  console.log(lines.slice(startIdx, startIdx + 80).join('\n'));
} else {
  console.log('triggerDowngrade not found.');
}
