import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/otaUpdate.ts', 'utf8');
const lines = src.split('\n');

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('checkForUpdate') && (lines[i].includes('async') || lines[i].includes('function'))) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  console.log(`Found checkForUpdate at line ${startIdx + 1}`);
  console.log(lines.slice(Math.max(0, startIdx - 5), startIdx + 120).join('\n'));
} else {
  console.log('checkForUpdate not found.');
}
