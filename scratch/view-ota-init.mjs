import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/otaUpdate.ts', 'utf8');
const lines = src.split('\n');

// Print first 100 lines and last 100 lines
console.log('=== FIRST 100 LINES ===');
console.log(lines.slice(0, 100).join('\n'));
console.log('\n=== LAST 100 LINES ===');
console.log(lines.slice(-100).join('\n'));
