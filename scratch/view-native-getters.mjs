import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/otaUpdate.ts', 'utf8');
const lines = src.split('\n');

console.log(lines.slice(165, 205).join('\n'));
